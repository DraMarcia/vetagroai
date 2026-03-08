
-- Create territorial_agro_metrics table for anonymized scientific data
CREATE TABLE public.territorial_agro_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_name TEXT NOT NULL,
  municipality TEXT,
  state TEXT,
  production_system TEXT,
  estimated_emission_value NUMERIC,
  emission_type TEXT,
  herd_size_range TEXT,
  calculation_method TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.territorial_agro_metrics ENABLE ROW LEVEL SECURITY;

-- Public read access for aggregate data (anonymized, no user info)
CREATE POLICY "Anyone can read territorial metrics"
  ON public.territorial_agro_metrics
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert metrics (no user_id stored)
CREATE POLICY "Authenticated users can insert territorial metrics"
  ON public.territorial_agro_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only admins can delete
CREATE POLICY "Admins can delete territorial metrics"
  ON public.territorial_agro_metrics
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create index for aggregation queries
CREATE INDEX idx_territorial_metrics_state ON public.territorial_agro_metrics(state);
CREATE INDEX idx_territorial_metrics_tool ON public.territorial_agro_metrics(tool_name);
