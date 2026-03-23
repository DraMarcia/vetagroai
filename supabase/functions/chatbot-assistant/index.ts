import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, authenticateRequest, checkRateLimit } from "../_shared/edgeFunctionUtils.ts";
import { validateAndSanitizeInput, validateMessageHistory } from "../_shared/inputValidation.ts";

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

async function callPerplexity(messages: any[], apiKey: string): Promise<{ response: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages,
        max_tokens: 1000,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!resp.ok) throw new Error(`perplexity_${resp.status}`);

    const data = await resp.json();
    return { response: data.choices?.[0]?.message?.content || "" };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

async function callLovable(messages: any[], apiKey: string): Promise<{ response: string }> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      max_tokens: 1000,
    }),
  });

  if (!resp.ok) throw new Error(`lovable_${resp.status}`);

  const data = await resp.json();
  return { response: data.choices?.[0]?.message?.content || "" };
}

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
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(authResult.user!.id, authResult.plan);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: "Limite de requisições excedido. Tente novamente mais tarde.", retryAfter: rateLimitResult.resetIn }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rateLimitResult.resetIn) } },
      );
    }

    const requestBody = await req.json();
    const { message, history } = requestBody;

    // Validate
    const messageValidation = validateAndSanitizeInput(message, "mensagem", 5000);
    if (!messageValidation.valid) {
      return new Response(
        JSON.stringify({ error: messageValidation.error || "Mensagem inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (messageValidation.warnings.length > 0) {
      console.warn("[INPUT_VALIDATION]", messageValidation.warnings.join(", "));
    }

    const sanitizedHistory = validateMessageHistory(history || [], 10, 5000);
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...sanitizedHistory,
      { role: "user", content: messageValidation.sanitized },
    ];

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    let result: { response: string };

    // Try Perplexity first, fallback to Lovable AI
    if (PERPLEXITY_API_KEY) {
      try {
        result = await callPerplexity(messages, PERPLEXITY_API_KEY);
        console.info("[chatbot-assistant] Using Perplexity sonar-pro");
      } catch (err) {
        console.warn("[chatbot-assistant] Perplexity failed:", (err as Error).message);
        if (!LOVABLE_API_KEY) throw new Error("AI service unavailable");
        result = await callLovable(messages, LOVABLE_API_KEY);
        console.info("[chatbot-assistant] Fallback to Lovable AI");
      }
    } else if (LOVABLE_API_KEY) {
      result = await callLovable(messages, LOVABLE_API_KEY);
    } else {
      throw new Error("No AI key configured");
    }

    const assistantMessage = result.response || "Desculpe, não consegui processar sua mensagem.";

    return new Response(
      JSON.stringify({ response: assistantMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Chatbot error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor. Tente novamente." }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } },
    );
  }
});
