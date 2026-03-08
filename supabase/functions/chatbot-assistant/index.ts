import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateAndSanitizeInput, validateMessageHistory } from "../_shared/inputValidation.ts";
import { checkRateLimit } from "../_shared/edgeFunctionUtils.ts";

// Allowed origins for CORS (production + development)
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

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// ===== AUTHENTICATION HELPER =====
interface AuthResult {
  user: { id: string; email?: string } | null;
  plan: string;
  isAdmin: boolean;
  error: string | null;
}

async function authenticateRequest(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, plan: 'free', isAdmin: false, error: 'Authentication required' };
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  
  if (authError || !user) {
    return { user: null, plan: 'free', isAdmin: false, error: 'Invalid or expired token' };
  }

  // Retrieve actual plan from profiles table
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('current_plan')
    .eq('user_id', user.id)
    .single();

  const actualPlan = profile?.current_plan || 'free';

  return { user, plan: actualPlan, isAdmin: false, error: null };
}
// ===== END AUTHENTICATION HELPER =====

const SYSTEM_PROMPT = `Você é o assistente virtual do VetAgro Sustentável AI, um aplicativo de ferramentas de inteligência artificial para profissionais veterinários, zootecnistas, agrônomos e tutores de pets.

Seu papel é ajudar os usuários com:
1. Dicas de uso das ferramentas do app
2. Sugestões de prompts eficientes para obter melhores respostas
3. Informações sobre os planos de assinatura (Free, Pro, Enterprise)
4. Dúvidas gerais sobre funcionalidades

FERRAMENTAS DISPONÍVEIS NO APP:

**Medicina Veterinária:**
- Diagnóstico Diferencial: Insira espécie, idade, peso, sinais clínicos e histórico
- Calculadora de Dose: Apenas para profissionais com registro
- Análise de Mucosa: Informe cor, tempo de reperfusão, umidade
- Resenha de Equinos: Gere documentação oficial de equinos
- Receituário Veterinário: Apenas para profissionais
- Dicionário Veterinário: Busque termos técnicos
- Interpretação de Exames: Upload de PDFs ou imagens

**Zootecnia e Nutrição:**
- Calculadora de Ração: Formule dietas por espécie e objetivo
- Análise Produtiva: Avalie GMD, conversão alimentar, custo
- Escore Corporal (ECC): Avaliação com foto

**Agronomia e Sustentabilidade:**
- Identificador de Plantas: Identifique espécies por foto
- Calculadora de GEE: Calcule emissões de gases
- Consulta Geoespacial: Análise de solo e zoneamento
- Análise de Sustentabilidade: Diagnóstico ambiental
- Análise Climática: Previsões e adaptações
- Calculadora de Metano: Tiers 1, 2 e 3 do IPCC

**Modelagem Avançada:**
- Simulador de Confinamento: Projeções de GMD e custo
- Modelador de Carbono: Elegibilidade para créditos

PLANOS:
- Free: 10 créditos/dia, ferramentas básicas, sem upload
- Pro (R$ 39,90/mês): Ilimitado, upload, PDFs, técnico
- Enterprise (R$ 129,90/mês): Multi-usuário, branding, suporte

DICAS DE PROMPTS:
1. Seja específico: inclua espécie, idade, peso quando relevante
2. Descreva sinais clínicos detalhadamente
3. Informe histórico e ambiente quando possível
4. Para diagnósticos, liste todos os sintomas observados
5. Para nutrição, especifique objetivo (crescimento, mantença, engorda)

Responda de forma amigável, clara e objetiva. Use emojis moderadamente para tornar a conversa mais agradável. Sempre em português brasileiro.`;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authResult = await authenticateRequest(req);
    
    if (authResult.error) {
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(authResult.user!.id, authResult.plan);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente mais tarde.', retryAfter: rateLimitResult.resetIn }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rateLimitResult.resetIn) } }
      );
    }

    const requestBody = await req.json();
    const { message, history } = requestBody;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Validate and sanitize user message
    const messageValidation = validateAndSanitizeInput(message, 'mensagem', 5000);
    if (!messageValidation.valid) {
      return new Response(
        JSON.stringify({ error: messageValidation.error || 'Mensagem inválida' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log warnings for monitoring (don't block)
    if (messageValidation.warnings.length > 0) {
      console.warn('[INPUT_VALIDATION]', messageValidation.warnings.join(', '));
    }

    // Validate and sanitize message history
    const sanitizedHistory = validateMessageHistory(history || [], 10, 5000);

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...sanitizedHistory,
      { role: "user", content: messageValidation.sanitized },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua mensagem.";

    return new Response(
      JSON.stringify({ response: assistantMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Chatbot error:", error);
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
