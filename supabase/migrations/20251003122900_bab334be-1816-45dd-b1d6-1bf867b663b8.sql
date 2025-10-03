-- Fix security warning: Set search_path for handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Create default subscription (free tier with 5 monthly quota)
  INSERT INTO public.user_subscriptions (user_id, tier, monthly_quota, used_quota)
  VALUES (NEW.id, 'free', 5, 0);
  
  -- Create default credits (starting with 0 balance)
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (NEW.id, 0);
  
  RETURN NEW;
END;
$$;