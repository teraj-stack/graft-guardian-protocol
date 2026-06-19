-- Helper that returns a 256-bit (32-byte) URL-safe base64 token.
CREATE OR REPLACE FUNCTION public.generate_unsubscribe_token()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public, extensions
AS $$
  SELECT translate(
    encode(extensions.gen_random_bytes(32), 'base64'),
    E'+/=\n',
    '-_'
  );
$$;

-- Switch column type from uuid to text and apply the new default.
ALTER TABLE public.reminder_subscriptions
  ALTER COLUMN unsubscribe_token DROP DEFAULT;

ALTER TABLE public.reminder_subscriptions
  ALTER COLUMN unsubscribe_token TYPE text USING unsubscribe_token::text;

ALTER TABLE public.reminder_subscriptions
  ALTER COLUMN unsubscribe_token SET DEFAULT public.generate_unsubscribe_token();

-- Rotate every existing token (invalidates any previously sent unsubscribe link).
UPDATE public.reminder_subscriptions
  SET unsubscribe_token = public.generate_unsubscribe_token();

-- Track when the token was last rotated.
ALTER TABLE public.reminder_subscriptions
  ADD COLUMN IF NOT EXISTS token_rotated_at timestamptz NOT NULL DEFAULT now();

-- Uniqueness + fast lookup by hashed token comparison.
CREATE UNIQUE INDEX IF NOT EXISTS reminder_subscriptions_unsubscribe_token_key
  ON public.reminder_subscriptions (unsubscribe_token);