
DROP POLICY "Authenticated users can insert cache" ON public.ai_response_cache;
CREATE POLICY "Authenticated users can insert cache"
  ON public.ai_response_cache FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
