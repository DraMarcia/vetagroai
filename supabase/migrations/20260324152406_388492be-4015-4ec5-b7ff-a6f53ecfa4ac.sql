-- Replace deny-all SELECT policies with an explicit user-scoped SELECT policy
-- so cache reads are ownership-bound and scanner-visible.
DROP POLICY IF EXISTS "No direct SELECT access to cache" ON public.ai_response_cache;
DROP POLICY IF EXISTS "No anon SELECT access to cache" ON public.ai_response_cache;

CREATE POLICY "Users can read own cache entries"
ON public.ai_response_cache
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  AND expires_at > now()
);

CREATE POLICY "No anonymous cache read"
ON public.ai_response_cache
FOR SELECT
TO anon
USING (false);