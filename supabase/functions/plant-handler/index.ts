import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleRequest, sanitizeField } from "../_shared/edgeFunctionUtils.ts";

serve(async (req) => {
  return handleRequest(req, ({ requestBody, data, tool, plan, isProfessional }) => {

    if (tool === "identificador-plantas") {
      const systemPrompt = `Você é o módulo "Identificador de Plantas — Toxicologia Vegetal e Diagnóstico Fitossanitário" da suíte VetAgro Sustentável AI.

REGRAS: SEÇÕES NUMERADAS, sem markdown, bullets • ou –.
Base: Flora do Brasil, EMBRAPA Forrageiras, MAPA, CIRAD, CIAT, FAO

ANÁLISE INTEGRADA: identificação taxonômica + toxicologia + diagnóstico fitossanitário.

DETECÇÃO ESPECIAL — Vassoura-de-Bruxa da Mandioca (Ceratobasidium theobromae):
Se sinais compatíveis (brotações anormais, redução entrenós, proliferação ramos, nanismo, seca apical), indicar suspeita fitossanitária com nível de compatibilidade.

ESTRUTURA OBRIGATÓRIA:

1) IDENTIFICAÇÃO TAXONÔMICA (nome popular, científico, família, origem)
2) DIAGNÓSTICO PRINCIPAL (problema mais provável com base em padrões visuais + sintomas + literatura)
3) DIAGNÓSTICOS DIFERENCIAIS (3-4 hipóteses: nome doença, agente causal, sintomas, nível probabilidade)
4) ANÁLISE DOS SINTOMAS VISUAIS
5) POSSÍVEIS CAUSAS AGRONÔMICAS
6) RECOMENDAÇÕES PARA PRODUTOR (medidas imediatas, manejo preventivo, isolamento, comunicação técnica)
7) RECOMENDAÇÕES PARA PROFISSIONAL TÉCNICO (diagnóstico confirmatório, coleta amostras, laboratório, controle)
8) NÍVEL DE CONFIANÇA DA ANÁLISE
9) AVISO TÉCNICO (confirmação laboratorial obrigatória)
10) REFERÊNCIAS (Flora do Brasil, EMBRAPA, MAPA, publicações científicas)

${plan === "free" ? "Usuário FREE. Seções 1, 2, 8 e 9 resumidas (máximo 250 palavras)." : ""}
${plan === "pro" ? "Usuário Pro. Todas as 10 seções." : ""}
${plan === "enterprise" ? "Usuário Enterprise. Ultra-detalhada com 10 seções." : ""}`;

      const userPrompt = `IDENTIFICAÇÃO E DIAGNÓSTICO DE PLANTA:
${data.descricao || ""}
${data.localizacao ? `Localização: ${data.localizacao}` : ""}
${data.bioma ? `Bioma: ${data.bioma}` : ""}
${data.uso ? `Uso pretendido: ${data.uso}` : ""}
${data.sintomas ? `Sintomas: ${data.sintomas}` : ""}
${data.contextoAgricola ? `Contexto agrícola: ${data.contextoAgricola}` : ""}
${data.uf ? `UF: ${data.uf}` : ""}
${data.municipio ? `Município: ${data.municipio}` : ""}
${data.imagem || (data.images && data.images.length > 0) ? "Imagem(ns) fornecida(s) para análise." : ""}

Gere o relatório completo com 10 seções obrigatórias, incluindo diagnósticos diferenciais e recomendações para produtor e profissional técnico.`;

      return { systemPrompt, userPrompt };
    }

    if (tool === "diagnostico-mandioca") {
      const systemPrompt = `Você é um assistente técnico fitossanitário especializado em doenças da mandioca (Manihot esculenta), com foco na vassoura-de-bruxa causada por Ceratobasidium theobromae.

REGRAS: SEÇÕES NUMERADAS, sem markdown, bullets • ou –.
Base: Embrapa, MAPA, CIRAD, CIAT, FAO

Sinais oficiais da vassoura-de-bruxa: ramos secos/deformados, nanismo, proliferação de brotos finos, clorose, murcha, morte apical.

Classificação: BAIXA / MODERADA / ALTA COMPATIBILIDADE

SEGURANÇA: NÃO confundir com vassoura-de-bruxa do cacau (Moniliophthora perniciosa). NÃO afirmar diagnóstico definitivo.

ESTRUTURA:
1) DIAGNÓSTICO VISUAL PRELIMINAR
2) NÍVEL DE COMPATIBILIDADE
3) EXPLICAÇÃO TÉCNICA
4) CONTEXTO CIENTÍFICO
5) ALERTA IMPORTANTE
6) MEDIDAS RECOMENDADAS
7) CONTEXTO AMAZÔNICO
8) REFERÊNCIAS TÉCNICAS

${plan === "free" ? "Usuário FREE. Seções 1, 2, 5 e 6 resumidas (máximo 300 palavras)." : ""}
${plan === "pro" ? "Usuário Pro. Todas as 8 seções." : ""}
${plan === "enterprise" ? "Usuário Enterprise. Ultra-detalhada." : ""}`;

      const regiaoInfo = sanitizeField(data.regiao) || "Não informada";
      const estadoInfo = sanitizeField(data.estado) || "Não informado";
      const sintomasDesc = sanitizeField(data.sintomas, 3000) || "Não fornecidos";
      const hasImages = data.images && Array.isArray(data.images) && data.images.length > 0;

      const userPrompt = `DIAGNÓSTICO FITOSSANITÁRIO DA MANDIOCA:
LOCALIZAÇÃO: ${regiaoInfo} - ${estadoInfo}
SINTOMAS: ${sintomasDesc}
${hasImages ? `IMAGENS: ${data.images.length} imagem(ns)` : "Sem imagens"}

Gere o relatório com 8 seções obrigatórias.`;

      return { systemPrompt, userPrompt };
    }

    return null;
  });
});
