-- Function to initialize user subscription and credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default subscription (free tier with 5 monthly quota)
  INSERT INTO public.user_subscriptions (user_id, tier, monthly_quota, used_quota)
  VALUES (NEW.id, 'free', 5, 0);
  
  -- Create default credits (starting with 0 balance)
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (NEW.id, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-initialize subscription and credits for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Initialize data for existing users who don't have records
INSERT INTO public.user_subscriptions (user_id, tier, monthly_quota, used_quota)
SELECT id, 'free', 5, 0
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_subscriptions);

INSERT INTO public.user_credits (user_id, balance)
SELECT id, 0
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_credits);