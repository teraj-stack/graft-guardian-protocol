DROP POLICY IF EXISTS "Allow public read" ON public.pricing_overrides;
REVOKE SELECT ON public.pricing_overrides FROM anon;
CREATE POLICY "Admins can read pricing overrides" ON public.pricing_overrides
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));