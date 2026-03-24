import { supabase } from "@/integrations/supabase/client";

// Tools with longer cache (scientific/reference tools)
const LONG_CACHE_TOOLS = new Set([
  "dicionario",
  "calculadora-gee",
  "modelador-carbono",
  "analise-sustentabilidade",
]);

/**
 * Generate a deterministic hash from a string using Web Crypto API.
 */
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Build a cache key from tool name and relevant request parameters.
 * Strips user-specific or volatile fields.
 */
function buildCacheSignature(toolName: string, body: Record<string, unknown>): string {
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (
      key === "image" || key === "images" || key === "imageData" ||
      key === "image_data" || key === "pdf" || key === "pdfData" ||
      key === "timestamp" || key === "user_id" || key === "userId"
    ) continue;
    filtered[key] = value;
  }
  return `${toolName}:${JSON.stringify(filtered, Object.keys(filtered).sort())}`;
}

/**
 * Check cache for an existing response.
 */
export async function getCachedResponse(
  toolName: string,
  body: Record<string, unknown>
): Promise<string | null> {
  try {
    const signature = buildCacheSignature(toolName, body);
    const hash = await sha256(signature);

    const { data, error } = await supabase.rpc("get_cached_response", {
      _tool_name: toolName,
      _request_hash: hash,
    });

    if (error || !data) return null;
    return data as string;
  } catch {
    return null;
  }
}

/**
 * Store a response in cache via SECURITY DEFINER RPC (no direct table INSERT).
 */
export async function setCachedResponse(
  toolName: string,
  body: Record<string, unknown>,
  responseText: string
): Promise<void> {
  try {
    if (!responseText || responseText.length < 100) return;

    const signature = buildCacheSignature(toolName, body);
    const hash = await sha256(signature);

    const ttlHours = LONG_CACHE_TOOLS.has(toolName) ? 72 : 24;
    const expiresAt = new Date(Date.now() + ttlHours * 3600_000).toISOString();

    await (supabase.rpc as any)("set_cached_response", {
      _tool_name: toolName,
      _request_hash: hash,
      _request_signature: signature.slice(0, 500),
      _response_text: responseText,
      _expires_at: expiresAt,
    });
  } catch (e) {
    console.warn("[ResponseCache] Failed to cache:", e);
  }
}

/**
 * Check if a request body contains images/files (cache should be skipped).
 */
export function hasMediaContent(body: Record<string, unknown>): boolean {
  return Boolean(
    body.image || body.images || body.imageData ||
    body.image_data || body.pdf || body.pdfData
  );
}
