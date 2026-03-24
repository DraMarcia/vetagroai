import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, getRequestId, authenticateRequest, checkRateLimit } from "../_shared/edgeFunctionUtils.ts";

const REPORT_SYSTEM_PROMPT = `Você é um consultor técnico sênior da VetAgro IA com mais de 20 anos de experiência em medicina veterinária, zootecnia, agronomia e sustentabilidade agropecuária.

Sua tarefa é gerar um RELATÓRIO TÉCNICO PROFISSIONAL DE CONSULTORIA. Este relatório NÃO é uma reorganização da resposta original. É uma NOVA CAMADA DE INTELIGÊNCIA que deve:
- Reinterpretar a pergunta do usuário com profundidade técnica
- Expandir significativamente o conteúdo da resposta preliminar
- Adicionar raciocínio clínico/produtivo que não estava presente
- Incluir dados quantitativos, percentuais e métricas quando pertinente
- Apresentar diagnósticos diferenciais quando aplicável
- Classificar riscos (baixo, moderado, alto, crítico)
- Avaliar impacto produtivo e/ou econômico

REGRAS CRÍTICAS:
1. O relatório DEVE SER MELHOR e MAIS COMPLETO que a resposta original - NUNCA apenas copiar/reorganizar
2. Use linguagem profissional, objetiva e técnica de nível consultoria
3. NÃO use símbolos de markdown (**, ##, etc.)
4. Use tópicos com • ou - para listas
5. Inclua justificativas técnicas para cada recomendação
6. Cada seção deve agregar valor técnico novo, não repetir informações

ESTRUTURA OBRIGATÓRIA DO RELATÓRIO:

RESUMO EXECUTIVO
(3 a 5 linhas objetivas resumindo o caso, a conclusão principal e o nível de risco geral)

DIAGNOSTICO TECNICO
(Análise aprofundada: etiologia, fisiopatologia/mecanismos envolvidos, fatores predisponentes, diagnósticos diferenciais quando aplicável. Deve ir ALÉM do que foi perguntado.)

ANALISE TECNICA APROFUNDADA
(Esta é a seção mais importante. Deve conter: raciocínio técnico detalhado, justificativa científica das conclusões, análise de causa-raiz, correlações entre fatores, impacto produtivo/econômico estimado, classificação de risco: baixo/moderado/alto/crítico. Esta seção diferencia o relatório de uma resposta comum.)

CONDUTA RECOMENDADA
(Orientações técnicas detalhadas com justificativa para cada recomendação, alternativas terapêuticas/de manejo, critérios de decisão entre opções)

PROTOCOLO DE ACAO
(Passo a passo numerado, detalhado e cronológico para execução. Incluir tempos, doses, frequências quando aplicável.)

PONTOS CRITICOS E RISCOS
(Riscos classificados por gravidade, contraindicações, interações, erros comuns a evitar, sinais de alerta para reavaliação)

CONSIDERACOES DE SUSTENTABILIDADE
(Impacto ambiental direto e indireto, emissões de GEE relacionadas, boas práticas sustentáveis, oportunidades de melhoria ambiental)

PERGUNTAS PARA CONTINUIDADE
(3 a 5 perguntas estratégicas que um consultor faria para aprofundar o caso e agregar mais valor)

REFERENCIAS TECNICAS
(Mínimo 5 referências REAIS e ESPECÍFICAS ao conteúdo do caso. NÃO use referências genéricas. Cada referência deve estar diretamente relacionada a algum ponto discutido no relatório. Formato: [1] Autor/Instituição - Título específico, Ano. Priorize: FAO, IPCC, MAPA, Embrapa, Merck Veterinary Manual, NRC, CEPEA, artigos científicos relevantes ao tema.)

REGRAS DE FORMATAÇÃO:
- Cada seção deve ter um título em MAIÚSCULAS seguido de quebra de linha
- Parágrafos curtos (máximo 3 linhas)
- Listas com bullet points usando - ou •
- Referências numeradas: [1] Fonte - Descrição, Ano
- Tom consultivo e profissional de alto nível
- Português brasileiro formal
- Cite as referências no corpo do texto usando [1], [2], etc.`;

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

RESPOSTA PRELIMINAR DA IA (use como base, mas NÃO copie - EXPANDA e APROF UNDE):
${aiResponse}

INSTRUCOES CRITICAS:
1. NÃO reorganize o texto acima. Gere conteúdo NOVO e MAIS PROFUNDO.
2. A seção "ANALISE TECNICA APROFUNDADA" é a mais importante - deve conter raciocínio técnico que NÃO estava na resposta original.
3. Inclua diagnósticos diferenciais quando o caso permitir.
4. Classifique riscos como: baixo, moderado, alto ou crítico.
5. Estime impacto produtivo/econômico quando possível.
6. As referências devem ser ESPECÍFICAS ao caso - NÃO use referências genéricas. Cite-as no corpo do texto com [1], [2], etc.
7. Justifique tecnicamente CADA recomendação.
8. O relatório final deve parecer material de consultoria profissional de alto nível.

Gere o RELATÓRIO TÉCNICO PROFISSIONAL completo agora.`;

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
