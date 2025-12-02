-- Create subscription plans enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro', 'enterprise');

-- Create professional registry types enum
CREATE TYPE public.professional_registry_type AS ENUM ('crmv', 'crea', 'crbio', 'other');

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT,
  is_professional BOOLEAN DEFAULT false,
  professional_registry_type professional_registry_type,
  professional_registry_number TEXT,
  current_plan subscription_plan DEFAULT 'free',
  plan_expires_at TIMESTAMP WITH TIME ZONE,
  daily_credits INTEGER DEFAULT 10,
  credits_reset_at TIMESTAMP WITH TIME ZONE DEFAULT now() + INTERVAL '24 hours',
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  is_creator BOOLEAN;
BEGIN
  -- Check if the email is the creator's email
  is_creator := NEW.email = 'marciaveterinaria9@hotmail.com';
  
  INSERT INTO public.profiles (
    user_id, 
    full_name, 
    current_plan, 
    daily_credits,
    is_admin
  )
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    CASE WHEN is_creator THEN 'enterprise'::subscription_plan ELSE 'free'::subscription_plan END,
    CASE WHEN is_creator THEN 999999 ELSE 10 END,
    is_creator
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to reset daily credits
CREATE OR REPLACE FUNCTION public.reset_daily_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.credits_reset_at <= now() AND OLD.credits_reset_at > now() THEN
    NEW.daily_credits := CASE 
      WHEN NEW.current_plan = 'free' THEN 10
      ELSE 999999
    END;
    NEW.credits_reset_at := now() + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$;

-- Function to use credits
CREATE OR REPLACE FUNCTION public.use_credit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE user_id = p_user_id;
  
  -- Admin has unlimited access
  IF v_profile.is_admin THEN
    RETURN true;
  END IF;
  
  -- Pro and Enterprise have unlimited credits
  IF v_profile.current_plan IN ('pro', 'enterprise') THEN
    RETURN true;
  END IF;
  
  -- Check if credits need to be reset
  IF v_profile.credits_reset_at <= now() THEN
    UPDATE profiles 
    SET daily_credits = 10, credits_reset_at = now() + INTERVAL '24 hours'
    WHERE user_id = p_user_id;
    v_profile.daily_credits := 10;
  END IF;
  
  -- Check if user has credits
  IF v_profile.daily_credits > 0 THEN
    UPDATE profiles 
    SET daily_credits = daily_credits - 1
    WHERE user_id = p_user_id;
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Function to check user credits
CREATE OR REPLACE FUNCTION public.check_credits(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_result JSON;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE user_id = p_user_id;
  
  -- Reset credits if needed
  IF v_profile.credits_reset_at <= now() AND v_profile.current_plan = 'free' THEN
    UPDATE profiles 
    SET daily_credits = 10, credits_reset_at = now() + INTERVAL '24 hours'
    WHERE user_id = p_user_id
    RETURNING * INTO v_profile;
  END IF;
  
  v_result := json_build_object(
    'plan', v_profile.current_plan,
    'credits', v_profile.daily_credits,
    'credits_reset_at', v_profile.credits_reset_at,
    'is_admin', v_profile.is_admin,
    'is_professional', v_profile.is_professional,
    'has_unlimited', v_profile.is_admin OR v_profile.current_plan IN ('pro', 'enterprise')
  );
  
  RETURN v_result;
END;
$$;