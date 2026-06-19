ALTER TABLE public.reminder_subscriptions ENABLE ROW LEVEL SECURITY;

-- Public Data API may only INSERT new subscriptions (existing policy "Public can subscribe").
REVOKE SELECT, UPDATE, DELETE ON public.reminder_subscriptions FROM anon, authenticated;
GRANT ALL ON public.reminder_subscriptions TO service_role;

-- Explicit deny for any read/update/delete from anon or authenticated roles.
DROP POLICY IF EXISTS "Deny anon select on subscriptions" ON public.reminder_subscriptions;
CREATE POLICY "Deny anon select on subscriptions"
  ON public.reminder_subscriptions
  FOR SELECT
  TO anon, authenticated
  USING (false);

DROP POLICY IF EXISTS "Deny anon update on subscriptions" ON public.reminder_subscriptions;
CREATE POLICY "Deny anon update on subscriptions"
  ON public.reminder_subscriptions
  FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Deny anon delete on subscriptions" ON public.reminder_subscriptions;
CREATE POLICY "Deny anon delete on subscriptions"
  ON public.reminder_subscriptions
  FOR DELETE
  TO anon, authenticated
  USING (false);

-- Service role has full access (used by server functions / cron via supabaseAdmin).
DROP POLICY IF EXISTS "Service role manages subscriptions" ON public.reminder_subscriptions;
CREATE POLICY "Service role manages subscriptions"
  ON public.reminder_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);