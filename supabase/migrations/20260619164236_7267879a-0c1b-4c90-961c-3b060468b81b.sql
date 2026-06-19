
CREATE TABLE IF NOT EXISTS public.report_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.reminder_subscriptions(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  week integer NOT NULL CHECK (week BETWEEN 1 AND 12),
  template_version text NOT NULL,
  document_hash text,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','delivered','bounced','rejected','opened','confirmed','failed')),
  provider_message_id text,
  error text,
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  opened_at timestamp with time zone,
  confirmed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_sends_subscription ON public.report_sends(subscription_id, week);
CREATE INDEX IF NOT EXISTS idx_report_sends_email ON public.report_sends(recipient_email);
CREATE INDEX IF NOT EXISTS idx_report_sends_created ON public.report_sends(created_at DESC);

GRANT SELECT ON public.report_sends TO authenticated;
GRANT ALL ON public.report_sends TO service_role;

ALTER TABLE public.report_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read report sends"
  ON public.report_sends FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages report sends"
  ON public.report_sends FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Deny anon report sends"
  ON public.report_sends FOR ALL
  TO anon
  USING (false) WITH CHECK (false);

CREATE TRIGGER report_sends_updated_at
  BEFORE UPDATE ON public.report_sends
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.report_sends (recipient_email, week, template_version, document_hash, status, provider_message_id, sent_at, delivered_at, opened_at)
VALUES
  ('demo.pacjent@example.com', 1, '1.2.0', 'a3f1c9', 'opened',    'msg_001', now() - interval '21 days', now() - interval '21 days' + interval '2 min', now() - interval '20 days'),
  ('demo.pacjent@example.com', 2, '1.2.0', 'b4e2d8', 'delivered', 'msg_002', now() - interval '14 days', now() - interval '14 days' + interval '3 min', NULL),
  ('demo.pacjent@example.com', 3, '1.2.0', 'c5f3e7', 'confirmed', 'msg_003', now() - interval '7 days',  now() - interval '7 days' + interval '1 min',  now() - interval '6 days'),
  ('demo.pacjent@example.com', 4, '1.2.0', 'd6g4f6', 'sent',      'msg_004', now() - interval '1 hour',  NULL, NULL),
  ('test.bounce@example.com',  2, '1.2.0', 'e7h5g5', 'bounced',   'msg_005', now() - interval '10 days', NULL, NULL);

UPDATE public.report_sends SET confirmed_at = now() - interval '5 days' WHERE status = 'confirmed';
UPDATE public.report_sends SET error = 'Mailbox does not exist (550)' WHERE status = 'bounced';
