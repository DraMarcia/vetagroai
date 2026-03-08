import { invokeEdgeFunction } from "@/lib/edgeInvoke";
import { logToolSuccess, logToolError } from "@/lib/toolMonitoring";

const FRIENDLY_MESSAGES: Record<string, string> = {
  "429": "O sistema está temporariamente ocupado. Aguarde alguns instantes e tente novamente.",
  "402": "Créditos insuficientes. Atualize seu plano para continuar.",
  "500": "Nosso servidor encontrou uma dificuldade temporária. Por favor, tente novamente em alguns instantes.",
  "503": "O serviço está temporariamente indisponível. Tente novamente em alguns instantes.",
  "timeout": "A análise excedeu o tempo limite. Tente novamente com menos dados ou imagens.",
  "network": "Falha na conexão. Verifique sua internet e tente novamente.",
};

const FALLBACK_NOTICE =
  "\n\n---\nA análise automática da imagem não pôde ser concluída neste momento. O relatório foi gerado com base nas informações fornecidas.";

function detectErrorType(err: unknown): string {
  const msg = String(err && typeof err === "object" && "message" in err ? (err as any).message : err);
  for (const code of Object.keys(FRIENDLY_MESSAGES)) {
    if (msg.includes(code)) return code;
  }
  if (/timeout|timed?\s*out|aborted/i.test(msg)) return "timeout";
  if (/network|fetch|failed to fetch|net::err/i.test(msg)) return "network";
  return "unknown";
}

export type ResilientResult<T = any> = {
  ok: boolean;
  data?: T;
  friendlyError?: string;
  /** If true, images failed but text analysis may still be usable */
  imageFallback?: boolean;
};

/**
 * Resilient wrapper around invokeEdgeFunction.
 * - Never throws to the caller
 * - Maps technical errors to user-friendly Portuguese messages
 * - Returns a structured result the page can handle gracefully
 */
export async function resilientInvoke<T = any>(
  functionName: string,
  body: Record<string, unknown>,
  opts?: {
    /** Field name in the response that holds the answer */
    answerField?: string;
    /** If true, the call includes images and should degrade gracefully on image failure */
    hasImages?: boolean;
  }
): Promise<ResilientResult<T>> {
  const startedAt = performance.now();
  try {
    const res = await invokeEdgeFunction<T>(functionName, body);
    const elapsed = Math.round(performance.now() - startedAt);

    if (!res.ok) {
      const errorType = detectErrorType(res.error);
      const friendlyMsg = FRIENDLY_MESSAGES[errorType] || 
        "Ocorreu um problema temporário. Por favor, tente novamente.";
      
      console.warn("[ResilientInvoke] Error mapped:", { errorType, requestId: res.requestId, raw: res.error });
      logToolError(functionName, res.error, elapsed, res.requestId);
      return { ok: false, friendlyError: friendlyMsg };
    }

    // Validate answer is present
    const answerField = opts?.answerField || "answer";
    const data = res.data as any;
    
    if (data && !data[answerField] && !data.response && !data.analysis && !data.resenha) {
      console.warn("[ResilientInvoke] Empty response body", { requestId: res.requestId });
      logToolError(functionName, "empty_response", elapsed, res.requestId);
      return { 
        ok: false, 
        friendlyError: "O servidor retornou uma resposta vazia. Tente novamente." 
      };
    }

    logToolSuccess(functionName, elapsed, res.requestId);
    return { ok: true, data: res.data };
  } catch (err) {
    const elapsed = Math.round(performance.now() - startedAt);
    const errorType = detectErrorType(err);
    const friendlyMsg = FRIENDLY_MESSAGES[errorType] ||
      "Ocorreu um problema temporário. Por favor, tente novamente.";
    
    console.error("[ResilientInvoke] Uncaught error:", err);
    logToolError(functionName, err, elapsed);
    return { ok: false, friendlyError: friendlyMsg };
  }
}

/**
 * Extract the answer from a resilient result, checking multiple common field names.
 */
export function extractAnswer(data: any): string {
  if (!data) return "";
  return data.answer || data.response || data.analysis || data.resenha || "";
}

/**
 * Append image fallback notice to a result string when images couldn't be processed.
 */
export function appendImageFallbackNotice(result: string): string {
  return result + FALLBACK_NOTICE;
}
