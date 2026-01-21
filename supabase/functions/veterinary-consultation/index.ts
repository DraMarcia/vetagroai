import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// ===== RATE LIMITING CONFIGURATION =====
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limit store (resets on function cold start)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit settings per plan tier
const RATE_LIMITS = {
  free: { maxRequests: 10, windowMs: 60 * 60 * 1000 },      // 10 requests per hour
  pro: { maxRequests: 100, windowMs: 60 * 60 * 1000 },      // 100 requests per hour  
  enterprise: { maxRequests: 1000, windowMs: 60 * 60 * 1000 }, // 1000 requests per hour
  default: { maxRequests: 5, windowMs: 60 * 60 * 1000 }     // 5 requests per hour for unauthenticated
};

// Clean up expired entries periodically
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Check and update rate limit for a given identifier (now uses user_id, not IP)
function checkRateLimit(identifier: string, plan: string = 'default'): { allowed: boolean; remaining: number; resetIn: number } {
  cleanupExpiredEntries();
  
  const limits = RATE_LIMITS[plan as keyof typeof RATE_LIMITS] || RATE_LIMITS.default;
  const now = Date.now();
  const key = `${plan}:${identifier}`;
  
  let entry = rateLimitStore.get(key);
  
  // Create new entry if doesn't exist or has expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + limits.windowMs
    };
    rateLimitStore.set(key, entry);
    return { 
      allowed: true, 
      remaining: limits.maxRequests - 1,
      resetIn: Math.ceil(limits.windowMs / 1000)
    };
  }
  
  // Check if limit exceeded
  if (entry.count >= limits.maxRequests) {
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);
    return { 
      allowed: false, 
      remaining: 0,
      resetIn
    };
  }
  
  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return { 
    allowed: true, 
    remaining: limits.maxRequests - entry.count,
    resetIn: Math.ceil((entry.resetTime - now) / 1000)
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
    return { user: null, plan: 'default', isAdmin: false, error: 'Authentication required' };
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  
  if (authError || !user) {
    return { user: null, plan: 'default', isAdmin: false, error: 'Invalid or expired token' };
  }

  // Retrieve actual plan from profiles table
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('current_plan')
    .eq('user_id', user.id)
    .single();

  // Check admin role from user_roles table
  const { data: adminRole } = await supabaseClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();

  const actualPlan = profile?.current_plan || 'free';
  const isAdmin = !!adminRole;

  return { user, plan: actualPlan, isAdmin, error: null };
}
// ===== END AUTHENTICATION HELPER =====

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user and get actual plan from database
    const authResult = await authenticateRequest(req);
    
    if (authResult.error) {
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authResult.user!.id;
    const plan = authResult.plan; // Server-validated plan, not from request body
    
    const requestBody = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    // Check rate limit using user ID and server-validated plan
    const rateLimitResult = checkRateLimit(userId, plan);
    
    if (!rateLimitResult.allowed) {
      console.log('Rate limit exceeded for request');
      return new Response(
        JSON.stringify({ 
          error: 'Limite de requisições excedido. Tente novamente mais tarde.',
          retryAfter: rateLimitResult.resetIn
        }), 
        {
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitResult.resetIn),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitResult.resetIn)
          },
        }
      );
    }

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurado');
    }

    let systemPrompt = "";
    let userPrompt = "";

    // Check if it's a tool-based request (new format)
    if (requestBody?.tool) {
      const tool = requestBody.tool;
      // Defensive normalization:
      // - some frontends send { tool, data: {...} }
      // - others send { tool, question, ... } (no "data")
      // Always guarantee an object for downstream handlers.
      const data = (requestBody.data && typeof requestBody.data === 'object') ? requestBody.data : requestBody;

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
        
        const dataAtual = new Date().toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        });

        systemPrompt = `Você é o módulo "Análise de Sustentabilidade" da suíte VetAgro Sustentável AI.

PADRÃO DE SAÍDA OBRIGATÓRIO — GRUPO 2 (RELATÓRIOS TÉCNICOS):

REGRAS ABSOLUTAS DE FORMATAÇÃO:
1. PROIBIDO texto corrido longo - TODA resposta DEVE ser dividida em SEÇÕES NUMERADAS
2. PROIBIDO usar asteriscos (*), hashtags (#), emojis ou markdown
3. Use APENAS bullets padrão: • ou –
4. Parágrafos curtos (máximo 4-5 linhas cada)
5. O texto deve ser ESCANEÁVEL em leitura rápida
6. Espaçamento visual consistente entre blocos
7. Cada seção deve ser VISUALMENTE RECONHECÍVEL
8. O botão "Copiar Resposta" deve preservar integralmente a estrutura

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
• Escala produtiva: [preencher]
• Data da análise: ${dataAtual}

(Nunca usar parágrafo aqui)

────────────────────
2) OBJETIVO DA AVALIAÇÃO

• Propósito da análise de sustentabilidade
• 1 parágrafo curto e direto
• Linguagem técnica, sem introduções genéricas

────────────────────
3) DADOS AVALIADOS

Sempre em lista estruturada:
• Práticas de manejo
• Gestão de recursos
• Conformidade ambiental
• Indicadores produtivos

────────────────────
4) ANÁLISE TÉCNICA INTERPRETATIVA

• Dimensão Ambiental — Classificar como Baixa, Média ou Alta maturidade
• Dimensão Produtiva — Classificar como Baixa, Média ou Alta maturidade
• Dimensão de Gestão — Classificar como Baixa, Média ou Alta maturidade

Blocos curtos, máximo 4-5 linhas cada, foco interpretativo

────────────────────
5) ACHADOS PRINCIPAIS

Formato obrigatório:
• Achado 1 — interpretação objetiva
• Achado 2 — interpretação objetiva
• Achado 3 — interpretação objetiva

Separar pontos fortes e gargalos/riscos

────────────────────
6) RECOMENDAÇÕES TÉCNICAS

Separar por prazo:

CURTO PRAZO (baixo custo):
• Recomendação — benefício

MÉDIO PRAZO:
• Recomendação — benefício

LONGO PRAZO (estruturantes):
• Recomendação — benefício

────────────────────
7) CONSIDERAÇÕES FINAIS

• Síntese técnica objetiva
• Oportunidades estratégicas (certificações, PSA, crédito de carbono, ESG)
• Linguagem conclusiva, sem abrir novas hipóteses

────────────────────
8) ALERTA LEGAL

Este relatório tem caráter orientativo e não substitui avaliação presencial por médico veterinário, zootecnista ou engenheiro agrônomo habilitado (CRMV, CREA).

────────────────────
9) REFERÊNCIAS TÉCNICAS

Sempre em lista com formato completo:
• EMBRAPA — Empresa Brasileira de Pesquisa Agropecuária. Indicadores de Sustentabilidade na Agropecuária. Disponível em: embrapa.br
• IPCC — Intergovernmental Panel on Climate Change. Guidelines for National Greenhouse Gas Inventories (2006) + Refinement (2019). Disponível em: ipcc.ch
• FAO — Food and Agriculture Organization. Global Framework for Sustainable Agriculture. Disponível em: fao.org
• IBGE — Instituto Brasileiro de Geografia e Estatística. Indicadores de Desenvolvimento Sustentável. Disponível em: ibge.gov.br
• MapBiomas — Mapeamento Anual de Uso e Cobertura da Terra no Brasil. Plataforma MapBiomas Brasil. Disponível em: mapbiomas.org
• Código Florestal Brasileiro — Lei 12.651/2012. Proteção da Vegetação Nativa. Disponível em: planalto.gov.br
• MAPA — Ministério da Agricultura, Pecuária e Abastecimento. Plano ABC+ (2020-2030). Disponível em: gov.br/agricultura

${plan === "free" ? "IMPORTANTE: Este é um usuário FREE. Forneça apenas as seções 1, 7 e 8 de forma resumida (máximo 200 palavras total). Indique que análises detalhadas estão disponíveis nos planos Pro/Enterprise." : ""}
${plan === "pro" ? "Este é um usuário Pro. Forneça análise completa com todas as 9 seções detalhadas." : ""}
${plan === "enterprise" ? "Este é um usuário Enterprise. Forneça análise ultra-detalhada com todas as 9 seções, incluindo recomendações estratégicas e projeções de longo prazo." : ""}`;

        userPrompt = `Realize uma ANÁLISE DE SUSTENTABILIDADE com os seguintes dados:

PERFIL DO USUÁRIO: ${perfilLabel}
TIPO DE PRODUÇÃO: ${requestBody.tipoProducao || "Não informado"}
LOCALIZAÇÃO: ${requestBody.localizacao || "Não informado"}
ESCALA PRODUTIVA: ${requestBody.escalaProdutiva || "Não informado"}
OBJETIVO PRINCIPAL: ${requestBody.objetivoPrincipal || "Diagnóstico geral de sustentabilidade"}

PRÁTICAS ATUAIS E CONTEXTO:
${requestBody.praticasAtuais || requestBody.question || "Não informado"}

Gere o relatório técnico completo seguindo a estrutura fixa obrigatória de 9 seções, adaptando a profundidade técnica e linguagem ao perfil do usuário.`;
      }
      else if (tool === "consulta-geoespacial") {
        const perfilLabels: Record<string, string> = {
          "produtor": "Produtor Rural",
          "tecnico": "Técnico / Consultor (Vet, Zoo, Eng. Agrônomo)",
          "pesquisador": "Pesquisador / Acadêmico",
          "gestor": "Gestor Público / ESG",
          "estudante": "Estudante"
        };
        const perfilUsuario = data.perfilUsuario || "produtor";
        const perfilLabel = perfilLabels[perfilUsuario] || "Produtor Rural";
        
        const dataAtual = new Date().toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        });

        systemPrompt = `Você é o módulo técnico da suíte VetAgro Sustentável AI, especialista em sustentabilidade agropecuária e análise geoespacial do Brasil.

PADRÃO DE SAÍDA OBRIGATÓRIO — GRUPO 2 (RELATÓRIOS TÉCNICOS):

REGRAS ABSOLUTAS DE FORMATAÇÃO:
1. PROIBIDO texto corrido longo - TODA resposta DEVE ser dividida em SEÇÕES NUMERADAS
2. PROIBIDO usar asteriscos (*), hashtags (#), emojis ou markdown
3. Use APENAS bullets padrão: • ou –
4. Parágrafos curtos (máximo 4-5 linhas cada)
5. O texto deve ser ESCANEÁVEL em leitura rápida
6. Cada seção deve ser VISUALMENTE RECONHECÍVEL

Base Técnica: IBGE, EMBRAPA, IPCC, MapBiomas, Literatura técnico-científica brasileira

Perfil do Usuário: ${perfilLabel}
Adaptação por Perfil:
• Produtor Rural: linguagem acessível, foco em ações práticas
• Técnico/Consultor: linguagem técnica, detalhamento de metodologias
• Pesquisador: rigor científico, citações detalhadas
• Gestor/ESG: foco em políticas, compliance, indicadores ESG
• Estudante: didático, explicativo

ESTRUTURA OBRIGATÓRIA DA RESPOSTA:

[CONSULTA GEOESPACIAL SUSTENTÁVEL]

Relatório Técnico Orientativo — VetAgro Sustentável AI

────────────────────
1) IDENTIFICAÇÃO GERAL

• Perfil do usuário: [preencher]
• Bioma: [preencher]
• Município / Estado: [preencher]
• Tipo de produção: [preencher]
• Data da análise: ${dataAtual}

────────────────────
2) OBJETIVO DA AVALIAÇÃO

• Propósito da consulta geoespacial
• 1 parágrafo curto e direto

────────────────────
3) DADOS AVALIADOS

• Características do bioma
• Condições climáticas predominantes
• Limitações ambientais relevantes
• Riscos associados ao uso atual do solo

────────────────────
4) ANÁLISE TÉCNICA INTERPRETATIVA

ADEQUAÇÃO DO SISTEMA:
• Compatibilidade do sistema produtivo ao bioma

VULNERABILIDADES:
• Principais riscos ambientais identificados

IMPACTOS POTENCIAIS:
• Sobre solo, água e biodiversidade

────────────────────
5) ACHADOS PRINCIPAIS

• Achado 1 — interpretação objetiva
• Achado 2 — interpretação objetiva
• Achado 3 — interpretação objetiva

────────────────────
6) RECOMENDAÇÕES TÉCNICAS

CURTO PRAZO (baixo custo):
• Recomendação — benefício ambiental/produtivo/econômico

MÉDIO PRAZO:
• Recomendação — benefício

LONGO PRAZO (estruturantes):
• Recomendação — benefício

────────────────────
7) CONSIDERAÇÕES FINAIS

• Síntese executiva
• Oportunidades estratégicas (ILPF, PSA, crédito de carbono, ESG)
• Linguagem conclusiva

────────────────────
8) ALERTA LEGAL

Este relatório tem caráter orientativo e não substitui avaliação presencial por profissional habilitado (CRMV, CREA).

────────────────────
9) REFERÊNCIAS TÉCNICAS

• IPCC — Intergovernmental Panel on Climate Change. Guidelines for National Greenhouse Gas Inventories (2006) + Refinement (2019). Disponível em: ipcc.ch
• EMBRAPA — Empresa Brasileira de Pesquisa Agropecuária. Zoneamento Agroecológico e Sistemas de Produção Sustentável. Disponível em: embrapa.br
• IBGE — Instituto Brasileiro de Geografia e Estatística. Dados Geoespaciais e Indicadores Territoriais. Disponível em: ibge.gov.br
• MapBiomas — Mapeamento Anual de Uso e Cobertura da Terra no Brasil. Plataforma MapBiomas Brasil. Disponível em: mapbiomas.org
• FAO — Food and Agriculture Organization. Guidelines for Land-Use Planning and Sustainable Agriculture. Disponível em: fao.org
• INPE — Instituto Nacional de Pesquisas Espaciais. Monitoramento de Biomas e Alertas de Desmatamento. Disponível em: inpe.br
• Código Florestal Brasileiro — Lei 12.651/2012. Proteção da Vegetação Nativa. Disponível em: planalto.gov.br

${plan === "free" ? "IMPORTANTE: Este é um usuário FREE. Forneça apenas as seções 1, 7 e 8 de forma resumida (máximo 200 palavras total)." : ""}
${plan === "pro" ? "Este é um usuário Pro. Forneça análise completa com todas as 9 seções detalhadas." : ""}
${plan === "enterprise" ? "Este é um usuário Enterprise. Forneça análise ultra-detalhada com todas as 9 seções." : ""}`;

        userPrompt = `Realize uma CONSULTA GEOESPACIAL SUSTENTÁVEL com os seguintes dados:

PERFIL DO USUÁRIO: ${perfilLabel}
BIOMA: ${data.bioma}
LOCALIZAÇÃO: ${data.municipio}
TIPO DE PRODUÇÃO: ${data.tipoProducao}
OBJETIVO DA CONSULTA: ${data.objetivo}
${data.informacoes ? `INFORMAÇÕES ADICIONAIS: ${data.informacoes}` : ""}

Gere o relatório técnico seguindo RIGOROSAMENTE a estrutura de 9 seções obrigatórias.`;
      }
      else if (tool === "simulador-confinamento") {
        // Parâmetros básicos
        const numeroAnimais = data.numeroAnimais || 1;
        const pesoInicial = data.pesoInicial || 380;
        const pesoFinal = data.pesoFinal || 520;
        const diasConfinamento = data.diasConfinamento || 85;
        const gmdEsperado = data.gmdEsperado || 1.65;
        const mortalidade = data.mortalidade || 0.25;
        const nivelSustentabilidade = data.nivelSustentabilidade || "convencional";
        
        // Parâmetros econômicos avançados (com defaults realistas)
        const precoBoiMagro = data.precoBoiMagro || 260.00;
        const pesoBoiMagroArrobas = data.pesoBoiMagroArrobas || (pesoInicial / 30);
        const custoKgMS = data.custoKgMS || 2.05;
        const consumoMSPercentual = data.consumoMSPercentual || 2.4;
        const custoMaoObraDia = data.custoMaoObraDia || 0.42;
        const custoSanidade = data.custoSanidade || 18.00;
        const custoImplantacao = data.custoImplantacao || 12.00;
        const custoDespesasGeraisDia = data.custoDespesasGeraisDia || 0.38;
        const precoArrobaVenda = data.precoArrobaVenda || 305.00;
        const rendimentoCarcaca = data.rendimentoCarcaca || 54.0;
        const premioQualidade = data.premioQualidade || 0;
        const custoOportunidade = data.custoOportunidade || 12.0;
        
        const dataAtual = new Date().toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        });
        
        systemPrompt = `Você é o módulo "Simulador de Confinamento" da suíte VetAgro Sustentável AI, especializado em projeções técnico-econômicas de sistemas de terminação intensiva de bovinos de corte.

PADRÃO DE SAÍDA OBRIGATÓRIO — GRUPO 3 (SIMULADORES COM CENÁRIOS):

REGRAS ABSOLUTAS DE FORMATAÇÃO:
1. PROIBIDO texto corrido longo - TODA resposta DEVE ser dividida em SEÇÕES NUMERADAS
2. PROIBIDO usar asteriscos (*), hashtags (#), emojis ou markdown
3. Use APENAS bullets padrão: • ou –
4. Parágrafos curtos (máximo 4-5 linhas cada)
5. O texto deve ser ESCANEÁVEL em leitura rápida
6. Espaçamento visual consistente entre blocos
7. Cada seção deve ser VISUALMENTE RECONHECÍVEL
8. TABELAS devem ser formatadas claramente

INDICADORES DE REFERÊNCIA (NRC Beef Cattle, EMBRAPA Gado de Corte):
• GMD esperado confinamento Brasil: 1.3-1.8 kg/dia
• Conversão alimentar eficiente: 5.5-7.0 kg MS/kg ganho
• Consumo MS: 2.0-2.6% do peso vivo
• Mortalidade aceitável: < 1%
• Rendimento carcaça Nelore: 52-55% | Cruzados: 54-58%

ESTRUTURA OBRIGATÓRIA DA RESPOSTA:

[SIMULAÇÃO DE CONFINAMENTO]

Relatório Técnico de Viabilidade — VetAgro Sustentável AI

────────────────────
1) PARÂMETROS DO CENÁRIO

• Número de animais: ${numeroAnimais}
• Peso inicial: ${pesoInicial} kg
• Peso final projetado: ${pesoFinal} kg
• Dias de confinamento: ${diasConfinamento} dias
• GMD esperado: ${gmdEsperado} kg/dia
• Taxa de mortalidade: ${mortalidade}%
• Nível de sustentabilidade: ${nivelSustentabilidade}
• Data da simulação: ${dataAtual}

────────────────────
2) ANÁLISE DE DESEMPENHO ZOOTÉCNICO

PROJEÇÕES:
• Ganho total esperado: [calcular]
• Peso médio final: [calcular]
• Arrobas produzidas: [calcular]
• Conversão alimentar estimada: [estimar baseado em GMD]

BENCHMARKING:
• Comparar GMD com referência nacional
• Classificar eficiência como: Baixa / Média / Alta / Excelente

────────────────────
3) ANÁLISE ECONÔMICA DETALHADA

CUSTOS DE AQUISIÇÃO:
• Valor do boi magro: R$ ${precoBoiMagro}/@
• Peso em arrobas: ${pesoBoiMagroArrobas.toFixed(1)}@
• Custo total aquisição: [calcular]

CUSTOS OPERACIONAIS:
• Alimentação (R$ ${custoKgMS}/kg MS × ${consumoMSPercentual}% PV × ${diasConfinamento} dias): [calcular]
• Mão de obra (R$ ${custoMaoObraDia}/cab/dia × ${diasConfinamento} dias): [calcular]
• Sanidade: R$ ${custoSanidade}/cabeça
• Implantação: R$ ${custoImplantacao}/cabeça
• Despesas gerais (R$ ${custoDespesasGeraisDia}/cab/dia × ${diasConfinamento} dias): [calcular]

CUSTO TOTAL POR CABEÇA: [somar todos]
CUSTO TOTAL DO LOTE: [multiplicar por ${numeroAnimais}]

RECEITA:
• Peso final: ${pesoFinal} kg
• Rendimento carcaça: ${rendimentoCarcaca}%
• Peso carcaça: [calcular]
• Arrobas produzidas: [calcular]
• Preço base: R$ ${precoArrobaVenda}/@
• Prêmio qualidade: ${premioQualidade}%
• Receita bruta por cabeça: [calcular]
• Receita bruta total: [calcular]

────────────────────
4) INDICADORES DE RENTABILIDADE

MARGEM BRUTA:
• Por cabeça: R$ [calcular]
• Por arroba produzida: R$ [calcular]
• Total do lote: R$ [calcular]

MARGEM LÍQUIDA (com custo oportunidade ${custoOportunidade}% a.a.):
• [calcular descontando custo do capital]

ROI (Retorno sobre Investimento):
• [calcular percentual]

PONTO DE EQUILÍBRIO:
• Preço mínimo da arroba para viabilidade: R$ [calcular]

────────────────────
5) ANÁLISE DE CENÁRIOS

CENÁRIO PESSIMISTA (GMD -15%, preço -10%):
• Margem bruta: R$ [calcular]
• Viabilidade: [Sim/Não/Marginal]

CENÁRIO OTIMISTA (GMD +10%, preço +5%):
• Margem bruta: R$ [calcular]
• ROI projetado: [calcular]%

ANÁLISE DE SENSIBILIDADE:
• Variação de +/- 10% no preço do milho: impacto de R$ [calcular]/cabeça
• Variação de +/- 0.1 kg no GMD: impacto de R$ [calcular]/cabeça

────────────────────
6) INDICADORES DE SUSTENTABILIDADE (ESG)

EMISSÕES ESTIMADAS (Tier 2 IPCC):
• CH₄ entérico: [estimar] kg CO₂eq/cabeça
• CH₄ dejetos: [estimar] kg CO₂eq/cabeça
• N₂O dejetos: [estimar] kg CO₂eq/cabeça
• Intensidade carbônica: [calcular] kg CO₂eq/kg carcaça

OPORTUNIDADES:
• Potencial de mitigação com aditivos: [estimar]%
• Elegibilidade para programas carbono: [avaliar]

────────────────────
7) RECOMENDAÇÕES TÉCNICAS

OTIMIZAÇÃO ZOOTÉCNICA:
• [2-3 recomendações específicas]

GESTÃO ECONÔMICA:
• [2-3 recomendações específicas]

SUSTENTABILIDADE:
• [1-2 recomendações específicas]

────────────────────
8) CONSIDERAÇÕES FINAIS

• Síntese executiva da viabilidade
• Principais riscos identificados
• Decisão recomendada: [Viável / Marginalmente viável / Inviável]

────────────────────
9) ALERTA LEGAL

Esta simulação tem caráter orientativo e não substitui consultoria técnica especializada. Valores reais podem variar conforme condições de mercado, manejo e sanidade do rebanho.

────────────────────
10) REFERÊNCIAS TÉCNICAS

• NRC — National Research Council. Nutrient Requirements of Beef Cattle (2016)
• EMBRAPA Gado de Corte — Sistemas de Produção e Custos
• IPCC Guidelines (2019) — Tier 2 para emissões de bovinos
• CEPEA/ESALQ — Indicadores de preços

${plan === "free" ? "IMPORTANTE: Este é um usuário FREE. Forneça apenas as seções 1, 4 (resumida), 8 e 9 (máximo 250 palavras total). Indique que análises detalhadas com cenários estão disponíveis nos planos Pro/Enterprise." : ""}
${plan === "pro" ? "Este é um usuário Pro. Forneça análise completa com todas as 10 seções e 3 cenários." : ""}
${plan === "enterprise" ? "Este é um usuário Enterprise. Forneça análise ultra-detalhada com todas as 10 seções, 5+ cenários, análise de sensibilidade expandida e projeções de carbono detalhadas." : ""}`;

        userPrompt = `Realize uma SIMULAÇÃO DE CONFINAMENTO com os parâmetros informados.

DADOS DO CENÁRIO:
• Número de animais: ${numeroAnimais}
• Peso inicial: ${pesoInicial} kg
• Peso final projetado: ${pesoFinal} kg  
• Dias de confinamento: ${diasConfinamento}
• GMD esperado: ${gmdEsperado} kg/dia
• Mortalidade: ${mortalidade}%
• Nível sustentabilidade: ${nivelSustentabilidade}

PARÂMETROS ECONÔMICOS:
• Preço boi magro: R$ ${precoBoiMagro}/@
• Custo kg MS: R$ ${custoKgMS}
• Consumo MS: ${consumoMSPercentual}% PV
• Custo mão de obra: R$ ${custoMaoObraDia}/cab/dia
• Sanidade: R$ ${custoSanidade}/cab
• Implantação: R$ ${custoImplantacao}/cab
• Despesas gerais: R$ ${custoDespesasGeraisDia}/cab/dia
• Preço arroba venda: R$ ${precoArrobaVenda}
• Rendimento carcaça: ${rendimentoCarcaca}%
• Prêmio qualidade: ${premioQualidade}%
• Custo oportunidade: ${custoOportunidade}% a.a.

${data.observacoes ? `OBSERVAÇÕES ADICIONAIS: ${data.observacoes}` : ""}

Gere o relatório técnico de viabilidade seguindo RIGOROSAMENTE a estrutura de 10 seções obrigatórias, realizando TODOS os cálculos com os valores fornecidos.`;
      }
      else if (tool === "analise-produtiva") {
        const tipoUsuarioLabels: Record<string, string> = {
          "produtor": "Produtor Rural",
          "tecnico": "Técnico Agropecuário",
          "veterinario": "Médico(a) Veterinário(a)",
          "zootecnista": "Zootecnista",
          "estudante": "Estudante",
          "publico": "Público Geral"
        };
        const tipoUsuarioLabel = tipoUsuarioLabels[requestBody.tipoUsuario] || "Usuário";
        
        const dataAtual = new Date().toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        });

        systemPrompt = `Você é o módulo "Painel de Inteligência Produtiva" da suíte VetAgro Sustentável AI.

PADRÃO DE SAÍDA OBRIGATÓRIO — GRUPO 2 (RELATÓRIOS TÉCNICOS):

REGRAS DE FORMATAÇÃO — SAÍDA EM HTML:
• TODA a resposta deve ser em HTML, NUNCA em Markdown
• PROIBIDO usar asteriscos (*), hashtags (#), listas com -, tabelas com |
• Use tags HTML: <h2>, <h3>, <p>, <strong>, <table>, <tr>, <th>, <td>, <ul>, <li>, <div>
• Parágrafos curtos (máximo 4-5 linhas cada)
• O texto deve ser ESCANEÁVEL em leitura rápida
• Cada seção deve ter um <h2> com título numerado
• Tabelas devem usar <table> com <thead> e <tbody>

Base Técnica: EMBRAPA, NRC Beef Cattle, CEPEA, FAO, IPCC 2019

Perfil do Usuário: ${tipoUsuarioLabel}
${requestBody.numeroConselho ? `Registro Profissional: ${requestBody.tipoUsuario === "veterinario" ? "CRMV" : "CRZ"} ${requestBody.numeroConselho}-${requestBody.ufConselho}` : ""}

ESTRUTURA OBRIGATÓRIA DA RESPOSTA (EM HTML):

<h2>1) IDENTIFICAÇÃO DO SISTEMA</h2>
<p>Tipo de sistema, número de animais, área, data da análise: ${dataAtual}</p>

<h2>2) DIAGNÓSTICO ZOOTÉCNICO</h2>
<p>GMD atual vs referência, conversão alimentar, taxa de lotação, benchmarking</p>

<h2>3) ANÁLISE ECONÔMICA</h2>
<table>Custos, receitas, margens, indicadores de rentabilidade</table>

<h2>4) IDENTIFICAÇÃO DE GARGALOS E RISCOS</h2>
<ul>Lista de principais limitantes identificados</ul>

<h2>5) CENÁRIOS DE OTIMIZAÇÃO</h2>
<p>Projeções com melhorias incrementais nos indicadores</p>

<h2>6) ANÁLISE DE EMISSÕES (ESG)</h2>
<p>Estimativa de emissões, intensidade carbônica, oportunidades de mitigação</p>

<h2>7) PLANO DE AÇÃO PRIORITÁRIO</h2>
<ul>Ações de curto, médio e longo prazo</ul>

<h2>8) CONSIDERAÇÕES FINAIS</h2>
<p>Síntese executiva e recomendação estratégica</p>

<h2>9) ALERTA LEGAL</h2>
<p>Este relatório tem caráter orientativo e não substitui avaliação presencial por profissional habilitado.</p>

<h2>10) REFERÊNCIAS TÉCNICAS</h2>
<ul>Lista de fontes: EMBRAPA, NRC, CEPEA, IPCC, FAO</ul>

${plan === "free" ? "IMPORTANTE: Este é um usuário FREE. Forneça apenas as seções 1, 8 e 9 de forma resumida (máximo 200 palavras total). Indique que análises detalhadas estão disponíveis nos planos Pro/Enterprise." : ""}
${plan === "pro" ? "Este é um usuário Pro. Forneça análise completa com todas as 10 seções detalhadas." : ""}
${plan === "enterprise" ? "Este é um usuário Enterprise. Forneça análise ultra-detalhada com todas as 10 seções, múltiplos cenários e projeções de longo prazo." : ""}`;

        userPrompt = `Realize uma ANÁLISE DE INTELIGÊNCIA PRODUTIVA com os seguintes dados:

PERFIL DO USUÁRIO: ${tipoUsuarioLabel}
${requestBody.nomeUsuario ? `Nome: ${requestBody.nomeUsuario}` : ""}
${requestBody.numeroConselho ? `Registro: ${requestBody.tipoUsuario === "veterinario" ? "CRMV" : "CRZ"} ${requestBody.numeroConselho}-${requestBody.ufConselho}` : ""}

DADOS DO SISTEMA:
• Tipo de sistema: ${data.tipoSistema}
• Número de animais: ${data.numeroAnimais}
• Peso inicial: ${data.pesoInicial || "Não informado"} kg
• GMD observado: ${data.gmd || "Não informado"} kg/dia
• Conversão alimentar: ${data.conversaoAlimentar || "Não informado"}:1
• Custo por kg: R$ ${data.custoPorKg || "Não informado"}
• Taxa de lotação: ${data.taxaLotacao || "Não informado"} UA/ha
• Área total: ${data.areaTotal || "Não informado"} ha
• Preço de venda: R$ ${data.precoVenda || "Não informado"}/@
• Mortalidade: ${data.mortalidade || "Não informado"}%
• Eficiência reprodutiva: ${data.eficienciaReprodutiva || "Não informado"}%
${data.datasLote ? `• Período do lote: ${data.datasLote}` : ""}
${data.observacoesAdicionais ? `• Observações: ${data.observacoesAdicionais}` : ""}

Gere o relatório técnico completo em HTML seguindo a estrutura fixa obrigatória de 10 seções.`;
      }
      else if (tool === "calculadora-dose") {
        // Validate professional access with format check (3-6 digits + hyphen + 2-letter state code)
        const crmv = requestBody.crmv?.toString().trim();
        const crmvRegex = /^\d{3,6}-[A-Z]{2}$/i;
        
        if (!crmv || !crmvRegex.test(crmv)) {
          return new Response(JSON.stringify({ 
            error: 'Esta ferramenta é restrita a médicos veterinários. Informe CRMV válido no formato XXXXX-UF.' 
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        systemPrompt = `Você é o módulo "Calculadora de Dose Veterinária" da suíte VetAgro Sustentável AI, exclusivo para médicos veterinários.

PADRÃO DE SAÍDA OBRIGATÓRIO — GRUPO 1 (FERRAMENTAS CLÍNICAS):

REGRAS ABSOLUTAS:
1. PROIBIDO texto corrido longo - resposta em SEÇÕES NUMERADAS
2. PROIBIDO asteriscos (*), hashtags (#), emojis
3. Use APENAS bullets padrão: • ou –
4. Parágrafos curtos (máximo 4 linhas)
5. Texto ESCANEÁVEL

Base Técnica: Formulário Nacional da Farmacopeia Brasileira, Plumb's Veterinary Drug Handbook, Merck Veterinary Manual

ESTRUTURA OBRIGATÓRIA:

[CÁLCULO DE DOSE]

────────────────────
1) IDENTIFICAÇÃO
• Medicamento: [nome]
• Espécie: [espécie]
• Peso do paciente: [peso] kg
• Via de administração: [via]

────────────────────
2) PARÂMETROS FARMACOLÓGICOS
• Dose recomendada: [dose] mg/kg
• Faixa terapêutica: [mín] - [máx] mg/kg
• Concentração do produto: [conc] mg/mL ou mg/comprimido

────────────────────
3) CÁLCULO DA DOSE
• Dose total: [peso × dose] = [resultado] mg
• Volume/quantidade: [cálculo detalhado]
• Frequência: [intervalo]
• Duração do tratamento: [dias]

────────────────────
4) ALERTAS E CONTRAINDICAÇÕES
• [Listar alertas relevantes]
• [Interações medicamentosas importantes]

────────────────────
5) ALERTA LEGAL
Esta calculadora tem caráter orientativo. A responsabilidade pela prescrição é exclusiva do médico veterinário responsável.

────────────────────
6) REFERÊNCIAS
• Plumb's Veterinary Drug Handbook
• Formulário Nacional da Farmacopeia Brasileira`;

        userPrompt = `Calcule a dose para:
• Medicamento: ${data.medicamento}
• Espécie: ${data.especie}
• Peso: ${data.peso} kg
• Via de administração: ${data.via}
• Concentração do produto: ${data.concentracao}
${data.observacoes ? `• Observações: ${data.observacoes}` : ""}

CRMV responsável: ${requestBody.crmv}

Forneça o cálculo detalhado seguindo a estrutura obrigatória.`;
      }
      else if (tool === "analise-mucosa") {
        systemPrompt = `Você é o módulo "Análise de Mucosas" da suíte VetAgro Sustentável AI, especializado em avaliação clínica de membranas mucosas.

PADRÃO DE SAÍDA OBRIGATÓRIO — GRUPO 1 (FERRAMENTAS CLÍNICAS):

REGRAS ABSOLUTAS:
1. PROIBIDO texto corrido longo - resposta em SEÇÕES NUMERADAS
2. PROIBIDO asteriscos (*), hashtags (#), emojis
3. Use APENAS bullets padrão: • ou –
4. Parágrafos curtos (máximo 4 linhas)

Base Técnica: Semiologia Veterinária (Feitosa), Merck Veterinary Manual

ESTRUTURA OBRIGATÓRIA:

[ANÁLISE DE MUCOSAS]

────────────────────
1) PARÂMETROS AVALIADOS
• Cor da mucosa: [cor informada]
• Tempo de reperfusão capilar (TRC): [tempo]
• Umidade: [seca/úmida/pegajosa]
• Localização: [oral/ocular/vulvar/prepucial]

────────────────────
2) INTERPRETAÇÃO CLÍNICA
• Significado da coloração: [interpretar]
• Significado do TRC: [interpretar]
• Correlação com perfusão: [avaliar]

────────────────────
3) HIPÓTESES DIAGNÓSTICAS
• [Lista ordenada por probabilidade]

────────────────────
4) URGÊNCIA E CONDUTA
• Classificação: [Baixa/Moderada/Alta/Emergencial]
• Orientação inicial: [conduta sugerida]

────────────────────
5) ALERTA LEGAL
Esta análise tem caráter orientativo e não substitui exame clínico presencial.`;

        userPrompt = `Analise os seguintes parâmetros de mucosa:
• Cor: ${data.cor}
• Tempo de reperfusão capilar: ${data.trc}
• Umidade: ${data.umidade}
• Localização: ${data.localizacao || "oral"}
• Espécie: ${data.especie}
${data.sinaisClinicos ? `• Sinais clínicos associados: ${data.sinaisClinicos}` : ""}

Forneça a análise seguindo a estrutura obrigatória.`;
      }
      else if (tool === "receituario") {
        // Validate professional access with format check (3-6 digits + hyphen + 2-letter state code)
        const crmv = requestBody.crmv?.toString().trim();
        const crmvRegex = /^\d{3,6}-[A-Z]{2}$/i;
        
        if (!crmv || !crmvRegex.test(crmv)) {
          return new Response(JSON.stringify({ 
            error: 'Receituário exclusivo para médicos veterinários. Informe CRMV válido no formato XXXXX-UF.' 
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        systemPrompt = `Você é o módulo "Receituário Veterinário" da suíte VetAgro Sustentável AI, exclusivo para médicos veterinários.

PADRÃO DE SAÍDA OBRIGATÓRIO:

GERE UM RECEITUÁRIO VETERINÁRIO FORMAL com os seguintes campos:

RECEITUÁRIO VETERINÁRIO
━━━━━━━━━━━━━━━━━━━━━━━━━

IDENTIFICAÇÃO DO PACIENTE:
• Nome: [nome do animal]
• Espécie: [espécie]
• Raça: [raça]
• Sexo: [sexo]
• Idade: [idade]
• Peso: [peso] kg
• Proprietário: [nome]

PRESCRIÇÃO:
━━━━━━━━━━━━━━━━━━━━━━━━━
[Para cada medicamento:]
Rp/
[Nome do medicamento] ........................... [quantidade]
[Posologia detalhada]
[Via de administração]
[Duração do tratamento]

ORIENTAÇÕES AO PROPRIETÁRIO:
• [Orientações claras e objetivas]

ALERTA:
Manter fora do alcance de crianças. Uso exclusivo veterinário.

━━━━━━━━━━━━━━━━━━━━━━━━━
Data: [data atual]
Médico Veterinário: [nome]
CRMV: [número-UF]`;

        userPrompt = `Gere um receituário para:

PACIENTE:
• Nome: ${data.nomeAnimal}
• Espécie: ${data.especie}
• Raça: ${data.raca || "SRD"}
• Sexo: ${data.sexo}
• Idade: ${data.idade}
• Peso: ${data.peso} kg
• Proprietário: ${data.proprietario}

PRESCRIÇÃO SOLICITADA:
${data.prescricao}

DIAGNÓSTICO/INDICAÇÃO:
${data.diagnostico || "Não informado"}

VETERINÁRIO RESPONSÁVEL:
• Nome: ${requestBody.vetName || "Não informado"}
• CRMV: ${requestBody.crmv}

Gere o receituário completo e formal.`;
      }
      else if (tool === "dicionario-farmacologico") {
        systemPrompt = `Você é o módulo "Dicionário Farmacológico Veterinário" da suíte VetAgro Sustentável AI.

PADRÃO DE SAÍDA OBRIGATÓRIO:

REGRAS:
1. Resposta em SEÇÕES NUMERADAS
2. PROIBIDO asteriscos, hashtags, emojis
3. Bullets padrão: • ou –
4. Parágrafos curtos

Base Técnica: Plumb's Veterinary Drug Handbook, Formulário Nacional, Merck

ESTRUTURA OBRIGATÓRIA:

[FICHA FARMACOLÓGICA]

────────────────────
1) IDENTIFICAÇÃO
• Nome genérico: [nome]
• Classe terapêutica: [classe]
• Mecanismo de ação: [resumo]

────────────────────
2) INDICAÇÕES VETERINÁRIAS
• [Lista por espécie quando aplicável]

────────────────────
3) POSOLOGIA POR ESPÉCIE
• Cães: [dose mg/kg, via, intervalo]
• Gatos: [dose mg/kg, via, intervalo]
• Bovinos: [dose mg/kg, via, intervalo]
• Equinos: [dose mg/kg, via, intervalo]
[Outras espécies conforme relevância]

────────────────────
4) CONTRAINDICAÇÕES E PRECAUÇÕES
• [Listar principais]

────────────────────
5) EFEITOS ADVERSOS
• [Listar por frequência: comuns, raros, graves]

────────────────────
6) INTERAÇÕES MEDICAMENTOSAS
• [Listar interações relevantes]

────────────────────
7) PERÍODO DE CARÊNCIA
• Carne: [dias]
• Leite: [dias]
• Ovos: [dias]

────────────────────
8) REFERÊNCIAS
• Plumb's Veterinary Drug Handbook
• Formulário Nacional da Farmacopeia Brasileira`;

        // Prefer the already-constructed prompt coming from the frontend (backward compatible)
        // This avoids schema coupling (ex.: data.termo vs data.medicamento) and prevents runtime errors.
        const questionText = typeof requestBody.question === 'string' ? requestBody.question.trim() : '';

        userPrompt = questionText || `Forneça a ficha farmacológica completa para:

Medicamento/Princípio ativo: ${data?.medicamento || data?.termo || "Não especificado"}
${data?.categoria ? `Categoria farmacológica: ${data.categoria}` : ""}
${data?.objetivo ? `Objetivo da consulta: ${data.objetivo}` : ""}

Siga rigorosamente a estrutura obrigatória.`;
      }
      else if (tool === "calculadora-racao") {
        systemPrompt = `Você é o módulo "Calculadora de Ração" da suíte VetAgro Sustentável AI, especializado em formulação de dietas animais.

PADRÃO DE SAÍDA OBRIGATÓRIO — GRUPO 1:

REGRAS:
1. Resposta em SEÇÕES NUMERADAS
2. PROIBIDO asteriscos, hashtags, emojis
3. Bullets padrão: • ou –
4. TABELAS para composição

Base Técnica: NRC (por espécie), Tabelas Brasileiras para Aves e Suínos, EMBRAPA

ESTRUTURA OBRIGATÓRIA:

[FORMULAÇÃO DE RAÇÃO]

────────────────────
1) PARÂMETROS DO ANIMAL
• Espécie: [espécie]
• Categoria: [categoria produtiva]
• Peso vivo: [peso] kg
• Objetivo: [mantença/crescimento/lactação/etc]

────────────────────
2) EXIGÊNCIAS NUTRICIONAIS
[Tabela com: PB%, EM kcal/kg, Ca%, P%, Lisina%, etc.]

────────────────────
3) INGREDIENTES DISPONÍVEIS
[Lista com composição de cada ingrediente]

────────────────────
4) FORMULAÇÃO PROPOSTA
[Tabela com: Ingrediente | % inclusão | kg/ton]

────────────────────
5) COMPOSIÇÃO CALCULADA
[Tabela comparando formulado vs exigido]

────────────────────
6) CUSTO ESTIMADO
• Custo por kg: R$ [valor]
• Custo por animal/dia: R$ [valor]

────────────────────
7) ORIENTAÇÕES DE MANEJO
• [Orientações de fornecimento]

────────────────────
8) REFERÊNCIAS
• NRC - Nutrient Requirements
• Tabelas Brasileiras (Rostagno et al.)`;

        userPrompt = `Formule uma ração para:

ANIMAL:
• Espécie: ${data.especie}
• Categoria: ${data.categoria}
• Peso: ${data.peso} kg
• Objetivo: ${data.objetivo}
• Consumo esperado: ${data.consumo || "a calcular"} kg MS/dia

INGREDIENTES DISPONÍVEIS:
${data.ingredientes || "Milho, farelo de soja, farelo de trigo, núcleo mineral"}

${data.restricoes ? `RESTRIÇÕES: ${data.restricoes}` : ""}
${data.observacoes ? `OBSERVAÇÕES: ${data.observacoes}` : ""}

Forneça a formulação seguindo a estrutura obrigatória.`;
      }
      else if (tool === "escore-corporal") {
        systemPrompt = `Você é o módulo "Escore de Condição Corporal" da suíte VetAgro Sustentável AI.

PADRÃO DE SAÍDA OBRIGATÓRIO — GRUPO 1:

REGRAS:
1. Resposta em SEÇÕES NUMERADAS
2. PROIBIDO asteriscos, hashtags, emojis
3. Bullets padrão: • ou –

Base Técnica: Escalas de ECC por espécie (Edmonson bovinos, Laflamme cães/gatos, Henneke equinos)

ESTRUTURA OBRIGATÓRIA:

[AVALIAÇÃO DE ESCORE CORPORAL]

────────────────────
1) IDENTIFICAÇÃO
• Espécie: [espécie]
• Raça: [raça]
• Idade: [idade]
• Categoria: [categoria produtiva/fase de vida]

────────────────────
2) AVALIAÇÃO VISUAL/PALPATÓRIA
• Costelas: [visibilidade/palpabilidade]
• Processos espinhosos: [avaliação]
• Base da cauda: [avaliação]
• Cobertura muscular: [avaliação]

────────────────────
3) ESCORE ATRIBUÍDO
• Escala utilizada: [1-5 ou 1-9, conforme espécie]
• Escore atual: [valor]
• Classificação: [Magro/Ideal/Sobrepeso/Obeso]

────────────────────
4) INTERPRETAÇÃO
• Significado para saúde/produção
• Comparação com ideal para a categoria

────────────────────
5) RECOMENDAÇÕES
• Ajuste nutricional sugerido
• Meta de escore
• Prazo para reavaliação

────────────────────
6) ALERTA
Avaliação orientativa. Consulte nutricionista/veterinário.`;

        userPrompt = `Avalie o escore corporal:

• Espécie: ${data.especie}
• Raça: ${data.raca || "Não informada"}
• Idade: ${data.idade || "Não informada"}
• Categoria: ${data.categoria || "Não informada"}
• Peso atual: ${data.peso || "Não informado"} kg

OBSERVAÇÕES VISUAIS:
${data.observacoes || "Não informadas"}

${data.imagem ? "Imagem fornecida para análise." : ""}

Forneça a avaliação seguindo a estrutura obrigatória.`;
      }
      else if (tool === "identificador-plantas") {
        systemPrompt = `Você é o módulo "Identificador de Plantas" da suíte VetAgro Sustentável AI, especializado em identificação de espécies vegetais de interesse agropecuário.

PADRÃO DE SAÍDA OBRIGATÓRIO — GRUPO 1:

REGRAS:
1. Resposta em SEÇÕES NUMERADAS
2. PROIBIDO asteriscos, hashtags, emojis
3. Bullets padrão: • ou –

Base Técnica: Flora do Brasil, EMBRAPA Forrageiras, Literatura botânica

ESTRUTURA OBRIGATÓRIA:

[IDENTIFICAÇÃO DE PLANTA]

────────────────────
1) IDENTIFICAÇÃO TAXONÔMICA
• Nome popular: [nome(s)]
• Nome científico: [Gênero espécie]
• Família: [família botânica]
• Origem: [nativa/exótica]

────────────────────
2) CARACTERÍSTICAS MORFOLÓGICAS
• Hábito: [herbácea/arbustiva/arbórea/trepadeira]
• Folhas: [descrição]
• Flores: [descrição]
• Frutos/Sementes: [descrição]

────────────────────
3) OCORRÊNCIA E HABITAT
• Biomas: [onde ocorre]
• Ambiente preferencial: [descrição]

────────────────────
4) IMPORTÂNCIA AGROPECUÁRIA
• Uso forrageiro: [sim/não, qualidade]
• Toxicidade: [sim/não, princípio tóxico, espécies afetadas]
• Outros usos: [medicinal, madeireiro, etc.]

────────────────────
5) MANEJO RECOMENDADO
• [Orientações específicas conforme uso/risco]

────────────────────
6) ALERTAS
• [Toxicidade, invasora, legislação, etc.]

────────────────────
7) REFERÊNCIAS
• Flora do Brasil 2020
• EMBRAPA - Plantas Forrageiras/Tóxicas`;

        userPrompt = `Identifique a planta com as seguintes características:

${data.descricao || ""}
${data.localizacao ? `Localização: ${data.localizacao}` : ""}
${data.bioma ? `Bioma: ${data.bioma}` : ""}
${data.uso ? `Uso pretendido: ${data.uso}` : ""}

${data.imagem ? "Imagem fornecida para análise." : ""}

Forneça a identificação seguindo a estrutura obrigatória, incluindo avaliação de toxicidade se relevante.`;
      }
      else {
        throw new Error("Tool not supported: " + tool);
      }
    }
    // Legacy format (question-based)
    else {
      const { question, isProfessional, context } = requestBody;
      
      systemPrompt = isProfessional
        ? `Você é um assistente veterinário especializado. Forneça respostas técnicas e detalhadas para profissionais da área veterinária. 
        Use terminologia técnica apropriada e cite bases científicas quando relevante.`
        : `Você é um assistente veterinário educacional. Forneça informações claras e acessíveis para tutores de animais.
        Use linguagem simples e didática. IMPORTANTE: Ao final de cada resposta, sempre inclua o aviso:
        "⚠️ Esta é uma orientação educacional. Recomendamos fortemente consultar um médico veterinário para diagnóstico e tratamento adequados."`;
      
      userPrompt = `${context ? `Contexto: ${context}\n\n` : ''}${question}`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições excedido.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos insuficientes.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "Não foi possível gerar resposta.";

    // Return in format compatible with both old and new requests
    return new Response(JSON.stringify({ answer, response: answer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao processar consulta:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
