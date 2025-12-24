-- Add DELETE policy for profiles table - only admins can delete profiles
-- This prevents users from accidentally or maliciously deleting their own profiles

CREATE POLICY "Only admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));