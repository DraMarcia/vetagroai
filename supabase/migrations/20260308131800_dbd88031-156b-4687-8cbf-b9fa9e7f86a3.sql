
-- Revoke all direct access to the admin view from public and authenticated roles
REVOKE ALL ON public.tool_suggestions_admin_view FROM anon;
REVOKE ALL ON public.tool_suggestions_admin_view FROM authenticated;
