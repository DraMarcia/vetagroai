-- Add SELECT policy for admins to view all suggestions
-- This works with the security_invoker view to allow admin access
CREATE POLICY "Admins can view all suggestions"
ON public.tool_suggestions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));