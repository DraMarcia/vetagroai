import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, getRequestId, authenticateRequest, checkRateLimit } from "../_shared/edgeFunctionUtils.ts";

const REPORT_SYSTEM_PROMPT = `Você é um consultor técnico sênior da VetAgro IA, especialista em medicina veterinária, zootecnia, agronomia e sustentabilidade agropecuária.

Sua tarefa é gerar um RELATÓRIO TÉCNICO PROFISSIONAL com base na pergunta do usuário e na resposta preliminar da IA.

REGRAS OBRIGATÓRIAS:
1. O relatório deve ser MAIS COMPLETO e MAIS TÉCNICO que a resposta original
2. Use linguagem profissional, objetiva e técnica
3. Adicione detalhes técnicos que a resposta original não cobriu
4. Estruture o conteúdo de forma lógica e progressiva
5. NÃO use símbolos de markdown (**, ##, etc.)
6. Use tópicos com • ou - para listas
7. Inclua dados quantitativos quando pertinente

ESTRUTURA OBRIGATÓRIA DO RELATÓRIO:

RESUMO EXECUTIVO
(3 a 5 linhas objetivas resumindo o caso e a conclusão principal)

DIAGNOSTICO TECNICO
(Análise aprofundada do caso, com fundamentação técnica, fatores predisponentes, mecanismos envolvidos)

CONDUTA RECOMENDADA
(Orientações técnicas detalhadas, protocolos específicos, alternativas)

PROTOCOLO DE ACAO
(Passo a passo numerado e detalhado para execução)

PONTOS CRITICOS E RISCOS
(Riscos, contraindicações, fatores de atenção, erros comuns a evitar)

CONSIDERACOES DE SUSTENTABILIDADE
(Impacto ambiental, emissões, boas práticas sustentáveis relacionadas ao caso)

PERGUNTAS PARA CONTINUIDADE
(3 a 5 perguntas estratégicas para aprofundar o caso)

REFERENCIAS TECNICAS
(Mínimo 4 referências reais e confiáveis, numeradas [1], [2], etc. Use fontes como: FAO, IPCC, MAPA, Merck Veterinary Manual, Embrapa, NRC, literatura científica relevante)

REGRAS DE FORMATAÇÃO:
- Cada seção deve ter um título em MAIÚSCULAS seguido de quebra de linha
- Parágrafos curtos (máximo 3 linhas)
- Listas com bullet points usando - ou •
- Referências no formato: [1] Nome da fonte - Título ou descrição, Ano
- Tom consultivo e profissional
- Português brasileiro formal`;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const requestId = getRequestId(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await authenticateRequest(req);
    if (authResult.error) {
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authResult.user!.id;
    const rateLimitResult = await checkRateLimit(userId, authResult.plan);
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ error: "Limite de requisições excedido.", retryAfter: rateLimitResult.resetIn }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rateLimitResult.resetIn) },
      });
    }

    const body = await req.json();
    const userQuestion = body.userQuestion || "";
    const aiResponse = body.aiResponse || "";
    const profileTitle = body.profileTitle || "Consulta Técnica";

    if (!aiResponse) {
      return new Response(JSON.stringify({ error: "Conteúdo da resposta é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `PERFIL DO CONSULTOR: ${profileTitle}

PERGUNTA ORIGINAL DO USUARIO:
${userQuestion || "(Não disponível)"}

RESPOSTA PRELIMINAR DA IA:
${aiResponse}

Com base nas informações acima, gere um RELATÓRIO TÉCNICO PROFISSIONAL completo seguindo a estrutura obrigatória. O relatório deve ser significativamente mais aprofundado e técnico que a resposta preliminar.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurado");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort("timeout"), 55_000);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: REPORT_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[generate-report] AI error", { requestId, status: response.status, body: errorText.slice(0, 500) });

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Erro ao gerar relatório." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reportContent = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ report: reportContent, requestId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[generate-report] error", { requestId, error });
    const msg = error instanceof Error && error.message === "timeout"
      ? "Tempo limite excedido. Tente novamente."
      : "Erro interno. Tente novamente.";
    return new Response(JSON.stringify({ error: msg, requestId }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
