-- 1. Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles (prevents recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Only system can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

-- 6. Migrate existing admins to new table
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM public.profiles
WHERE is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

-- 7. Update handle_new_user function to use roles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_creator BOOLEAN;
BEGIN
  is_creator := NEW.email = 'marciaveterinaria9@hotmail.com';
  
  -- Insert profile without is_admin
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
    CASE WHEN is_creator THEN 999999 ELSE 10 END
  );
  
  -- If creator, add admin role to user_roles table
  IF is_creator THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 8. Update use_credit function to use has_role
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
  
  -- Admin has unlimited access (using has_role function)
  IF public.has_role(v_user_id, 'admin') THEN
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
$function$;

-- 9. Update check_credits function to use has_role
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
  
  -- Check admin status using has_role function
  v_is_admin := public.has_role(v_user_id, 'admin');
  
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
    'is_admin', v_is_admin,
    'is_professional', v_profile.is_professional,
    'has_unlimited', v_is_admin OR v_profile.current_plan IN ('pro', 'enterprise')
  );
  
  RETURN v_result;
END;
$function$;

-- 10. Remove is_admin column from profiles (after migration)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin;