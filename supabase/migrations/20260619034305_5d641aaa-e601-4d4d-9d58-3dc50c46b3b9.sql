CREATE OR REPLACE FUNCTION public.deactivate_and_rotate_subscription(_token text)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _updated int;
BEGIN
  UPDATE public.reminder_subscriptions
     SET active = false,
         unsubscribe_token = public.generate_unsubscribe_token(),
         token_rotated_at = now()
   WHERE unsubscribe_token = _token;
  GET DIAGNOSTICS _updated = ROW_COUNT;
  RETURN _updated > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.deactivate_and_rotate_subscription(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deactivate_and_rotate_subscription(text) TO service_role;