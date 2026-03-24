-- Ensure no direct SELECT access to ai_response_cache for any API role
REVOKE SELECT ON public.ai_response_cache FROM anon;
REVOKE SELECT ON public.ai_response_cache FROM authenticated;
REVOKE INSERT ON public.ai_response_cache FROM anon;
REVOKE INSERT ON public.ai_response_cache FROM authenticated;