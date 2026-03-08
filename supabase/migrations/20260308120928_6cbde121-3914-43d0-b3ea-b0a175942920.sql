
-- Drop the permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read cache" ON public.ai_response_cache;

-- Create a secure function for cache lookups (no enumeration possible)
CREATE OR REPLACE FUNCTION public.get_cached_response(
  _tool_name text,
  _request_hash text
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT response_text
  FROM public.ai_response_cache
  WHERE tool_name = _tool_name
    AND request_hash = _request_hash
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;
$$;
