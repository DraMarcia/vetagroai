-- Add DELETE policy for user_tool_history to enable LGPD compliance
-- Users should be able to delete their own tool history entries

CREATE POLICY "Users can delete their own tool history"
ON public.user_tool_history FOR DELETE
USING (auth.uid() = user_id);