-- 1. Fix cache poisoning: remove client-side INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert cache" ON public.ai_response_cache;

-- Create SECURITY DEFINER function for cache writes (server-side only)
CREATE OR REPLACE FUNCTION public.set_cached_response(
  _tool_name text,
  _request_hash text,
  _request_signature text,
  _response_text text,
  _expires_at timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ai_response_cache (tool_name, request_hash, request_signature, response_text, expires_at)
  VALUES (_tool_name, _request_hash, _request_signature, _response_text, _expires_at)
  ON CONFLICT (request_hash) DO UPDATE
    SET response_text = EXCLUDED.response_text,
        expires_at = EXCLUDED.expires_at,
        created_at = now();
END;
$$;

-- Add unique constraint on request_hash if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_response_cache_request_hash_key'
  ) THEN
    ALTER TABLE public.ai_response_cache ADD CONSTRAINT ai_response_cache_request_hash_key UNIQUE (request_hash);
  END IF;
END;
$$;

-- 2. Fix territorial metrics: replace permissive INSERT with SECURITY DEFINER function
DROP POLICY IF EXISTS "Authenticated users can insert territorial metrics" ON public.territorial_agro_metrics;

CREATE OR REPLACE FUNCTION public.insert_territorial_metric(
  _tool_name text,
  _municipality text DEFAULT NULL,
  _state text DEFAULT NULL,
  _production_system text DEFAULT NULL,
  _estimated_emission_value numeric DEFAULT NULL,
  _emission_type text DEFAULT NULL,
  _herd_size_range text DEFAULT NULL,
  _calculation_method text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF _tool_name IS NULL OR length(trim(_tool_name)) = 0 THEN
    RAISE EXCEPTION 'tool_name is required';
  END IF;

  INSERT INTO public.territorial_agro_metrics (
    tool_name, municipality, state, production_system,
    estimated_emission_value, emission_type, herd_size_range,
    calculation_method, metadata
  ) VALUES (
    _tool_name, _municipality, _state, _production_system,
    _estimated_emission_value, _emission_type, _herd_size_range,
    _calculation_method, _metadata
  );
END;
$$;