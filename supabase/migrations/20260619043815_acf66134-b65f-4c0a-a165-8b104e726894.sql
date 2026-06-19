
CREATE TABLE public.security_watch_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  findings jsonb NOT NULL,
  fingerprint text NOT NULL
);

GRANT ALL ON public.security_watch_snapshots TO service_role;
ALTER TABLE public.security_watch_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role only - select" ON public.security_watch_snapshots FOR SELECT TO service_role USING (true);
CREATE POLICY "service_role only - all" ON public.security_watch_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "deny anon" ON public.security_watch_snapshots FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.security_watch_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  tables_no_rls jsonb;
  tables_no_policy jsonb;
  ext_in_public jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(c.relname ORDER BY c.relname), '[]'::jsonb)
    INTO tables_no_rls
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relkind = 'r'
     AND c.relrowsecurity = false;

  SELECT COALESCE(jsonb_agg(c.relname ORDER BY c.relname), '[]'::jsonb)
    INTO tables_no_policy
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relkind = 'r'
     AND c.relrowsecurity = true
     AND NOT EXISTS (
       SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid
     );

  SELECT COALESCE(jsonb_agg(e.extname ORDER BY e.extname), '[]'::jsonb)
    INTO ext_in_public
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
   WHERE n.nspname = 'public';

  RETURN jsonb_build_object(
    'tables_without_rls', tables_no_rls,
    'tables_rls_no_policy', tables_no_policy,
    'extensions_in_public', ext_in_public,
    'checked_at', now()
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.security_watch_check() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.security_watch_check() TO service_role;
