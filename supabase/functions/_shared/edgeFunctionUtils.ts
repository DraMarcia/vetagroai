import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sanitizeClinicalData } from "./inputValidation.ts";

// ===== CORS =====
const allowedOrigins = [
  'https://vetagro.ai',
  'https://www.vetagro.ai',
  'https://vetagroai.lovable.app',
  'https://id-preview--3dd84b8e-5245-406b-9a7f-df349f142adc.lovable.app',
  'https://3dd84b8e-5245-406b-9a7f-df349f142adc.lovableproject.com',
  'https://app.vetagroai.com.br',
  'https://vetagro-sustentavel.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id, x-client-platform',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function getRequestId(req: Request) {
  return req.headers.get('x-request-id') || (globalThis.crypto?.randomUUID?.() ?? `req_${Date.now()}`);
}

// ===== RATE LIMITING (DB-backed, persistent across cold starts) =====
const RATE_LIMITS: Record<string, { maxRequests: number; windowSeconds: number }> = {
  free: { maxRequests: 10, windowSeconds: 3600 },
  pro: { maxRequests: 100, windowSeconds: 3600 },
  enterprise: { maxRequests: 1000, windowSeconds: 3600 },
  default: { maxRequests: 5, windowSeconds: 3600 },
};

export async function checkRateLimit(identifier: string, plan: string = 'default') {
  const limits = RATE_LIMITS[plan] || RATE_LIMITS.default;
  try {
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const { data, error } = await adminClient.rpc('check_rate_limit', {
      _identifier: identifier,
      _plan: plan,
      _max_requests: limits.maxRequests,
      _window_seconds: limits.windowSeconds,
    });
    if (error || !data) {
      console.warn('[RateLimit] DB check failed, allowing request:', error?.message);
      return { allowed: true, remaining: limits.maxRequests - 1, resetIn: limits.windowSeconds };
    }
    return { allowed: data.allowed as boolean, remaining: data.remaining as number, resetIn: data.resetIn as number };
  } catch (err) {
    console.warn('[RateLimit] Exception, allowing request:', err);
    return { allowed: true, remaining: limits.maxRequests - 1, resetIn: limits.windowSeconds };
  }
}

// ===== AUTHENTICATION =====
export interface AuthResult {
  user: { id: string; email?: string } | null;
  plan: string;
  isAdmin: boolean;
  isProfessional: boolean;
  error: string | null;
}

export async function authenticateRequest(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, plan: 'default', isAdmin: false, isProfessional: false, error: 'Authentication required' };
  }
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !user) {
    return { user: null, plan: 'default', isAdmin: false, isProfessional: false, error: 'Invalid or expired token' };
  }
  const { data: profile } = await supabaseClient.from('profiles').select('current_plan, is_professional').eq('user_id', user.id).single();
  const { data: adminRole } = await supabaseClient.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
  return { user, plan: profile?.current_plan || 'free', isAdmin: !!adminRole, isProfessional: profile?.is_professional ?? false, error: null };
}

// ===== SANITIZE =====
export function sanitizeField(value: unknown, maxLen: number = 2000): string {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string') return String(value).substring(0, maxLen);
  return sanitizeClinicalData(value).substring(0, maxLen);
}

// ===== AI CALL =====
type MessageContent = string | Array<{ type: string; text?: string; image_url?: { url: string } }>;

export async function callLovableAI(params: {
  requestId: string;
  corsHeaders: Record<string, string>;
  systemPrompt: string;
  userPrompt: string;
  requestBody: any;
  model?: string;
}): Promise<Response> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY não configurado');
  }

  const messages: Array<{ role: string; content: MessageContent }> = [
    { role: 'system', content: params.systemPrompt }
  ];

  const toolImages = params.requestBody?.data?.images || params.requestBody?.images;
  const hasToolImages = Array.isArray(toolImages) && toolImages.length > 0;

  if (hasToolImages) {
    const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: 'text', text: params.userPrompt }
    ];
    for (const img of toolImages.slice(0, 5)) {
      if (typeof img === 'string' && img.startsWith('data:image')) {
        contentParts.push({ type: 'image_url', image_url: { url: img } });
      }
    }
    messages.push({ role: 'user', content: contentParts });
  } else {
    messages.push({ role: 'user', content: params.userPrompt });
  }

  console.info(`[EdgeFunction] AI call`, {
    requestId: params.requestId,
    model: params.model || 'google/gemini-2.5-flash',
    messagesCount: messages.length,
    hasMultimodal: hasToolImages,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('timeout'), 55_000);

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: params.model || 'google/gemini-2.5-flash', messages }),
    signal: controller.signal,
  });

  clearTimeout(timeout);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[EdgeFunction] AI gateway error', { requestId: params.requestId, status: response.status, bodyPreview: errorText.slice(0, 1500) });
    return new Response(
      JSON.stringify({ error: `Erro na API: ${response.status}`, requestId: params.requestId }),
      { status: response.status, headers: { ...params.corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content || "Não foi possível gerar resposta.";

  return new Response(JSON.stringify({ answer, response: answer }), {
    headers: { ...params.corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Standard handler wrapper for specialized edge functions.
 * Handles CORS, auth, rate limiting, and delegates to the tool-specific logic.
 */
export async function handleRequest(
  req: Request,
  buildPrompts: (params: {
    requestBody: any;
    data: any;
    tool: string;
    plan: string;
    isProfessional: boolean;
    sanitizeField: typeof sanitizeField;
  }) => { systemPrompt: string; userPrompt: string } | null
): Promise<Response> {
  const corsHeaders = getCorsHeaders(req);
  const requestId = getRequestId(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await authenticateRequest(req);
    if (authResult.error) {
      return new Response(JSON.stringify({ error: authResult.error }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = authResult.user!.id;
    const plan = authResult.plan;

    const rateLimitResult = checkRateLimit(userId, plan);
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ error: 'Limite de requisições excedido.', retryAfter: rateLimitResult.resetIn }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(rateLimitResult.resetIn) } });
    }

    const requestBody = await req.json();
    const tool = sanitizeField(requestBody?.tool, 100);
    const data = (requestBody.data && typeof requestBody.data === 'object') ? requestBody.data : requestBody;
    const isProfessional = authResult.isProfessional;

    console.info(`[EdgeFunction] request`, { requestId, tool, origin: req.headers.get('origin') });

    const prompts = buildPrompts({ requestBody, data, tool, plan, isProfessional, sanitizeField });

    if (!prompts) {
      return new Response(JSON.stringify({ error: 'Tool not supported: ' + tool }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return await callLovableAI({
      requestId,
      corsHeaders,
      systemPrompt: prompts.systemPrompt,
      userPrompt: prompts.userPrompt,
      requestBody,
    });
  } catch (error) {
    console.error('[EdgeFunction] handler error', { requestId, error });
    return new Response(JSON.stringify({ error: 'Erro interno do servidor. Tente novamente.', requestId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}
