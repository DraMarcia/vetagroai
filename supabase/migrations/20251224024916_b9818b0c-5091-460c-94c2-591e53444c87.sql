-- Drop existing restrictive policies on tool_suggestions
DROP POLICY IF EXISTS "Authenticated users can insert suggestions with their user_id" ON public.tool_suggestions;
DROP POLICY IF EXISTS "Authenticated users can view their own suggestions" ON public.tool_suggestions;

-- Create proper PERMISSIVE policies for tool_suggestions

-- Users can view their own suggestions
CREATE POLICY "Users can view their own suggestions"
ON public.tool_suggestions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all suggestions
CREATE POLICY "Admins can view all suggestions"
ON public.tool_suggestions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert their own suggestions (user_id must match)
CREATE POLICY "Users can insert their own suggestions"
ON public.tool_suggestions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can update suggestions (e.g., change status)
CREATE POLICY "Admins can update suggestions"
ON public.tool_suggestions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can delete suggestions
CREATE POLICY "Admins can delete suggestions"
ON public.tool_suggestions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));