
-- AI Usage Logs table for cost monitoring
CREATE TABLE public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool_name text NOT NULL,
  ai_model text,
  tokens_input integer DEFAULT 0,
  tokens_output integer DEFAULT 0,
  response_time_ms integer,
  user_plan text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all AI usage logs"
  ON public.ai_usage_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can insert AI usage logs"
  ON public.ai_usage_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_ai_usage_logs_created_at ON public.ai_usage_logs (created_at DESC);
CREATE INDEX idx_ai_usage_logs_tool_name ON public.ai_usage_logs (tool_name);

-- AI Response Cache table
CREATE TABLE public.ai_response_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name text NOT NULL,
  request_hash text NOT NULL,
  request_signature text,
  response_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

ALTER TABLE public.ai_response_cache ENABLE ROW LEVEL SECURITY;

-- Cache is readable by all authenticated users (shared cache)
CREATE POLICY "Authenticated users can read cache"
  ON public.ai_response_cache FOR SELECT TO authenticated
  USING (expires_at > now());

CREATE POLICY "Authenticated users can insert cache"
  ON public.ai_response_cache FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can delete cache"
  ON public.ai_response_cache FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_ai_response_cache_lookup ON public.ai_response_cache (tool_name, request_hash);
CREATE INDEX idx_ai_response_cache_expires ON public.ai_response_cache (expires_at);
