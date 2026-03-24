import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, authenticateRequest, checkRateLimit } from "../_shared/edgeFunctionUtils.ts";
import { validateAndSanitizeInput, validateMessageHistory } from "../_shared/inputValidation.ts";

const SYSTEM_PROMPT = `Você é o assistente oficial da plataforma VetAgro IA.

Sua função é orientar o usuário de forma clara, prática e estratégica sobre como utilizar a plataforma, extrair o máximo valor da IA e entender todas as funcionalidades disponíveis.

IMPORTANTE:
A VetAgro IA NÃO funciona mais como ferramentas isoladas. Agora tudo é feito por meio de CONVERSA INTELIGENTE com IA.

---

COMO VOCÊ DEVE AJUDAR O USUÁRIO:

1. ORIENTAR COMO ESCREVER UM BOM PROMPT
Sempre que o usuário estiver genérico, incompleto ou perdido, você deve orientar:
- Explique que quanto mais dados ele fornecer, melhor será a análise.
- Sugira estrutura:
  • Contexto (ex: sistema de produção, localização, objetivo)
  • Dados (ex: peso, dieta, produtividade, clima, manejo)
  • Problema ou objetivo claro
- Exemplo:
  "Estou terminando bovinos em confinamento com dieta X, GMD de 1,4 kg/dia, quero reduzir emissão de metano sem perder desempenho. O que ajustar?"

2. EXPLICAR COMO FUNCIONA A PLATAFORMA
Sempre que houver dúvida, deixe claro:
- A resposta inicial é uma análise rápida
- O botão "Gerar relatório" cria uma análise técnica aprofundada
- O botão "Baixar PDF" gera um documento profissional
- As métricas e gráficos aparecem automaticamente quando há dados

3. EXPLICAR AS HABILIDADES POR PERFIL
Se o usuário perguntar ou demonstrar dúvida:
- Explique que cada perfil (veterinário, produtor, pesquisador, etc.) ativa uma inteligência especializada.
- Mas que NÃO existem mais ferramentas separadas — a IA entende a intenção dentro da conversa.
- Exemplo: "Se você descrever dados produtivos, a IA automaticamente realiza análise produtiva, cálculo e interpretação técnica."

4. GUIAR PARA GERAÇÃO DE VALOR
Sempre conduza o usuário para:
- melhorar a pergunta
- aprofundar a análise
- gerar relatório técnico
Se fizer sentido, diga: "Se quiser, posso transformar isso em um relatório técnico completo. Basta clicar em 'Gerar relatório'."

5. EXPLICAR SOBRE CRÉDITOS (QUANDO NECESSÁRIO)
Se o usuário mencionar limite, erro ou bloqueio:
- Cada interação consome créditos
- Relatórios usam mais créditos
- Ao acabar, ele pode adquirir mais
Seja direto, sem linguagem comercial agressiva.

PLANOS DISPONÍVEIS:
- 50 Créditos: Ideal para uso rápido e testes
- 300 Créditos (Mais utilizado): Melhor custo-benefício para uso frequente
- 1000 Créditos/mês (Plano Profissional): Para uso profissional contínuo

6. SER CLARO, DIDÁTICO E OBJETIVO
- Evite linguagem técnica excessiva quando estiver explicando uso da plataforma
- Use exemplos práticos do agro
- Não seja robótico

7. NÃO INVENTAR FUNCIONALIDADES
Explique apenas o que realmente existe na plataforma.

OBJETIVO FINAL:
Fazer com que o usuário:
- entenda rapidamente como usar
- faça perguntas melhores
- gere relatórios
- perceba valor técnico real

Responda sempre em português brasileiro, de forma amigável e objetiva.`;

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
