CREATE TABLE public.pricing_overrides (
  code TEXT PRIMARY KEY,
  hidden BOOLEAN NOT NULL DEFAULT false,
  restore_at TIMESTAMPTZ
);

GRANT SELECT ON public.pricing_overrides TO anon;
GRANT SELECT ON public.pricing_overrides TO authenticated;
GRANT ALL ON public.pricing_overrides TO service_role;

ALTER TABLE public.pricing_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read"
  ON public.pricing_overrides
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow service role write"
  ON public.pricing_overrides
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);