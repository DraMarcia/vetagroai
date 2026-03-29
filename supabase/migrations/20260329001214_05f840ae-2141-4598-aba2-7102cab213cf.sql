
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
  v_result JSON;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE user_id = v_user_id;
  
  v_is_admin := public.has_role(v_user_id, 'admin');
  
  IF v_profile.credits_reset_at <= now() AND v_profile.current_plan = 'free' THEN
    UPDATE profiles 
    SET daily_credits = 5, credits_reset_at = now() + INTERVAL '24 hours'
    WHERE user_id = v_user_id
    RETURNING * INTO v_profile;
  END IF;
  
  v_result := json_build_object(
    'plan', v_profile.current_plan,
    'credits', v_profile.daily_credits,
    'credits_reset_at', v_profile.credits_reset_at,
    'is_admin', v_is_admin,
    'is_professional', v_profile.is_professional,
    'has_unlimited', v_is_admin OR v_profile.current_plan IN ('pro', 'enterprise')
  );
  
  RETURN v_result;
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

  SELECT * INTO v_profile FROM profiles WHERE user_id = v_user_id;
  
  IF public.has_role(v_user_id, 'admin') THEN
    RETURN true;
  END IF;
  
  IF v_profile.current_plan IN ('pro', 'enterprise') THEN
    RETURN true;
  END IF;
  
  IF v_profile.credits_reset_at <= now() THEN
    UPDATE profiles 
    SET daily_credits = 5, credits_reset_at = now() + INTERVAL '24 hours'
    WHERE user_id = v_user_id;
    v_profile.daily_credits := 5;
  END IF;
  
  IF v_profile.daily_credits > 0 THEN
    UPDATE profiles 
    SET daily_credits = daily_credits - 1
    WHERE user_id = v_user_id;
    RETURN true;
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
  IF NEW.credits_reset_at <= now() AND OLD.credits_reset_at > now() THEN
    NEW.daily_credits := CASE 
      WHEN NEW.current_plan = 'free' THEN 5
      ELSE 999999
    END;
    NEW.credits_reset_at := now() + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$function$;
