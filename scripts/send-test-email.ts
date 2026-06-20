/**
 * Test-send a transactional email with preflight validation.
 *
 * Usage:
 *   bun scripts/send-test-email.ts <recipient@example.com> [--skip-smtp] [--force]
 *
 * Preflight checks (in order):
 *   1. RFC-5322-ish format validation
 *   2. Domain MX record lookup (dns/promises)
 *   3. Suppression list check (email_send_log / suppressed_emails)
 *   4. Optional SMTP RCPT TO probe against the first MX host
 *
 * If any check fails the email is NOT enqueued. Use --force to send anyway
 * (skips SMTP probe only — format + MX + suppression still block).
 */
import * as React from 'react'
import { render } from '@react-email/components'
import { createClient } from '@supabase/supabase-js'
import { resolveMx } from 'node:dns/promises'
import { createConnection } from 'node:net'
import { template } from '../src/lib/email-templates/test-ping'

const SITE_NAME = 'graft-guardian-protocol'
const SENDER_DOMAIN = 'notify.graftgen.com'
const FROM_DOMAIN = 'graftgen.com'

const args = process.argv.slice(2)
const recipient = (args.find((a) => !a.startsWith('--')) ?? 'kontakt@graftgen.com').trim()
const skipSmtp = args.includes('--skip-smtp')
const force = args.includes('--force')

function fail(msg: string): never {
  console.error(`✗ ${msg}`)
  process.exit(1)
}
function ok(msg: string) {
  console.log(`✓ ${msg}`)
}

// 1) Format ---------------------------------------------------------------
const EMAIL_RE =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/
if (!EMAIL_RE.test(recipient) || recipient.length > 254) {
  fail(`Invalid email format: "${recipient}"`)
}
ok(`Format valid: ${recipient}`)

const domain = recipient.split('@')[1].toLowerCase()

// 2) MX lookup ------------------------------------------------------------
let mxHosts: { exchange: string; priority: number }[] = []
try {
  mxHosts = (await resolveMx(domain)).sort((a, b) => a.priority - b.priority)
  if (mxHosts.length === 0) fail(`No MX records for ${domain}`)
  ok(`MX found (${mxHosts.length}): ${mxHosts[0].exchange} (prio ${mxHosts[0].priority})`)
} catch (e: any) {
  fail(`MX lookup failed for ${domain}: ${e.code ?? e.message}`)
}

// 3) Suppression / bounce history -----------------------------------------
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const { data: suppressed } = await supabase
  .from('suppressed_emails')
  .select('email, reason')
  .eq('email', recipient.toLowerCase())
  .maybeSingle()
if (suppressed && !force) {
  fail(`Recipient is on suppression list (reason: ${suppressed.reason ?? 'unknown'}). Re-run with --force to override.`)
}
ok('Not on suppression list')

const { data: bounces } = await supabase
  .from('email_send_log')
  .select('status, error_message, created_at')
  .eq('recipient_email', recipient)
  .in('status', ['bounced', 'failed', 'dlq'])
  .order('created_at', { ascending: false })
  .limit(1)
if (bounces && bounces.length > 0 && !force) {
  const b = bounces[0]
  fail(`Previous ${b.status} for this recipient (${b.created_at}): ${b.error_message ?? 'no detail'}. Re-run with --force to retry.`)
}

// 4) SMTP RCPT TO probe ---------------------------------------------------
async function smtpProbe(host: string, addr: string, timeoutMs = 8000): Promise<{ code: number; msg: string }> {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host, port: 25 })
    let buf = ''
    let step = 0
    const steps = [
      `EHLO ${SENDER_DOMAIN}\r\n`,
      `MAIL FROM:<probe@${SENDER_DOMAIN}>\r\n`,
      `RCPT TO:<${addr}>\r\n`,
      `QUIT\r\n`,
    ]
    let rcptResp: { code: number; msg: string } | null = null
    const timer = setTimeout(() => { socket.destroy(); reject(new Error('SMTP timeout')) }, timeoutMs)
    socket.setEncoding('utf8')
    socket.on('data', (chunk) => {
      buf += chunk
      const lines = buf.split(/\r?\n/)
      buf = lines.pop() ?? ''
      for (const line of lines) {
        const m = /^(\d{3})([ -])(.*)$/.exec(line)
        if (!m || m[2] === '-') continue
        const code = parseInt(m[1], 10)
        if (step === 3) rcptResp = { code, msg: m[3] }
        if (step < steps.length) socket.write(steps[step++])
      }
    })
    socket.on('error', (e) => { clearTimeout(timer); reject(e) })
    socket.on('close', () => {
      clearTimeout(timer)
      if (rcptResp) resolve(rcptResp)
      else reject(new Error('SMTP closed before RCPT'))
    })
  })
}

if (skipSmtp) {
  console.log('… SMTP probe skipped (--skip-smtp)')
} else {
  let probed = false
  for (const mx of mxHosts.slice(0, 2)) {
    try {
      const r = await smtpProbe(mx.exchange.replace(/\.$/, ''), recipient)
      probed = true
      if (r.code >= 200 && r.code < 300) {
        ok(`SMTP RCPT accepted by ${mx.exchange}: ${r.code} ${r.msg}`)
      } else if (r.code >= 500 && !force) {
        fail(`SMTP RCPT rejected by ${mx.exchange}: ${r.code} ${r.msg}. Re-run with --force or --skip-smtp to override.`)
      } else {
        console.log(`! SMTP RCPT temp/odd response from ${mx.exchange}: ${r.code} ${r.msg} (proceeding)`)
      }
      break
    } catch (e: any) {
      console.log(`… SMTP probe to ${mx.exchange} failed: ${e.message} (trying next)`)
    }
  }
  if (!probed && !force) {
    fail('All SMTP probes failed (outbound port 25 may be blocked). Re-run with --skip-smtp to bypass.')
  }
}

// 5) Enqueue --------------------------------------------------------------
const messageId = crypto.randomUUID()
const data = { sentAt: new Date().toISOString() }
const element = React.createElement(template.component, data)
const html = await render(element)
const text = await render(element, { plainText: true })

const bytes = new Uint8Array(32); crypto.getRandomValues(bytes)
const unsubscribeToken = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
await supabase.from('email_unsubscribe_tokens').upsert(
  { token: unsubscribeToken, email: recipient.toLowerCase() },
  { onConflict: 'email', ignoreDuplicates: true },
)
const { data: stored } = await supabase
  .from('email_unsubscribe_tokens').select('token').eq('email', recipient.toLowerCase()).maybeSingle()

await supabase.from('email_send_log').insert({
  message_id: messageId, template_name: 'test-ping', recipient_email: recipient, status: 'pending',
})

const { error } = await supabase.rpc('enqueue_email', {
  queue_name: 'transactional_emails',
  payload: {
    message_id: messageId,
    to: recipient,
    from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
    sender_domain: SENDER_DOMAIN,
    subject: typeof template.subject === 'function' ? template.subject(data) : template.subject,
    html, text,
    purpose: 'transactional',
    label: 'test-ping',
    idempotency_key: `test-ping-${messageId}`,
    unsubscribe_token: stored?.token ?? unsubscribeToken,
    queued_at: new Date().toISOString(),
  },
})
if (error) fail(`enqueue error: ${error.message}`)
ok(`Enqueued. message_id: ${messageId}`)
