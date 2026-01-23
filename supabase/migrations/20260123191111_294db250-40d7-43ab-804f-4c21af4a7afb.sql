-- Add RESTRICTIVE UPDATE policy on user_roles to prevent privilege escalation
-- This policy blocks ALL updates by regular users - only system/triggers can modify roles

CREATE POLICY "Block all user role updates"
ON public.user_roles
FOR UPDATE
USING (false)
WITH CHECK (false);

-- Also add a RESTRICTIVE DELETE policy if not exists to prevent role removal
CREATE POLICY "Block all user role deletions"
ON public.user_roles
FOR DELETE
USING (false);