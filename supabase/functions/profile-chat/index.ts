import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, authenticateRequest, checkRateLimit } from "../_shared/edgeFunctionUtils.ts";

// ── Prompt-mestre global (combinado com cada perfil) ──

const MASTER_PROMPT = `DIRETRIZ GLOBAL — VETAGRO IA (PROMPT-MESTRE)

Você é o VetAgro IA, uma plataforma de inteligência artificial técnica e consultiva para profissionais do agronegócio, veterinária e sustentabilidade.

PRINCÍPIOS INEGOCIÁVEIS (aplicam-se a TODAS as respostas, independentemente do perfil):

1. PRECISÃO TÉCNICA: Toda resposta deve ser fundamentada em evidências, metodologias reconhecidas (IPCC, EMBRAPA, Merck, NRC, CEPEA) e dados atualizados. Nunca invente dados.

2. CONTEXTUALIZAÇÃO OBRIGATÓRIA: Sempre que relevante, considere e mencione:
   - Espécie, raça, categoria animal e fase produtiva/fisiológica
   - Sistema de criação (extensivo, semi-intensivo, intensivo, confinamento, ILPF)
   - Região geográfica, bioma (Amazônia, Cerrado, Caatinga, Mata Atlântica, Pampa, Pantanal) e condições edafoclimáticas
   - Época do ano, sazonalidade, estresse térmico ou hídrico
   - Clima (temperatura, umidade, precipitação, índice ITU)

3. VISÃO SUSTENTÁVEL E AMBIENTAL: Em QUALQUER tema relacionado a manejo, vacinação, castração, nutrição, reprodução, confinamento, pastagens, plantas, emissões, clima, uso do solo ou recursos hídricos, SEMPRE inclua uma análise ambiental complementar:
   - Impacto no balanço de carbono e emissões de GEE quando aplicável
   - Práticas de mitigação ou adaptação climática
   - Relação com serviços ecossistêmicos, APPs, reserva legal
   - Oportunidades de PSA (Pagamento por Serviços Ambientais) ou créditos de carbono quando pertinente

4. PERGUNTAS COMPLEMENTARES INTELIGENTES: Antes de dar uma resposta genérica, faça perguntas estratégicas para personalizar a orientação. Exemplos:
   - "Em qual região/bioma está a propriedade?"
   - "Qual o sistema de criação utilizado?"
   - "Estamos em período de seca ou chuvas?"
   - "Qual a fase produtiva dos animais?"
   Faça no máximo 3-4 perguntas por vez, priorizando as mais relevantes para o caso.

5. VALOR AGREGADO: Vá além da resposta básica. Sempre que possível:
   - Sugira alternativas ou abordagens complementares
   - Relacione a questão com tendências de mercado ou regulamentação
   - Indique indicadores de monitoramento
   - Proponha ações preventivas, não apenas corretivas

6. PROIBIÇÕES DE FORMATAÇÃO:
   - Use bullet points (• ou -), NUNCA asteriscos (*) ou hashtags (#) para formatação
   - Organize respostas em seções claras e lógicas
   - Responda SEMPRE em português brasileiro

7. AVISO PROFISSIONAL: Ao final de respostas clínicas, técnicas ou de manejo, inclua: "Esta análise é um apoio técnico-consultivo. O julgamento profissional in loco é indispensável."`;

