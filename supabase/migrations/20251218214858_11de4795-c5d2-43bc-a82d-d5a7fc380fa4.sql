-- Fix RPC functions to use auth.uid() instead of accepting arbitrary user_id parameter
-- This prevents users from accessing or modifying other users' credits

-- Drop existing functions
DROP FUNCTION IF EXISTS public.use_credit(UUID);
DROP FUNCTION IF EXISTS public.check_credits(UUID);

-- Recreate use_credit function without user_id parameter - uses auth.uid() directly
CREATE OR REPLACE FUNCTION public.use_credit()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_profile profiles%ROWTYPE;
BEGIN
  -- Validate authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE user_id = v_user_id;
  
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
    WHERE user_id = v_user_id;
    v_profile.daily_credits := 10;
  END IF;
  
  -- Check if user has credits
  IF v_profile.daily_credits > 0 THEN
    UPDATE profiles 
    SET daily_credits = daily_credits - 1
    WHERE user_id = v_user_id;
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Recreate check_credits function without user_id parameter - uses auth.uid() directly
CREATE OR REPLACE FUNCTION public.check_credits()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_profile profiles%ROWTYPE;
  v_result JSON;
BEGIN
  -- Validate authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE user_id = v_user_id;
  
  -- Reset credits if needed
  IF v_profile.credits_reset_at <= now() AND v_profile.current_plan = 'free' THEN
    UPDATE profiles 
    SET daily_credits = 10, credits_reset_at = now() + INTERVAL '24 hours'
    WHERE user_id = v_user_id
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