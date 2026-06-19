-- Ensure RLS stays enabled and revoke any incidental Data API grants
ALTER TABLE public.reminder_sends ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reminder_sends FROM anon, authenticated;
GRANT ALL ON public.reminder_sends TO service_role;

-- Explicit service-role-only policy (documents intent; service_role already bypasses RLS)
DROP POLICY IF EXISTS "Service role manages reminder sends" ON public.reminder_sends;
CREATE POLICY "Service role manages reminder sends"
  ON public.reminder_sends
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Explicit deny for anon and authenticated (no rows visible, no inserts/updates/deletes)
DROP POLICY IF EXISTS "Deny anon access to reminder sends" ON public.reminder_sends;
CREATE POLICY "Deny anon access to reminder sends"
  ON public.reminder_sends
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);