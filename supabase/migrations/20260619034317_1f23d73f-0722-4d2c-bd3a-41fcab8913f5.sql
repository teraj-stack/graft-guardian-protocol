REVOKE ALL ON FUNCTION public.deactivate_and_rotate_subscription(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_and_rotate_subscription(text) TO service_role;

REVOKE ALL ON FUNCTION public.generate_unsubscribe_token() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_unsubscribe_token() TO service_role;