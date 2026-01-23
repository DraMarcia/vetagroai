-- Create app_config table for storing sensitive configuration
CREATE TABLE IF NOT EXISTS public.app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on app_config
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Only admins can read app_config (no public access)
CREATE POLICY "Only admins can read config"
ON public.app_config
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Block all modifications via RLS (only system/migrations can modify)
CREATE POLICY "Block all config modifications"
ON public.app_config
FOR ALL
USING (false)
WITH CHECK (false);

-- Insert creator email (this is now in a secured table, not exposed in function code)
INSERT INTO public.app_config (key, value)
VALUES ('creator_email', 'marciaveterinaria9@hotmail.com')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Update handle_new_user function to use config table instead of hardcoded email
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
  -- Get creator email from config table (secure lookup)
  SELECT value INTO creator_email_config 
  FROM public.app_config 
  WHERE key = 'creator_email';
  
  -- Check if new user is the creator
  IF creator_email_config IS NOT NULL THEN
    is_creator := NEW.email = creator_email_config;
  END IF;
  
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