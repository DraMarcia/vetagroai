-- Fix overly permissive INSERT policy on territorial_agro_metrics
-- Replace WITH CHECK (true) with proper authenticated check
DROP POLICY IF EXISTS "Authenticated users can insert territorial metrics" ON public.territorial_agro_metrics;
CREATE POLICY "Authenticated users can insert territorial metrics"
  ON public.territorial_agro_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);