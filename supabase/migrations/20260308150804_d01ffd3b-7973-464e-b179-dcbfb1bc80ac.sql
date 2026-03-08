
-- ============================================================
-- FIX 1: Recreate ALL RLS policies as PERMISSIVE (not RESTRICTIVE)
-- PostgreSQL default-denies when only RESTRICTIVE policies exist.
-- ============================================================

-- ---- profiles ----
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Only admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ---- user_preferences ----
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON public.user_preferences;

CREATE POLICY "Users can view their own preferences" ON public.user_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own preferences" ON public.user_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON public.user_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own preferences" ON public.user_preferences FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---- user_tool_history ----
DROP POLICY IF EXISTS "Users can view their own tool history" ON public.user_tool_history;
DROP POLICY IF EXISTS "Users can insert their own tool history" ON public.user_tool_history;
DROP POLICY IF EXISTS "Users can delete their own tool history" ON public.user_tool_history;

CREATE POLICY "Users can view their own tool history" ON public.user_tool_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tool history" ON public.user_tool_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tool history" ON public.user_tool_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---- user_farm_metrics ----
DROP POLICY IF EXISTS "Users can view their own metrics" ON public.user_farm_metrics;
DROP POLICY IF EXISTS "Users can insert their own metrics" ON public.user_farm_metrics;
DROP POLICY IF EXISTS "Users can update their own metrics" ON public.user_farm_metrics;
DROP POLICY IF EXISTS "Users can delete their own metrics" ON public.user_farm_metrics;

CREATE POLICY "Users can view their own metrics" ON public.user_farm_metrics FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own metrics" ON public.user_farm_metrics FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own metrics" ON public.user_farm_metrics FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own metrics" ON public.user_farm_metrics FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---- ai_usage_logs ----
DROP POLICY IF EXISTS "Admins can view all AI usage logs" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "Authenticated users can insert AI usage logs" ON public.ai_usage_logs;

CREATE POLICY "Admins can view all AI usage logs" ON public.ai_usage_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can insert AI usage logs" ON public.ai_usage_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ---- tool_suggestions ----
DROP POLICY IF EXISTS "Users can view their own suggestions" ON public.tool_suggestions;
DROP POLICY IF EXISTS "Users can insert their own suggestions" ON public.tool_suggestions;
DROP POLICY IF EXISTS "Admins can update suggestions" ON public.tool_suggestions;
DROP POLICY IF EXISTS "Admins can delete suggestions" ON public.tool_suggestions;
DROP POLICY IF EXISTS "Admins can view all suggestions" ON public.tool_suggestions;

CREATE POLICY "Users can view their own suggestions" ON public.tool_suggestions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all suggestions" ON public.tool_suggestions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert their own suggestions" ON public.tool_suggestions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update suggestions" ON public.tool_suggestions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete suggestions" ON public.tool_suggestions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ---- tool_monitoring_logs ----
DROP POLICY IF EXISTS "Admins can view all monitoring logs" ON public.tool_monitoring_logs;
DROP POLICY IF EXISTS "Authenticated users can insert monitoring logs" ON public.tool_monitoring_logs;
DROP POLICY IF EXISTS "Admins can delete monitoring logs" ON public.tool_monitoring_logs;

CREATE POLICY "Admins can view all monitoring logs" ON public.tool_monitoring_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can insert monitoring logs" ON public.tool_monitoring_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can delete monitoring logs" ON public.tool_monitoring_logs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ---- ai_response_cache ----
DROP POLICY IF EXISTS "Admins can delete cache" ON public.ai_response_cache;
DROP POLICY IF EXISTS "Authenticated users can insert cache" ON public.ai_response_cache;

CREATE POLICY "Admins can delete cache" ON public.ai_response_cache FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can insert cache" ON public.ai_response_cache FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- ---- app_config ----
DROP POLICY IF EXISTS "Only admins can read config" ON public.app_config;
DROP POLICY IF EXISTS "Block all config modifications" ON public.app_config;

CREATE POLICY "Only admins can read config" ON public.app_config FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Block all config modifications" ON public.app_config FOR ALL TO authenticated USING (false) WITH CHECK (false);

-- ---- user_roles ----
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only system can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Block all user role updates" ON public.user_roles;
DROP POLICY IF EXISTS "Block all user role deletions" ON public.user_roles;

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Only system can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "Block all user role updates" ON public.user_roles FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Block all user role deletions" ON public.user_roles FOR DELETE TO authenticated USING (false);

-- ---- territorial_agro_metrics ----
DROP POLICY IF EXISTS "Anyone can read territorial metrics" ON public.territorial_agro_metrics;
DROP POLICY IF EXISTS "Authenticated users can insert territorial metrics" ON public.territorial_agro_metrics;
DROP POLICY IF EXISTS "Admins can delete territorial metrics" ON public.territorial_agro_metrics;

CREATE POLICY "Anyone can read territorial metrics" ON public.territorial_agro_metrics FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert territorial metrics" ON public.territorial_agro_metrics FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can delete territorial metrics" ON public.territorial_agro_metrics FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- FIX 2: Secure the admin view with security_invoker
-- Recreate with security_invoker = true so caller's RLS applies
-- ============================================================
DROP VIEW IF EXISTS public.tool_suggestions_admin_view;
CREATE VIEW public.tool_suggestions_admin_view
  WITH (security_invoker = true)
AS
  SELECT id, created_at, category, status, suggestion
  FROM public.tool_suggestions;

-- Revoke direct access (access is via get_admin_tool_suggestions RPC)
REVOKE ALL ON public.tool_suggestions_admin_view FROM anon;
REVOKE ALL ON public.tool_suggestions_admin_view FROM authenticated;
