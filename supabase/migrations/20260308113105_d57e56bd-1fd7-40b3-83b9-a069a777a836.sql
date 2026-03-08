
-- Table for error/usage logging per tool invocation
CREATE TABLE public.tool_monitoring_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  tool_name text NOT NULL,
  tool_route text,
  event_type text NOT NULL DEFAULT 'usage',
  error_type text,
  error_message text,
  response_time_ms integer,
  user_plan text,
  request_status text,
  request_id text,
  metadata jsonb
);

-- Index for admin queries
CREATE INDEX idx_tool_monitoring_created ON public.tool_monitoring_logs (created_at DESC);
CREATE INDEX idx_tool_monitoring_tool ON public.tool_monitoring_logs (tool_name, event_type);

-- Enable RLS
ALTER TABLE public.tool_monitoring_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read logs
CREATE POLICY "Admins can view all monitoring logs"
  ON public.tool_monitoring_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Anyone authenticated can insert (logging from client)
CREATE POLICY "Authenticated users can insert monitoring logs"
  ON public.tool_monitoring_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only admins can delete
CREATE POLICY "Admins can delete monitoring logs"
  ON public.tool_monitoring_logs
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
