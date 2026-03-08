import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleRequest, sanitizeField, getCorsHeaders } from "../_shared/edgeFunctionUtils.ts";
import { validateAndSanitizeInput } from "../_shared/inputValidation.ts";

serve(async (req) => {
  return handleRequest(req, ({ requestBody, data, tool, plan, isProfessional }) => {

    if (tool === "analise-mucosa") {
      // Validate CRMV for professional access
      const crmv = requestBody.crmv?.toString().trim();
      const crmvRegex = /^\d{3,6}-[A-Z]{2}$/i;
      if (isProfessional && crmv && !crmvRegex.test(crmv)) {
        // Will be handled by returning null + specific error in the handler
      }

      const systemPrompt = `Você é um médico veterinário especialista em clínica médica e semiologia veterinária, atuando como módulo "Análise de Mucosas e Sinais Clínicos Visuais" da suíte VetAgro Sustentável AI.

⚠️ REGRA: Se houver imagem, é PROIBIDO responder "dados insuficientes". DEVE analisar e fornecer interpretação clínica.

REGRAS: SEÇÕES NUMERADAS, sem markdown, bullets • ou –.

ESTRUTURA:
1) ACHADOS VISUAIS IDENTIFICADOS
2) INTERPRETAÇÃO CLÍNICA
3) DIAGNÓSTICOS DIFERENCIAIS (3-5, ordenados por probabilidade, com justificativa e grau de confiança)
4) EXAMES COMPLEMENTARES RECOMENDADOS
5) CONDUTA INICIAL SUGERIDA
6) GRAU DE URGÊNCIA (Emergência/Urgente/Eletivo)
7) DISCLAIMER TÉCNICO
8) REFERÊNCIAS CIENTÍFICAS (PubMed, Merck Veterinary Manual, livros-texto)`;

      const especieInfo = sanitizeField(data.especie) || "Não identificada";
      const descricaoClinica = sanitizeField(data.descricao, 3000) || "Não fornecida";
      const hasImages = data.images && Array.isArray(data.images) && data.images.length > 0;
      const crmvInfo = requestBody.crmv || "";

      const userPrompt = `ANÁLISE DE MUCOSAS E SINAIS CLÍNICOS:
ESPÉCIE: ${especieInfo}
USUÁRIO: ${isProfessional ? `Veterinário - CRMV: ${crmvInfo}` : "Tutor/Produtor"}
DADOS CLÍNICOS: ${descricaoClinica}
${hasImages ? `IMAGENS: ${data.images.length} imagem(ns) para análise` : "Sem imagens"}

Gere relatório com 8 seções obrigatórias.`;

      return { systemPrompt, userPrompt };
    }

    if (tool === "calculadora-dose") {
      const crmv = requestBody.crmv?.toString().trim();
      const crmvRegex = /^\d{3,6}-[A-Z]{2}$/i;
      if (!crmv || !crmvRegex.test(crmv)) {
        // Return a specific error — handled via thrown error
        throw new Error('CRMV_REQUIRED:Esta ferramenta é restrita a médicos veterinários. Informe CRMV válido no formato XXXXX-UF.');
      }

      const systemPrompt = `Você é o módulo "Calculadora de Dose" da suíte VetAgro Sustentável AI, exclusivo para médicos veterinários.

REGRAS: SEÇÕES NUMERADAS, sem markdown, bullets • ou –.
Base: Plumb's Veterinary Drug Handbook, Formulário Nacional

ESTRUTURA:
1) IDENTIFICAÇÃO DO PACIENTE
2) MEDICAMENTO PRESCRITO
3) CÁLCULO DE DOSE (com fórmula e resultado)
4) POSOLOGIA COMPLETA
5) ALERTAS E CONTRAINDICAÇÕES
6) PERÍODO DE CARÊNCIA (quando aplicável)
7) ORIENTAÇÕES AO VETERINÁRIO
8) REFERÊNCIAS`;

      const userPrompt = `CÁLCULO DE DOSE:
• Espécie: ${data.especie}
• Raça: ${data.raca || "SRD"}
• Peso: ${data.peso} kg
• Idade: ${data.idade || "Não informada"}
• Medicamento: ${data.medicamento}
• Via: ${data.viaAdministracao || "Não especificada"}
• Indicação: ${data.indicacao || "Não informada"}
${data.observacoes ? `• Obs: ${data.observacoes}` : ""}

CRMV: ${crmv}
Calcule a dose e gere o relatório completo.`;

      return { systemPrompt, userPrompt };
    }

    if (tool === "receituario") {
      const crmv = requestBody.crmv?.toString().trim();
      const crmvRegex = /^\d{3,6}-[A-Z]{2}$/i;
      if (!crmv || !crmvRegex.test(crmv)) {
        throw new Error('CRMV_REQUIRED:Receituário exclusivo para médicos veterinários. Informe CRMV válido.');
      }

      const systemPrompt = `Você é o módulo "Receituário Veterinário" da suíte VetAgro Sustentável AI, exclusivo para médicos veterinários.

GERE UM RECEITUÁRIO VETERINÁRIO FORMAL com campos:
IDENTIFICAÇÃO DO PACIENTE, PRESCRIÇÃO (Rp/), ORIENTAÇÕES AO PROPRIETÁRIO, ALERTA, Data, Veterinário, CRMV.`;

      const userPrompt = `RECEITUÁRIO:
• Nome: ${data.nomeAnimal} | Espécie: ${data.especie} | Raça: ${data.raca || "SRD"}
• Sexo: ${data.sexo} | Idade: ${data.idade} | Peso: ${data.peso} kg
• Proprietário: ${data.proprietario}
PRESCRIÇÃO: ${data.prescricao}
DIAGNÓSTICO: ${data.diagnostico || "Não informado"}
VETERINÁRIO: ${requestBody.vetName || "Não informado"} | CRMV: ${crmv}

Gere o receituário completo e formal.`;

      return { systemPrompt, userPrompt };
    }

    if (tool === "dicionario-farmacologico") {
      const systemPrompt = `Você é o módulo "Dicionário Farmacológico Veterinário" da suíte VetAgro Sustentável AI.

REGRAS: SEÇÕES NUMERADAS, sem markdown, bullets • ou –.
Base: Plumb's Veterinary Drug Handbook, Formulário Nacional, Merck

ESTRUTURA:
1) IDENTIFICAÇÃO (nome genérico, classe, mecanismo)
2) INDICAÇÕES VETERINÁRIAS
3) POSOLOGIA POR ESPÉCIE (cães, gatos, bovinos, equinos)
4) CONTRAINDICAÇÕES E PRECAUÇÕES
5) EFEITOS ADVERSOS
6) INTERAÇÕES MEDICAMENTOSAS
7) PERÍODO DE CARÊNCIA
8) REFERÊNCIAS`;

      const questionText = typeof requestBody.question === 'string' ? requestBody.question.trim() : '';
      const userPrompt = questionText || `Ficha farmacológica para: ${data?.medicamento || data?.termo || "Não especificado"}
${data?.categoria ? `Categoria: ${data.categoria}` : ""}
${data?.objetivo ? `Objetivo: ${data.objetivo}` : ""}`;

      return { systemPrompt, userPrompt };
    }

    if (tool === "escore-corporal") {
      const systemPrompt = `Você é o módulo "Escore de Condição Corporal" da suíte VetAgro Sustentável AI.

REGRAS: SEÇÕES NUMERADAS, sem markdown, bullets • ou –.
Base: Edmonson (bovinos), Laflamme (cães/gatos), Henneke (equinos)

ESTRUTURA:
1) IDENTIFICAÇÃO
2) AVALIAÇÃO VISUAL/PALPATÓRIA
3) ESCORE ATRIBUÍDO (escala, valor, classificação)
4) INTERPRETAÇÃO
5) RECOMENDAÇÕES
6) ALERTA`;

      const userPrompt = `ESCORE CORPORAL:
• Espécie: ${data.especie} | Raça: ${data.raca || "N/I"} | Idade: ${data.idade || "N/I"}
• Categoria: ${data.categoria || "N/I"} | Peso: ${data.peso || "N/I"} kg
OBSERVAÇÕES: ${data.observacoes || "Não informadas"}
${data.imagem ? "Imagem fornecida." : ""}

Avalie seguindo a estrutura obrigatória.`;

      return { systemPrompt, userPrompt };
    }

    // Legacy question-based clinical requests (DiagnosticoDiferencial, Dicionario without tool field)
    if (!tool && requestBody?.question) {
      const questionValidation = validateAndSanitizeInput(requestBody.question, 'pergunta', 5000);
      if (!questionValidation.valid) return null;

      const context = sanitizeField(requestBody.context, 2000);
      const systemPrompt = isProfessional
        ? `Você é um assistente veterinário especializado. Forneça respostas técnicas detalhadas para profissionais.`
        : `Você é um assistente veterinário educacional. Use linguagem simples e didática. Inclua ao final: "⚠️ Esta é uma orientação educacional. Consulte um médico veterinário."`;
      const userPrompt = `${context ? `Contexto: ${context}\n\n` : ''}${questionValidation.sanitized}`;

      return { systemPrompt, userPrompt };
    }

    return null;
  });
});
