-- Drop existing policies on tool_suggestions
DROP POLICY IF EXISTS "Anyone can submit suggestions" ON public.tool_suggestions;
DROP POLICY IF EXISTS "Users can view their own suggestions" ON public.tool_suggestions;

-- Create new, more secure policies

-- 1. Only authenticated users can insert suggestions (with their own user_id)
CREATE POLICY "Authenticated users can insert suggestions with their user_id"
ON public.tool_suggestions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Only authenticated users can view their own suggestions
CREATE POLICY "Authenticated users can view their own suggestions"
ON public.tool_suggestions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Note: This blocks anonymous access completely and ensures users can only see their own suggestions