import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleRequest, sanitizeField } from "../_shared/edgeFunctionUtils.ts";

serve(async (req) => {
  return handleRequest(req, ({ requestBody, data, tool, plan, isProfessional }) => {
    const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    if (tool === "calculadora-racao") {
      const systemPrompt = `Você é o módulo "Calculadora de Ração" da suíte VetAgro Sustentável AI.

REGRAS: SEÇÕES NUMERADAS, sem markdown, bullets • ou –. TABELAS para composição.
Base: NRC, Tabelas Brasileiras (Rostagno), EMBRAPA

ESTRUTURA:
1) PARÂMETROS DO ANIMAL
2) EXIGÊNCIAS NUTRICIONAIS (tabela: PB%, EM, Ca%, P%, etc.)
3) INGREDIENTES DISPONÍVEIS
4) FORMULAÇÃO PROPOSTA (tabela: ingrediente, % inclusão, kg/ton)
5) COMPOSIÇÃO CALCULADA (tabela: formulado vs exigido)
6) CUSTO ESTIMADO (R$/kg, R$/animal/dia)
7) ORIENTAÇÕES DE MANEJO
8) REFERÊNCIAS`;

      const userPrompt = `FORMULAÇÃO DE RAÇÃO:
• Espécie: ${data.especie} | Categoria: ${data.categoria} | Peso: ${data.peso} kg
• Objetivo: ${data.objetivo} | Consumo: ${data.consumo || "a calcular"} kg MS/dia
INGREDIENTES: ${data.ingredientes || "Milho, farelo de soja, farelo de trigo, núcleo mineral"}
${data.restricoes ? `RESTRIÇÕES: ${data.restricoes}` : ""}
${data.observacoes ? `OBS: ${data.observacoes}` : ""}

Forneça a formulação seguindo a estrutura obrigatória.`;

      return { systemPrompt, userPrompt };
    }

    if (tool === "analise-produtiva") {
      const tipoUsuarioLabels: Record<string, string> = {
        "produtor": "Produtor Rural",
        "tecnico": "Técnico Agropecuário",
        "veterinario": "Médico(a) Veterinário(a)",
        "zootecnista": "Zootecnista",
        "estudante": "Estudante",
        "publico": "Público Geral"
      };
      const tipoUsuarioLabel = tipoUsuarioLabels[requestBody.tipoUsuario] || "Usuário";

      const systemPrompt = `Você é o módulo "Painel de Inteligência Produtiva" da suíte VetAgro Sustentável AI.

REGRAS DE FORMATAÇÃO — SAÍDA EM HTML:
• TODA resposta em HTML (<h2>, <h3>, <p>, <strong>, <table>, <ul>, <li>)
• PROIBIDO markdown
Base: EMBRAPA, NRC Beef Cattle, CEPEA, FAO, IPCC 2019

Perfil: ${tipoUsuarioLabel}
${requestBody.numeroConselho ? `Registro: ${requestBody.tipoUsuario === "veterinario" ? "CRMV" : "CRZ"} ${requestBody.numeroConselho}-${requestBody.ufConselho}` : ""}

ESTRUTURA (HTML):
<h2>1) IDENTIFICAÇÃO DO SISTEMA</h2>
<h2>2) DIAGNÓSTICO ZOOTÉCNICO</h2>
<h2>3) ANÁLISE ECONÔMICA</h2> (tabela)
<h2>4) GARGALOS E RISCOS</h2>
<h2>5) CENÁRIOS DE OTIMIZAÇÃO</h2>
<h2>6) ANÁLISE DE EMISSÕES (ESG)</h2>
<h2>7) PLANO DE AÇÃO</h2>
<h2>8) CONSIDERAÇÕES FINAIS</h2>
<h2>9) ALERTA LEGAL</h2>
<h2>10) REFERÊNCIAS</h2>

Data: ${dataAtual}

${plan === "free" ? "Usuário FREE. Seções 1, 8 e 9 resumidas (máximo 200 palavras)." : ""}
${plan === "pro" ? "Usuário Pro. Todas as 10 seções." : ""}
${plan === "enterprise" ? "Usuário Enterprise. Ultra-detalhada." : ""}`;

      const userPrompt = `ANÁLISE PRODUTIVA:
PERFIL: ${tipoUsuarioLabel}
${requestBody.nomeUsuario ? `Nome: ${requestBody.nomeUsuario}` : ""}
DADOS:
• Sistema: ${data.tipoSistema} | Animais: ${data.numeroAnimais} | Peso: ${data.pesoInicial || "N/I"} kg
• GMD: ${data.gmd || "N/I"} kg/dia | CA: ${data.conversaoAlimentar || "N/I"}:1
• Custo/kg: R$ ${data.custoPorKg || "N/I"} | Lotação: ${data.taxaLotacao || "N/I"} UA/ha
• Área: ${data.areaTotal || "N/I"} ha | Venda: R$ ${data.precoVenda || "N/I"}/@
• Mortalidade: ${data.mortalidade || "N/I"}% | Efic. reprod.: ${data.eficienciaReprodutiva || "N/I"}%
${data.observacoesAdicionais ? `• Obs: ${data.observacoesAdicionais}` : ""}

Gere relatório HTML com 10 seções obrigatórias.`;

      return { systemPrompt, userPrompt };
    }

    return null;
  });
});
