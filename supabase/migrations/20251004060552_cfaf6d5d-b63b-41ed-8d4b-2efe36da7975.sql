-- Add missing Stripe-related columns to user_subscriptions table
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer 
ON public.user_subscriptions(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription 
ON public.user_subscriptions(stripe_subscription_id);