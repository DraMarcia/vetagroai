
-- Fix default daily_credits on profiles table from 10 to 5
ALTER TABLE public.profiles ALTER COLUMN daily_credits SET DEFAULT 5;

-- Fix handle_new_user to give 5 credits (not 10) to free users
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_creator BOOLEAN := false;
  creator_email_config TEXT;
BEGIN
  SELECT value INTO creator_email_config 
  FROM public.app_config 
  WHERE key = 'creator_email';
  
  IF creator_email_config IS NOT NULL THEN
    is_creator := NEW.email = creator_email_config;
  END IF;
  
  INSERT INTO public.profiles (
    user_id, 
    full_name, 
    current_plan, 
    daily_credits
  )
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    CASE WHEN is_creator THEN 'enterprise'::subscription_plan ELSE 'free'::subscription_plan END,
    CASE WHEN is_creator THEN 999999 ELSE 5 END
  );
  
  IF is_creator THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Also update any existing free users who still have more than 5 credits
UPDATE public.profiles 
SET daily_credits = 5 
WHERE current_plan = 'free' AND daily_credits > 5;
