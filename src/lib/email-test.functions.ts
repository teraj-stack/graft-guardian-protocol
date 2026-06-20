import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { z } from 'zod'

const EMAIL_RE =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/

const inputSchema = z.object({
  email: z.string().trim().min(3).max(254),
  force: z.boolean().optional().default(false),
})

export type PreflightStep = {
  name: string
  status: 'ok' | 'fail' | 'warn' | 'skip'
  detail?: string
}

export type PreflightResult = {
  ok: boolean
  steps: PreflightStep[]
  messageId?: string
}

export const sendTestEmail = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw) => inputSchema.parse(raw))
  .handler(async ({ data, context }): Promise<PreflightResult> => {
    const { userId } = context
    const steps: PreflightStep[] = []
    const email = data.email.trim()

    // Authorize: admin only
    const { data: isAdmin } = await context.supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin',
    })
    if (!isAdmin) {
      return { ok: false, steps: [{ name: 'auth', status: 'fail', detail: 'Forbidden' }] }
    }

    // 1) Format
    if (!EMAIL_RE.test(email) || email.length > 254) {
      steps.push({ name: 'Format', status: 'fail', detail: 'Niepoprawny format adresu' })
      return { ok: false, steps }
    }
    steps.push({ name: 'Format', status: 'ok', detail: email })

    const domain = email.split('@')[1].toLowerCase()

    // 2) MX lookup
    let mxOk = false
    try {
      const { resolveMx } = await import('node:dns/promises')
      const mx = (await resolveMx(domain)).sort((a, b) => a.priority - b.priority)
      if (mx.length === 0) {
        steps.push({ name: 'MX', status: 'fail', detail: `Brak rekordów MX dla ${domain}` })
        return { ok: false, steps }
      }
      mxOk = true
      steps.push({ name: 'MX', status: 'ok', detail: `${mx[0].exchange} (prio ${mx[0].priority}, łącznie ${mx.length})` })
    } catch (e: any) {
      steps.push({ name: 'MX', status: 'fail', detail: `Lookup failed: ${e.code ?? e.message}` })
      if (!data.force) return { ok: false, steps }
    }

    // 3) Admin client for suppression + enqueue
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

    const { data: suppressed } = await supabaseAdmin
      .from('suppressed_emails')
      .select('email, reason')
      .eq('email', email.toLowerCase())
      .maybeSingle()
    if (suppressed) {
      steps.push({
        name: 'Suppression',
        status: data.force ? 'warn' : 'fail',
        detail: `Na liście (powód: ${suppressed.reason ?? '—'})`,
      })
      if (!data.force) return { ok: false, steps }
    } else {
      steps.push({ name: 'Suppression', status: 'ok', detail: 'Brak na liście blokad' })
    }

    const { data: bounces } = await supabaseAdmin
      .from('email_send_log')
      .select('status, error_message, created_at')
      .eq('recipient_email', email)
      .in('status', ['bounced', 'failed', 'dlq'])
      .order('created_at', { ascending: false })
      .limit(1)
    if (bounces && bounces.length > 0) {
      const b = bounces[0]
      steps.push({
        name: 'Historia',
        status: data.force ? 'warn' : 'fail',
        detail: `Poprzedni ${b.status}: ${b.error_message ?? '—'}`,
      })
      if (!data.force) return { ok: false, steps }
    } else {
      steps.push({ name: 'Historia', status: 'ok', detail: 'Brak wcześniejszych bounce/failed' })
    }

    if (!mxOk && data.force) {
      steps.push({ name: 'Force', status: 'warn', detail: 'MX nie zweryfikowane — wymuszono wysyłkę' })
    }

    // 4) Render + enqueue
    try {
      const React = await import('react')
      const { render } = await import('@react-email/components')
      const { template } = await import('@/lib/email-templates/test-ping')

      const SITE_NAME = 'graft-guardian-protocol'
      const SENDER_DOMAIN = 'notify.graftgen.com'
      const FROM_DOMAIN = 'graftgen.com'

      const messageId = crypto.randomUUID()
      const payloadData = { sentAt: new Date().toISOString() }
      const element = React.createElement(template.component as any, payloadData)
      const html = await render(element)
      const text = await render(element, { plainText: true })

      const bytes = new Uint8Array(32)
      crypto.getRandomValues(bytes)
      const unsubscribeToken = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
      await supabaseAdmin
        .from('email_unsubscribe_tokens')
        .upsert(
          { token: unsubscribeToken, email: email.toLowerCase() },
          { onConflict: 'email', ignoreDuplicates: true },
        )
      const { data: stored } = await supabaseAdmin
        .from('email_unsubscribe_tokens')
        .select('token')
        .eq('email', email.toLowerCase())
        .maybeSingle()

      await supabaseAdmin.from('email_send_log').insert({
        message_id: messageId,
        template_name: 'test-ping',
        recipient_email: email,
        status: 'pending',
      })

      const { error } = await supabaseAdmin.rpc('enqueue_email', {
        queue_name: 'transactional_emails',
        payload: {
          message_id: messageId,
          to: email,
          from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
          sender_domain: SENDER_DOMAIN,
          subject:
            typeof template.subject === 'function'
              ? (template.subject as any)(payloadData)
              : template.subject,
          html,
          text,
          purpose: 'transactional',
          label: 'test-ping',
          idempotency_key: `test-ping-${messageId}`,
          unsubscribe_token: stored?.token ?? unsubscribeToken,
          queued_at: new Date().toISOString(),
        },
      })
      if (error) {
        steps.push({ name: 'Kolejka', status: 'fail', detail: error.message })
        return { ok: false, steps, messageId }
      }
      steps.push({ name: 'Kolejka', status: 'ok', detail: `Zakolejkowano (${messageId.slice(0, 8)}…)` })
      return { ok: true, steps, messageId }
    } catch (e: any) {
      steps.push({ name: 'Render/Enqueue', status: 'fail', detail: e.message ?? 'internal_error' })
      return { ok: false, steps }
    }
  })
