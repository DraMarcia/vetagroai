import { supabase } from "@/integrations/supabase/client";

export type MonitoringEvent = {
  toolName: string;
  toolRoute?: string;
  eventType: "usage" | "error" | "timeout" | "empty_response" | "auth_error" | "upload_error";
  errorType?: string;
  errorMessage?: string;
  responseTimeMs?: number;
  userPlan?: string;
  requestStatus?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Log a tool monitoring event to the database.
 * Fire-and-forget — never blocks the caller.
 */
export function logToolEvent(event: MonitoringEvent): void {
  (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return; // Only log for authenticated users

      await (supabase.from("tool_monitoring_logs") as any).insert({
        user_id: session.user.id,
        tool_name: event.toolName,
        tool_route: event.toolRoute || window.location.pathname,
        event_type: event.eventType,
        error_type: event.errorType || null,
        error_message: event.errorMessage?.slice(0, 500) || null,
        response_time_ms: event.responseTimeMs || null,
        user_plan: event.userPlan || null,
        request_status: event.requestStatus || null,
        request_id: event.requestId || null,
        metadata: event.metadata || null,
      });
    } catch (e) {
      console.warn("[ToolMonitoring] Failed to log event:", e);
    }
  })();
}

/**
 * Classify an error from resilientInvoke and log it.
 */
export function logToolError(
  toolName: string,
  error: unknown,
  responseTimeMs?: number,
  requestId?: string
): void {
  const msg = String(error && typeof error === "object" && "message" in error ? (error as any).message : error);

  let errorType = "unknown";
  if (/timeout|timed?\s*out|aborted/i.test(msg)) errorType = "timeout";
  else if (/network|fetch|failed to fetch|net::err/i.test(msg)) errorType = "network";
  else if (/401|403|auth/i.test(msg)) errorType = "auth_error";
  else if (/429/i.test(msg)) errorType = "rate_limit";
  else if (/500|503/i.test(msg)) errorType = "server_error";
  else if (/empty|vazio/i.test(msg)) errorType = "empty_response";

  logToolEvent({
    toolName,
    eventType: errorType === "timeout" ? "timeout" : errorType === "auth_error" ? "auth_error" : "error",
    errorType,
    errorMessage: msg.slice(0, 500),
    responseTimeMs,
    requestStatus: "failed",
    requestId,
  });
}

/**
 * Log a successful tool usage event.
 */
export function logToolSuccess(
  toolName: string,
  responseTimeMs: number,
  requestId?: string
): void {
  logToolEvent({
    toolName,
    eventType: "usage",
    responseTimeMs,
    requestStatus: "success",
    requestId,
  });
}