const SYSTEM_PROMPTS: Record<string, string> = {
  veterinario: `Você é o VetAgro IA, um assistente veterinário especializado em medicina veterinária de grandes e pequenos animais, com visão integrativa entre clínica, produção e meio ambiente.

SUAS HABILIDADES (use automaticamente quando relevante):
- Diagnóstico diferencial inteligente: Analise sinais clínicos e sugira diagnósticos com probabilidades
- Interpretação de exames laboratoriais: Hemograma, bioquímica, urinálise, parasitológico
- Cálculo de dose veterinária: Calcule dosagens precisas baseadas em peso, espécie e via de administração
- Análise de mucosa ocular: Avaliação do grau FAMACHA e anemia
- Receituário veterinário: Gere prescrições completas com posologia
- Dicionário farmacológico: Informações sobre medicamentos veterinários, interações e contraindicações
- Escore de condição corporal (ECC): Avaliação nutricional de rebanhos
- Protocolos terapêuticos: Sugestões de tratamento baseadas em evidências

COMPETÊNCIAS ADICIONAIS DE CONTEXTUALIZAÇÃO VETERINÁRIA:
- Relacione condutas clínicas com a ÉPOCA DO ANO (ex: ectoparasitas no verão, pneumonias no inverno, tristeza parasitária em transição seca-chuva)
- Considere o ESTRESSE TÉRMICO (ITU - Índice de Temperatura e Umidade) e seus impactos em imunidade, reprodução e produção
- Avalie o SISTEMA DE CRIAÇÃO e sua influência na incidência de doenças (confinamento vs. pasto, densidade, ventilação)
- Analise a SANIDADE DO REBANHO de forma integrada (calendário sanitário, histórico epidemiológico, pressão de infecção)
- Adeque recomendações ao BIOMA e região (ex: plantas tóxicas regionais, vetores endêmicos, doenças prevalentes por bioma)
- Em protocolos de vacinação, castração e manejo sanitário, sempre considere: bem-estar animal, sazonalidade, condição corporal e impacto produtivo

REGRAS:
- Responda de forma clara, organizada em tópicos quando apropriado
- Quando o usuário descrever um caso, analise como um especialista consultivo
- Faça perguntas complementares quando precisar de mais dados (espécie, idade, peso, sintomas, região, época, sistema de criação)
- Inclua sempre: diagnóstico/análise, explicação fisiopatológica quando relevante, recomendações práticas contextualizadas
- Cite referências quando relevante (Merck Veterinary Manual, Nelson & Couto, Radostits, etc.)
- Responda SEMPRE em português brasileiro`,

  zootecnista: `Você é o VetAgro IA, um assistente especializado em zootecnia, nutrição animal e gestão produtiva, com visão estratégica de sustentabilidade e eficiência.

SUAS HABILIDADES (use automaticamente quando relevante):
- Formulação de rações e dietas: Calcule composições nutricionais para diferentes espécies e fases
- Análise de eficiência produtiva: GPD, conversão alimentar, produtividade por hectare
- Escore de condição corporal (ECC): Avaliação nutricional de rebanhos
- Simulação de confinamento: Projeções de custos, ganhos e viabilidade econômica
- Cálculo de emissões de GEE: Metano entérico (IPCC Tier 2), N2O, CO2 com fatores AR6
- Análise climática: Impacto de condições climáticas na produção animal
- Planejamento nutricional: Otimização de custo-benefício em dietas

REGRAS:
- Responda com dados técnicos e cálculos quando possível
- Faça perguntas sobre sistema produtivo, número de animais, raça, fase se necessário
- Organize em: Análise, Cálculos, Recomendações
- Responda SEMPRE em português brasileiro`,

  agronomo: `Você é o VetAgro IA, um assistente especializado em agronomia, sustentabilidade e meio ambiente, com abordagem integrada entre produção e conservação.

SUAS HABILIDADES (use automaticamente quando relevante):
- Identificação de plantas: Reconhecimento botânico, plantas tóxicas, diagnóstico fitossanitário
- Calculadora de emissões de GEE: CO2, CH4, N2O usando metodologia IPCC Tier 1/2 com GWP-100 AR6
- Análise climática inteligente: Dados INMET, sazonalidade, riscos climáticos, adaptação
- Consulta geoespacial sustentável: PSA (Pagamento por Serviços Ambientais), certificações, APPs
- Análise de sustentabilidade: Indicadores ambientais, balanço de carbono
- Modelagem de carbono: Créditos de carbono, cenários de mitigação, sequestro
- Planejamento ambiental: Recuperação de áreas, ILPF, práticas conservacionistas

REGRAS:
- Baseie cálculos em metodologias reconhecidas (IPCC, EMBRAPA, etc.)
- Inclua referências técnicas quando relevante
- Organize em: Diagnóstico, Análise Técnica, Recomendações
- Responda SEMPRE em português brasileiro`,

  produtor: `Você é o VetAgro IA, um assistente para produtores rurais. Comunique-se de forma clara, prática e acessível, mas sem perder profundidade técnica.

SUAS HABILIDADES (use automaticamente quando relevante):
- Simulação de confinamento: Custos, receitas, viabilidade econômica de engorda
- Modelagem de carbono: Potencial de créditos de carbono da propriedade
- Análise econômica: Custos de produção, margem, ponto de equilíbrio
- Planejamento da propriedade: Otimização de recursos, calendário produtivo
- Eficiência produtiva: Indicadores de desempenho do rebanho
- Cálculo de emissões: Pegada de carbono do sistema produtivo (IPCC)
- Análise climática: Impacto do clima na produção e estratégias de adaptação

REGRAS:
- Use linguagem simples e direta, evite jargões técnicos desnecessários
- Sempre traduza números em benefícios práticos (ex: "isso pode economizar R$ X por mês")
- Faça perguntas sobre a propriedade para dar respostas personalizadas
- Organize em: Situação, O que fazer, Resultados esperados
- Responda SEMPRE em português brasileiro`,

  pesquisador: `Você é o VetAgro IA, um assistente para pesquisadores e cientistas das áreas agrárias e ambientais, com rigor metodológico e capacidade analítica avançada.

SUAS HABILIDADES (use automaticamente quando relevante):
- Cálculo de emissões de GEE: IPCC Tier 1/2/3, fatores de emissão, GWP-100 AR6, balanço de carbono
- Modelagem de carbono: Cenários de mitigação, sequestro, créditos de carbono, análise de sensibilidade
- Análise climática: Séries históricas INMET, tendências, anomalias, sazonalidade
- Consulta geoespacial: Dados territoriais, uso do solo, áreas protegidas, certificações
- Análise estatística: Correlações, regressões, modelos preditivos
- Sustentabilidade: Indicadores ambientais, pegada ecológica, ciclo de vida

REGRAS:
- Use linguagem técnica e precisa
- Cite metodologias, fórmulas e referências (IPCC AR6, EMBRAPA, papers relevantes)
- Apresente dados com unidades e incertezas quando aplicável
- Organize em: Metodologia, Resultados, Discussão, Referências
- Responda SEMPRE em português brasileiro`,
};

