import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleRequest, sanitizeField } from "../_shared/edgeFunctionUtils.ts";

serve(async (req) => {
  return handleRequest(req, ({ requestBody, data, tool, plan, isProfessional }) => {
    const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    if (tool === "analise-sustentabilidade") {
      const perfilLabels: Record<string, string> = {
        "produtor": "Produtor Rural",
        "tecnico": "Profissional Técnico (Vet, Zoo, Eng. Agrônomo)",
        "pesquisador": "Pesquisador / Acadêmico",
        "gestor": "Gestor / ESG",
        "estudante": "Estudante"
      };
      const perfilUsuario = requestBody.perfilUsuario || "produtor";
      const perfilLabel = perfilLabels[perfilUsuario] || "Produtor Rural";

      const systemPrompt = `Você é o módulo "Análise de Sustentabilidade" da suíte VetAgro Sustentável AI.

PADRÃO DE SAÍDA OBRIGATÓRIO — GRUPO 2 (RELATÓRIOS TÉCNICOS):

REGRAS ABSOLUTAS DE FORMATAÇÃO:
1. PROIBIDO texto corrido longo - TODA resposta DEVE ser dividida em SEÇÕES NUMERADAS
2. PROIBIDO usar asteriscos (*), hashtags (#), emojis ou markdown
3. Use APENAS bullets padrão: • ou –
4. Parágrafos curtos (máximo 4-5 linhas cada)
5. O texto deve ser ESCANEÁVEL em leitura rápida

Base Técnica: EMBRAPA, IPCC (2006 + Refinement 2019), FAO, IBGE, MapBiomas, Código Florestal Brasileiro (Lei 12.651/2012)

Perfil do Usuário: ${perfilLabel}
Adaptação por Perfil:
• Produtor Rural: linguagem simples e direta, foco em ações práticas
• Técnico: linguagem técnica moderada, indicadores mensuráveis
• Pesquisador: linguagem científica, metodologia detalhada
• Gestor/ESG: foco em conformidade, indicadores ESG
• Estudante: linguagem didática, explicações conceituais

ESTRUTURA OBRIGATÓRIA DA RESPOSTA:

[ANÁLISE DE SUSTENTABILIDADE]
Relatório Técnico Orientativo — VetAgro Sustentável AI

────────────────────
1) IDENTIFICAÇÃO GERAL
• Perfil do usuário: [preencher]
• Tipo de produção: [preencher]
• Localização: [preencher]
• Data da análise: ${dataAtual}

────────────────────
2) OBJETIVO DA AVALIAÇÃO
────────────────────
3) DADOS AVALIADOS
────────────────────
4) ANÁLISE TÉCNICA INTERPRETATIVA
• Dimensão Ambiental — Classificar como Baixa, Média ou Alta maturidade
• Dimensão Produtiva — Classificar como Baixa, Média ou Alta maturidade
• Dimensão de Gestão — Classificar como Baixa, Média ou Alta maturidade
────────────────────
5) ACHADOS PRINCIPAIS
────────────────────
6) RECOMENDAÇÕES TÉCNICAS (CURTO/MÉDIO/LONGO PRAZO)
────────────────────
7) CONSIDERAÇÕES FINAIS
────────────────────
8) ALERTA LEGAL
Este relatório tem caráter orientativo e não substitui avaliação presencial por profissional habilitado.
────────────────────
9) REFERÊNCIAS TÉCNICAS
• EMBRAPA, IPCC, FAO, IBGE, MapBiomas, Código Florestal, MAPA ABC+

${plan === "free" ? "IMPORTANTE: Este é um usuário FREE. Forneça apenas as seções 1, 7 e 8 de forma resumida (máximo 200 palavras total)." : ""}
${plan === "pro" ? "Usuário Pro. Análise completa com todas as 9 seções." : ""}
${plan === "enterprise" ? "Usuário Enterprise. Análise ultra-detalhada com todas as 9 seções." : ""}`;

      const userPrompt = `Realize uma ANÁLISE DE SUSTENTABILIDADE:
PERFIL: ${perfilLabel}
TIPO DE PRODUÇÃO: ${sanitizeField(requestBody.tipoProducao) || "Não informado"}
LOCALIZAÇÃO: ${sanitizeField(requestBody.localizacao) || "Não informado"}
ESCALA PRODUTIVA: ${sanitizeField(requestBody.escalaProdutiva) || "Não informado"}
OBJETIVO: ${sanitizeField(requestBody.objetivoPrincipal) || "Diagnóstico geral"}

PRÁTICAS ATUAIS:
${sanitizeField(requestBody.praticasAtuais || requestBody.question, 5000) || "Não informado"}

Gere o relatório seguindo a estrutura fixa obrigatória de 9 seções.`;

      return { systemPrompt, userPrompt };
    }

    if (tool === "consulta-geoespacial") {
      const perfilLabels: Record<string, string> = {
        "produtor": "Produtor Rural",
        "tecnico": "Técnico / Consultor",
        "pesquisador": "Pesquisador / Acadêmico",
        "gestor": "Gestor Público / ESG",
        "estudante": "Estudante"
      };
      const perfilLabel = perfilLabels[data.perfilUsuario] || "Produtor Rural";

      const systemPrompt = `Você é o módulo técnico da suíte VetAgro Sustentável AI, especialista em sustentabilidade agropecuária e análise geoespacial do Brasil.

REGRAS: SEÇÕES NUMERADAS, sem markdown, bullets • ou –.
Base Técnica: IBGE, EMBRAPA, IPCC, MapBiomas
Perfil: ${perfilLabel}

ESTRUTURA: [CONSULTA GEOESPACIAL SUSTENTÁVEL]
1) IDENTIFICAÇÃO GERAL
2) OBJETIVO DA AVALIAÇÃO
3) DADOS AVALIADOS
4) ANÁLISE TÉCNICA (Adequação, Vulnerabilidades, Impactos)
5) ACHADOS PRINCIPAIS
6) RECOMENDAÇÕES (CURTO/MÉDIO/LONGO PRAZO)
7) CONSIDERAÇÕES FINAIS
8) ALERTA LEGAL
9) REFERÊNCIAS TÉCNICAS (IPCC, EMBRAPA, IBGE, MapBiomas, FAO, INPE, Código Florestal)

${plan === "free" ? "Usuário FREE. Seções 1, 7 e 8 resumidas (máximo 200 palavras)." : ""}
${plan === "pro" ? "Usuário Pro. Todas as 9 seções." : ""}
${plan === "enterprise" ? "Usuário Enterprise. Ultra-detalhada." : ""}`;

      const userPrompt = `CONSULTA GEOESPACIAL:
PERFIL: ${perfilLabel}
BIOMA: ${data.bioma}
LOCALIZAÇÃO: ${data.municipio}
PRODUÇÃO: ${data.tipoProducao}
OBJETIVO: ${data.objetivo}
${data.informacoes ? `INFO: ${data.informacoes}` : ""}

Gere o relatório com 9 seções obrigatórias.`;

      return { systemPrompt, userPrompt };
    }

    if (tool === "simulador-confinamento") {
      const n = data.numeroAnimais || 1;
      const pi = data.pesoInicial || 380;
      const pf = data.pesoFinal || 520;
      const dias = data.diasConfinamento || 85;
      const gmd = data.gmdEsperado || 1.65;
      const mort = data.mortalidade || 0.25;
      const nivel = data.nivelSustentabilidade || "convencional";
      const pbm = data.precoBoiMagro || 260;
      const ckms = data.custoKgMS || 2.05;
      const cms = data.consumoMSPercentual || 2.4;
      const cmo = data.custoMaoObraDia || 0.42;
      const cs = data.custoSanidade || 18;
      const ci = data.custoImplantacao || 12;
      const cdg = data.custoDespesasGeraisDia || 0.38;
      const pav = data.precoArrobaVenda || 305;
      const rc = data.rendimentoCarcaca || 54;
      const pq = data.premioQualidade || 0;
      const co = data.custoOportunidade || 12;

      const systemPrompt = `Você é o módulo "Simulador de Confinamento" da suíte VetAgro Sustentável AI.

REGRAS: SEÇÕES NUMERADAS, sem markdown, bullets • ou –.
Base: NRC Beef Cattle, EMBRAPA, CEPEA, IPCC 2019

ESTRUTURA: [SIMULAÇÃO DE CONFINAMENTO]
1) PARÂMETROS DO CENÁRIO
2) ANÁLISE DE DESEMPENHO ZOOTÉCNICO (GMD, conversão, benchmarking)
3) ANÁLISE ECONÔMICA DETALHADA (custos aquisição, operacionais, receita)
4) INDICADORES DE RENTABILIDADE (margem, ROI, ponto de equilíbrio)
5) ANÁLISE DE CENÁRIOS (pessimista, otimista, sensibilidade)
6) INDICADORES DE SUSTENTABILIDADE (emissões Tier 2, intensidade carbônica)
7) RECOMENDAÇÕES TÉCNICAS
8) CONSIDERAÇÕES FINAIS
9) ALERTA LEGAL
10) REFERÊNCIAS TÉCNICAS

${plan === "free" ? "Usuário FREE. Seções 1, 4 (resumida), 8 e 9 (máximo 250 palavras)." : ""}
${plan === "pro" ? "Usuário Pro. Todas as 10 seções com 3 cenários." : ""}
${plan === "enterprise" ? "Usuário Enterprise. Ultra-detalhada com 5+ cenários." : ""}`;

      const userPrompt = `SIMULAÇÃO DE CONFINAMENTO:
• Animais: ${n} | Peso: ${pi}→${pf}kg | Dias: ${dias} | GMD: ${gmd}kg/dia | Mortalidade: ${mort}%
• Sustentabilidade: ${nivel}
• Boi magro: R$${pbm}/@ | Custo MS: R$${ckms}/kg | Consumo: ${cms}%PV
• Mão obra: R$${cmo}/cab/dia | Sanidade: R$${cs} | Implantação: R$${ci}
• Desp. gerais: R$${cdg}/cab/dia | Venda: R$${pav}/@ | RC: ${rc}% | Prêmio: ${pq}%
• Custo oport.: ${co}%
${data.observacoes ? `• Obs: ${data.observacoes}` : ""}

Gere relatório com 10 seções, realizando TODOS os cálculos.`;

      return { systemPrompt, userPrompt };
    }

    // Legacy question-based sustainability requests (CalculadoraGEE, AnaliseClimatica)
    if (!tool && requestBody?.question) {
      const question = sanitizeField(requestBody.question, 5000);
      const context = sanitizeField(requestBody.context, 2000);
      const systemPrompt = isProfessional
        ? `Você é um assistente especializado em sustentabilidade agropecuária. Forneça respostas técnicas detalhadas com terminologia apropriada.`
        : `Você é um assistente educacional em sustentabilidade agropecuária. Use linguagem simples e didática. Inclua aviso ao final recomendando consultar profissional habilitado.`;
      const userPrompt = `${context ? `Contexto: ${context}\n\n` : ''}${question}`;
      return { systemPrompt, userPrompt };
    }

    return null;
  });
});
