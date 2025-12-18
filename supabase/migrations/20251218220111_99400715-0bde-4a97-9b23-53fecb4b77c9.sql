-- Add missing DELETE policy for user_preferences table
-- This allows users to delete their own preference data for privacy compliance

CREATE POLICY "Users can delete their own preferences"
ON public.user_preferences
FOR DELETE
USING (auth.uid() = user_id);