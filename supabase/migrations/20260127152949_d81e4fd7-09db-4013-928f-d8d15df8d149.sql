-- Drop existing admin SELECT policy
DROP POLICY IF EXISTS "Admins can view all suggestions" ON public.tool_suggestions;

-- Create anonymized view for admin access (excludes user_id)
CREATE OR REPLACE VIEW public.tool_suggestions_admin_view
WITH (security_invoker = on)
AS
SELECT 
  id,
  created_at,
  category,
  status,
  suggestion
FROM public.tool_suggestions;

-- Grant access to the view for authenticated users (admins will use this)
GRANT SELECT ON public.tool_suggestions_admin_view TO authenticated;

-- Add comment explaining purpose
COMMENT ON VIEW public.tool_suggestions_admin_view IS 'Anonymized view for admin access - excludes user_id to protect user privacy';