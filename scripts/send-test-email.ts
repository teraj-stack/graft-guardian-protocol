import * as React from 'react'
import { render } from '@react-email/components'
import { createClient } from '@supabase/supabase-js'
import { template } from '../dev-server/src/lib/email-templates/test-ping'

const SITE_NAME = 'graft-guardian-protocol'
const SENDER_DOMAIN = 'notify.graftgen.com'
const FROM_DOMAIN = 'graftgen.com'
const recipient = 'kontakt@graftgen.com'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const messageId = crypto.randomUUID()
const data = { sentAt: new Date().toISOString() }
const element = React.createElement(template.component, data)
const html = await render(element)
const text = await render(element, { plainText: true })

// unsubscribe token
const bytes = new Uint8Array(32); crypto.getRandomValues(bytes)
const unsubscribeToken = Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join('')
await supabase.from('email_unsubscribe_tokens').upsert(
  { token: unsubscribeToken, email: recipient.toLowerCase() },
  { onConflict: 'email', ignoreDuplicates: true }
)
const { data: stored } = await supabase.from('email_unsubscribe_tokens').select('token').eq('email', recipient.toLowerCase()).maybeSingle()

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
console.log('enqueue error:', error)
console.log('message_id:', messageId)
