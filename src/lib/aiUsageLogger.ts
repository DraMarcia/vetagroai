import { supabase } from "@/integrations/supabase/client";

/**
 * Log AI usage for cost monitoring. Fire-and-forget.
 */
export function logAiUsage(params: {
  toolName: string;
  aiModel?: string;
  tokensInput?: number;
  tokensOutput?: number;
  responseTimeMs?: number;
  userPlan?: string;
}): void {
  (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      await (supabase.from("ai_usage_logs") as any).insert({
        user_id: session.user.id,
        tool_name: params.toolName,
        ai_model: params.aiModel || null,
        tokens_input: params.tokensInput || 0,
        tokens_output: params.tokensOutput || 0,
        response_time_ms: params.responseTimeMs || null,
        user_plan: params.userPlan || null,
      });
    } catch (e) {
      console.warn("[AiUsageLogger] Failed to log:", e);
    }
  })();
}
