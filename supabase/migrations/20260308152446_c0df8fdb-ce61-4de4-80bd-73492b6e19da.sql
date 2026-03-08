-- Create persistent rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limit_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_key text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  window_end timestamptz NOT NULL,
  UNIQUE(rate_key)
);

-- Enable RLS
ALTER TABLE public.rate_limit_entries ENABLE ROW LEVEL SECURITY;

-- No direct access for any role - only via SECURITY DEFINER function
CREATE POLICY "No direct access to rate limits"
  ON public.rate_limit_entries
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- Create atomic rate limit check function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _identifier text,
  _plan text DEFAULT 'default',
  _max_requests integer DEFAULT 5,
  _window_seconds integer DEFAULT 3600
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _key text;
  _now timestamptz := now();
  _entry record;
  _allowed boolean;
  _remaining integer;
  _reset_in integer;
BEGIN
  _key := _plan || ':' || _identifier;

  -- Clean up expired entries (lightweight, only matching key)
  DELETE FROM public.rate_limit_entries WHERE rate_key = _key AND window_end <= _now;

  -- Try to get existing entry
  SELECT * INTO _entry FROM public.rate_limit_entries WHERE rate_key = _key;

  IF _entry IS NULL THEN
    -- First request in window
    INSERT INTO public.rate_limit_entries (rate_key, request_count, window_start, window_end)
    VALUES (_key, 1, _now, _now + (_window_seconds || ' seconds')::interval)
    ON CONFLICT (rate_key) DO UPDATE
      SET request_count = rate_limit_entries.request_count + 1
    RETURNING * INTO _entry;
    
    _allowed := true;
    _remaining := _max_requests - _entry.request_count;
    _reset_in := _window_seconds;
  ELSIF _entry.request_count >= _max_requests THEN
    -- Rate limit exceeded
    _allowed := false;
    _remaining := 0;
    _reset_in := GREATEST(1, EXTRACT(EPOCH FROM (_entry.window_end - _now))::integer);
  ELSE
    -- Increment counter
    UPDATE public.rate_limit_entries
    SET request_count = request_count + 1
    WHERE rate_key = _key
    RETURNING * INTO _entry;
    
    _allowed := true;
    _remaining := _max_requests - _entry.request_count;
    _reset_in := GREATEST(1, EXTRACT(EPOCH FROM (_entry.window_end - _now))::integer);
  END IF;

  RETURN json_build_object(
    'allowed', _allowed,
    'remaining', GREATEST(0, _remaining),
    'resetIn', _reset_in
  );
END;
$$;

-- Cleanup function for old rate limit entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.rate_limit_entries WHERE window_end <= now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;