-- Add explicit deny-all SELECT policy to satisfy security scanner
-- (RLS is enabled but scanner flags missing SELECT policy as risk)
CREATE POLICY "No direct SELECT access to cache"
  ON public.ai_response_cache
  FOR SELECT
  TO authenticated
  USING (false);

CREATE POLICY "No anon SELECT access to cache"
  ON public.ai_response_cache
  FOR SELECT
  TO anon
  USING (false);