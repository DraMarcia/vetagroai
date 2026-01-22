import { supabase } from "@/integrations/supabase/client";

type InvokeResult<T> = {
  ok: boolean;
  requestId: string;
  data?: T;
  error?: unknown;
};

function safeBodyPreview(body: unknown, maxLen = 2000) {
  try {
    const s = JSON.stringify(body);
    return s.length > maxLen ? s.slice(0, maxLen) + "…" : s;
  } catch {
    return "[unserializable body]";
  }
}

function getPlatformHint() {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  return isMobile ? "mobile" : "desktop";
}

/**
 * Standardized Edge Function invocation for desktop debugging parity.
 * - Injects X-Request-ID for correlation
 * - Logs origin, fn name, and a truncated payload preview
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string,
  body: unknown,
  opts?: { silenceConsole?: boolean }
): Promise<InvokeResult<T>> {
  const requestId = (globalThis.crypto?.randomUUID?.() ?? `req_${Date.now()}_${Math.random().toString(16).slice(2)}`);

  const meta = {
    requestId,
    functionName,
    origin: typeof window !== "undefined" ? window.location.origin : "unknown",
    platform: getPlatformHint(),
  };

  if (!opts?.silenceConsole) {
    console.info("[EdgeInvoke] ->", meta, safeBodyPreview(body));
  }

  try {
    const startedAt = performance.now();
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
      headers: {
        "X-Request-ID": requestId,
        "X-Client-Platform": meta.platform,
      },
    });

    const ms = Math.round(performance.now() - startedAt);
    if (!opts?.silenceConsole) {
      console.info("[EdgeInvoke] <-", { ...meta, ms, hasError: Boolean(error) });
    }

    if (error) return { ok: false, requestId, error };
    return { ok: true, requestId, data: data as T };
  } catch (error) {
    if (!opts?.silenceConsole) {
      console.error("[EdgeInvoke] !!", meta, error);
    }
    return { ok: false, requestId, error };
  }
}
