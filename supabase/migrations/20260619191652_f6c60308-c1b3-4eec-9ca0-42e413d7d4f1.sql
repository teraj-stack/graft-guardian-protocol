CREATE TABLE public.web_vitals (
  id BIGSERIAL PRIMARY KEY,
  metric TEXT NOT NULL CHECK (metric IN ('CLS','LCP','INP','FCP','TTFB')),
  value DOUBLE PRECISION NOT NULL,
  rating TEXT CHECK (rating IN ('good','needs-improvement','poor')),
  metric_id TEXT,
  nav_type TEXT,
  page TEXT NOT NULL,
  device TEXT NOT NULL CHECK (device IN ('mobile','tablet','desktop')),
  connection TEXT,
  country TEXT,
  session_id TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX web_vitals_created_idx ON public.web_vitals (created_at DESC);
CREATE INDEX web_vitals_metric_idx ON public.web_vitals (metric, created_at DESC);
CREATE INDEX web_vitals_page_idx ON public.web_vitals (page, metric);

GRANT ALL ON public.web_vitals TO service_role;
GRANT SELECT ON public.web_vitals TO authenticated;

ALTER TABLE public.web_vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read vitals"
  ON public.web_vitals
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));