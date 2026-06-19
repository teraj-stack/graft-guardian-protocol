
CREATE OR REPLACE FUNCTION public.internal_cron_secret()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
  SELECT decrypted_secret
    FROM vault.decrypted_secrets
   WHERE name = 'cron_secret'
   LIMIT 1
$$;

REVOKE EXECUTE ON FUNCTION public.internal_cron_secret() FROM PUBLIC, anon, authenticated;