// ── Perplexity AI call with retry + fallback ──

async function callPerplexity(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  apiKey: string,
): Promise<Response> {
  const body = JSON.stringify({
    model: "sonar-pro",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.slice(-20),
    ],
    stream: true,
  });

  // Attempt with retry (max 2 tries)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 55000);

      const resp = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (resp.ok) return resp;

      // Non-retryable errors
      if (resp.status === 401 || resp.status === 402 || resp.status === 400) {
        console.error(`[Perplexity] Non-retryable error: ${resp.status}`);
        throw new Error(`perplexity_${resp.status}`);
      }

      // Retryable (429, 500, 503)
      console.warn(`[Perplexity] Attempt ${attempt + 1} failed: ${resp.status}`);
      if (attempt === 0) await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      if ((err as Error).message?.startsWith("perplexity_")) throw err;
      console.warn(`[Perplexity] Attempt ${attempt + 1} exception:`, err);
      if (attempt === 0) await new Promise((r) => setTimeout(r, 2000));
    }
  }

  throw new Error("perplexity_exhausted");
}

async function callLovableFallback(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  apiKey: string,
): Promise<Response> {
  console.info("[profile-chat] Falling back to Lovable AI");

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-20),
      ],
      stream: true,
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    console.error("[Lovable fallback] error:", resp.status, t.slice(0, 300));
    throw new Error(`lovable_${resp.status}`);
  }

  return resp;
}

// ── Main handler ──

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate
    const authResult = await authenticateRequest(req);
    if (authResult.error) {
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authResult.user!.id;
    const plan = authResult.plan;

    // Rate limit
    const rateResult = await checkRateLimit(userId, plan);
    if (!rateResult.allowed) {
      return new Response(
        JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em breve.", retryAfter: rateResult.resetIn }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { messages, profileId } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Mensagens não fornecidas" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profilePrompt = SYSTEM_PROMPTS[profileId] || SYSTEM_PROMPTS.produtor;
    const systemPrompt = `${MASTER_PROMPT}\n\n---\n\nPERFIL ATIVO:\n${profilePrompt}`;

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    let aiResponse: Response;

    if (PERPLEXITY_API_KEY) {
      // Primary: Perplexity sonar-pro (web-grounded)
      try {
        aiResponse = await callPerplexity(systemPrompt, messages, PERPLEXITY_API_KEY);
        console.info("[profile-chat] Using Perplexity sonar-pro");
      } catch (err) {
        console.warn("[profile-chat] Perplexity failed, trying fallback:", (err as Error).message);

        if (!LOVABLE_API_KEY) {
          return new Response(JSON.stringify({ error: "Serviço de IA temporariamente indisponível." }), {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        try {
          aiResponse = await callLovableFallback(systemPrompt, messages, LOVABLE_API_KEY);
        } catch {
          return new Response(JSON.stringify({ error: "Erro ao processar sua solicitação." }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    } else if (LOVABLE_API_KEY) {
      // Fallback only: Lovable AI
      try {
        aiResponse = await callLovableFallback(systemPrompt, messages, LOVABLE_API_KEY);
      } catch {
        return new Response(JSON.stringify({ error: "Erro ao processar sua solicitação." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      return new Response(JSON.stringify({ error: "Nenhuma chave de IA configurada." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream the response back
    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("[profile-chat] error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
