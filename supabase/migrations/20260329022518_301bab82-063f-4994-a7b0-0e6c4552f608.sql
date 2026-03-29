-- Harden credit consistency and prevent any free-plan value drift above 5
CREATE OR REPLACE FUNCTION public.check_credits()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_profile profiles%ROWTYPE;
  v_is_admin BOOLEAN;
  v_credits INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_profile
  FROM profiles
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for authenticated user';
  END IF;

  v_is_admin := public.has_role(v_user_id, 'admin');

  IF v_profile.current_plan = 'free' THEN
    IF v_profile.credits_reset_at IS NULL OR v_profile.credits_reset_at <= now() THEN
      UPDATE profiles
      SET daily_credits = 5,
          credits_reset_at = now() + INTERVAL '24 hours'
      WHERE user_id = v_user_id
      RETURNING * INTO v_profile;
    ELSIF COALESCE(v_profile.daily_credits, 0) < 0 OR COALESCE(v_profile.daily_credits, 0) > 5 THEN
      UPDATE profiles
      SET daily_credits = LEAST(5, GREATEST(0, COALESCE(daily_credits, 0)))
      WHERE user_id = v_user_id
      RETURNING * INTO v_profile;
    END IF;
  END IF;

  v_credits := CASE
    WHEN v_profile.current_plan = 'free' THEN LEAST(5, GREATEST(0, COALESCE(v_profile.daily_credits, 0)))
    ELSE GREATEST(0, COALESCE(v_profile.daily_credits, 0))
  END;

  RETURN json_build_object(
    'plan', v_profile.current_plan,
    'credits', v_credits,
    'credits_reset_at', v_profile.credits_reset_at,
    'is_admin', v_is_admin,
    'is_professional', v_profile.is_professional,
    'has_unlimited', v_is_admin OR v_profile.current_plan IN ('pro', 'enterprise')
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.use_credit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_profile profiles%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_profile
  FROM profiles
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for authenticated user';
  END IF;

  IF public.has_role(v_user_id, 'admin') THEN
    RETURN true;
  END IF;

  IF v_profile.current_plan IN ('pro', 'enterprise') THEN
    RETURN true;
  END IF;

  IF v_profile.current_plan = 'free' THEN
    IF v_profile.credits_reset_at IS NULL OR v_profile.credits_reset_at <= now() THEN
      UPDATE profiles
      SET daily_credits = 5,
          credits_reset_at = now() + INTERVAL '24 hours'
      WHERE user_id = v_user_id
      RETURNING * INTO v_profile;
    ELSIF COALESCE(v_profile.daily_credits, 0) < 0 OR COALESCE(v_profile.daily_credits, 0) > 5 THEN
      UPDATE profiles
      SET daily_credits = LEAST(5, GREATEST(0, COALESCE(daily_credits, 0)))
      WHERE user_id = v_user_id
      RETURNING * INTO v_profile;
    END IF;

    UPDATE profiles
    SET daily_credits = daily_credits - 1
    WHERE user_id = v_user_id
      AND daily_credits > 0;

    RETURN FOUND;
  END IF;

  RETURN false;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reset_daily_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.current_plan = 'free' THEN
    IF NEW.credits_reset_at IS NOT NULL
       AND NEW.credits_reset_at <= now()
       AND (OLD.credits_reset_at IS NULL OR OLD.credits_reset_at > now()) THEN
      NEW.daily_credits := 5;
      NEW.credits_reset_at := now() + INTERVAL '24 hours';
    ELSE
      NEW.daily_credits := LEAST(5, GREATEST(0, COALESCE(NEW.daily_credits, 0)));
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;