-- Add created_by to track who created cache entries (NULL = server/system)
ALTER TABLE public.ai_response_cache ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT NULL;

-- Update set_cached_response to mark entries as system-created (NULL created_by = trusted)
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
  INSERT INTO public.ai_response_cache (tool_name, request_hash, request_signature, response_text, expires_at, created_by)
  VALUES (_tool_name, _request_hash, _request_signature, _response_text, _expires_at, auth.uid())
  ON CONFLICT (request_hash) DO UPDATE
    SET response_text = EXCLUDED.response_text,
        expires_at = EXCLUDED.expires_at,
        created_by = auth.uid(),
        created_at = now();
END;
$$;

-- Update get_cached_response to only serve entries created by the requesting user
CREATE OR REPLACE FUNCTION public.get_cached_response(_tool_name text, _request_hash text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT response_text
  FROM public.ai_response_cache
  WHERE tool_name = _tool_name
    AND request_hash = _request_hash
    AND expires_at > now()
    AND created_by = auth.uid()
  ORDER BY created_at DESC
  LIMIT 1;
$$;