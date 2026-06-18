
CREATE OR REPLACE FUNCTION public.reminder_weeks_valid(weeks INT[])
RETURNS BOOLEAN
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT weeks IS NOT NULL
     AND array_length(weeks, 1) BETWEEN 1 AND 12
     AND (SELECT bool_and(w BETWEEN 1 AND 12) FROM unnest(weeks) w);
$$;

CREATE TABLE public.reminder_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT,
  surgery_date DATE NOT NULL,
  channel_email BOOLEAN NOT NULL DEFAULT true,
  channel_sms BOOLEAN NOT NULL DEFAULT false,
  selected_weeks INT[] NOT NULL DEFAULT ARRAY[1,2,4,8,12],
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  consent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reminder_email_format CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND length(email) <= 254),
  CONSTRAINT reminder_phone_format CHECK (phone IS NULL OR phone ~ '^\+[1-9][0-9]{7,14}$'),
  CONSTRAINT reminder_at_least_one_channel CHECK (channel_email OR channel_sms),
  CONSTRAINT reminder_sms_needs_phone CHECK (NOT channel_sms OR phone IS NOT NULL),
  CONSTRAINT reminder_weeks_check CHECK (public.reminder_weeks_valid(selected_weeks))
);

CREATE INDEX reminder_subs_active_surgery_idx ON public.reminder_subscriptions(active, surgery_date);

GRANT INSERT ON public.reminder_subscriptions TO anon;
GRANT INSERT ON public.reminder_subscriptions TO authenticated;
GRANT ALL ON public.reminder_subscriptions TO service_role;

ALTER TABLE public.reminder_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can subscribe"
  ON public.reminder_subscriptions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (active = true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER reminder_subs_updated_at
  BEFORE UPDATE ON public.reminder_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.reminder_sends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.reminder_subscriptions(id) ON DELETE CASCADE,
  week INT NOT NULL CHECK (week BETWEEN 1 AND 12),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  status TEXT NOT NULL,
  provider_message_id TEXT,
  error TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subscription_id, week, channel)
);

CREATE INDEX reminder_sends_subscription_idx ON public.reminder_sends(subscription_id);

GRANT ALL ON public.reminder_sends TO service_role;

ALTER TABLE public.reminder_sends ENABLE ROW LEVEL SECURITY;
