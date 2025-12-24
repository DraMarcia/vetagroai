-- Fix: Require authentication for tool_suggestions inserts
-- Drop the existing permissive policy
DROP POLICY IF EXISTS "Anyone can submit suggestions" ON public.tool_suggestions;

-- The policy "Authenticated users can insert suggestions with their user_id" already exists
-- and enforces auth.uid() = user_id, so no new policy needed

-- Verify the existing correct policy is in place (it should be based on schema output)