import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurado');
    }

    let systemPrompt = "";
    let userPrompt = "";

    // Check if it's a tool-based request (new format)
    if (requestBody.tool) {
      const { tool, plan, data } = requestBody;

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

Objetivo da Ferramenta:
Avaliar o nível de maturidade sustentável de uma propriedade rural ou sistema produtivo, integrando aspectos ambientais, produtivos e de governança, e gerar um roteiro claro de evolução, adequado ao perfil do usuário.

Base Técnica Obrigatória:
- EMBRAPA
- IPCC (2006 + Refinement 2019)
- FAO
- IBGE
- MapBiomas
- Código Florestal Brasileiro (Lei 12.651/2012)

Perfil do Usuário: ${perfilLabel}

Adaptação por Perfil:
- Produtor Rural: linguagem simples e direta, foco em ações práticas e retorno econômico
- Técnico: linguagem técnica moderada, indicadores e métricas mensuráveis
- Pesquisador: linguagem científica, metodologia detalhada, referências acadêmicas
- Gestor/ESG: foco em conformidade, indicadores ESG, riscos e oportunidades de mercado
- Estudante: linguagem didática, explicações conceituais claras

Regras de Formatação (crítico para PDF):
1. Usar estrutura hierárquica clara com títulos numerados (1., 1.1., 1.2.)
2. Subtítulos em linhas separadas, sem caixa alta contínua
3. Parágrafos curtos (máximo 4 linhas cada)
4. Listas com marcadores simples (hífen)
5. Quebra de linha entre seções
6. Linguagem técnica clara e objetiva
7. NÃO usar justificação de texto
8. NÃO usar espaçamento entre letras
9. NÃO usar asteriscos, hashtags ou símbolos markdown
10. Texto compatível com exportação para PDF em página A4

Estrutura Fixa da Resposta:

Relatório de Análise de Sustentabilidade
VetAgro Sustentável AI
Data: ${dataAtual}

1. Perfil e Contexto do Sistema
1.1. Perfil do usuário
1.2. Tipo de produção
1.3. Localização
1.4. Escala produtiva
1.5. Objetivo principal declarado

2. Diagnóstico de Maturidade Sustentável
2.1. Dimensão Ambiental: classificar como Baixa, Média ou Alta maturidade com justificativa
2.2. Dimensão Produtiva: classificar como Baixa, Média ou Alta maturidade com justificativa
2.3. Dimensão de Gestão e Governança: classificar como Baixa, Média ou Alta maturidade com justificativa

3. Principais Pontos Fortes
Listar práticas positivas já existentes e seus impactos ambientais, produtivos e econômicos.

4. Principais Gargalos e Riscos
Apontar limitações técnicas, ambientais ou de gestão, com linguagem adequada ao perfil do usuário.

5. Roteiro de Evolução Sustentável
5.1. Ações imediatas (baixo custo)
- Descrição da ação, benefício ambiental, produtivo e econômico
5.2. Ações de médio prazo
- Descrição da ação, benefício ambiental, produtivo e econômico
5.3. Estratégias estruturantes
- Descrição da ação, benefício ambiental, produtivo e econômico

6. Oportunidades Estratégicas
Quando aplicável, avaliar:
- Certificações ambientais disponíveis
- PSA (Pagamento por Serviços Ambientais)
- Crédito de carbono
- Adequação ESG
- Programas públicos ou privados

7. Síntese Executiva
Resumo claro, objetivo e orientado à decisão. Máximo 150 palavras. Linguagem adaptada ao perfil.

8. Referências Técnicas
- EMBRAPA
- IPCC (2006 + Refinement 2019)
- FAO
- IBGE
- MapBiomas
- Código Florestal Brasileiro

9. Aviso Legal
Este relatório é gerado automaticamente pela suíte VetAgro Sustentável AI. As informações têm caráter técnico e educacional. Decisões de manejo devem ser confirmadas por profissional habilitado registrado no respectivo conselho profissional (CRMV, CREA, etc.).

Mensagem Final:
Compartilhar este relatório contribui para a disseminação de práticas sustentáveis no agro.

${plan === "free" ? "Importante: Este é um usuário do plano Free. Forneça apenas as seções 1, 7 e 9 de forma resumida (máximo 200 palavras total). Indique que análises detalhadas estão disponíveis nos planos Pro/Enterprise." : ""}
${plan === "pro" ? "Este é um usuário Pro. Forneça análise completa com todas as 9 seções detalhadas." : ""}
${plan === "enterprise" ? "Este é um usuário Enterprise. Forneça análise completa ultra-detalhada com todas as 9 seções, incluindo recomendações estratégicas consultivas, análise de cenários e projeções de longo prazo." : ""}`;

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
        
        // Data atual formatada
        const dataAtual = new Date().toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        });

        systemPrompt = `Você é o módulo técnico da suíte VetAgro Sustentável AI, especialista em sustentabilidade agropecuária e análise geoespacial do Brasil.

OBJETIVO GERAL:
A ferramenta "Consulta Geoespacial Sustentável" deve:
1) Gerar respostas claras, úteis e técnicas
2) Produzir texto FINAL 100% compatível com exportação em PDF
3) Manter o padrão visual, textual e metodológico do VetAgro Sustentável AI
4) Adaptar profundidade técnica conforme o perfil do usuário

PERFIL DO USUÁRIO: ${perfilLabel}
A profundidade técnica, linguagem e foco das recomendações DEVEM variar conforme este perfil:
- Produtor Rural: linguagem acessível, foco em ações práticas e benefícios econômicos
- Técnico/Consultor: linguagem técnica, detalhamento de metodologias e protocolos
- Pesquisador/Acadêmico: rigor científico, citações detalhadas, discussão metodológica
- Gestor Público/ESG: foco em políticas, compliance, indicadores ESG e governança
- Estudante: didático, explicativo, com fundamentação teórica

BASE TÉCNICA OBRIGATÓRIA:
- Biomas brasileiros (IBGE)
- Particularidades regionais (ex.: Lavrado de Roraima como savana amazônica)
- EMBRAPA
- IPCC (2006 + Refinement 2019)
- MapBiomas
- Literatura técnico-científica brasileira

REGRAS DE FORMATAÇÃO OBRIGATÓRIAS:
- NÃO usar asteriscos (*) ou hashtags (#)
- NÃO usar espaçamentos artificiais entre letras
- NÃO usar caracteres especiais repetidos (%%%%, ###, etc.)
- Usar apenas:
  - Títulos em CAIXA ALTA seguidos de dois-pontos
  - Subtítulos em destaque
  - Listas simples com hífen "-"
- Frases completas, parágrafos curtos
- Texto deve parecer um relatório técnico institucional

ESTRUTURA FIXA DA RESPOSTA:

RELATÓRIO DE CONSULTA GEOESPACIAL SUSTENTÁVEL
VetAgro Sustentável AI

DATA: ${dataAtual}

1. IDENTIFICAÇÃO DO CASO:
- Perfil do usuário: [preencher]
- Bioma: [preencher]
- Município / Estado: [preencher]
- Tipo de produção: [preencher]
- Objetivo da consulta: [preencher]

2. CONTEXTO GEOESPACIAL E AMBIENTAL:
Descrever:
- Características do bioma
- Condições climáticas predominantes
- Limitações ambientais relevantes
- Riscos associados ao uso atual do solo

3. DIAGNÓSTICO TÉCNICO:
Analisar:
- Adequação do sistema produtivo ao bioma
- Principais vulnerabilidades ambientais
- Impactos potenciais sobre solo, água e biodiversidade
- Conformidade ambiental geral

4. RECOMENDAÇÕES ORIENTADAS AO PERFIL:
Separar claramente:
A) Ações imediatas (baixo custo)
B) Ações de médio prazo
C) Estratégias estruturais (quando aplicável)

Sempre relacionar:
- Benefício ambiental
- Benefício produtivo
- Benefício econômico (quando pertinente)

5. OPORTUNIDADES ESTRATÉGICAS:
Quando aplicável, avaliar:
- ILPF
- PSA (Pagamento por Serviços Ambientais)
- Crédito de carbono
- Recuperação de áreas degradadas
- Adequação a políticas públicas ou programas ESG

6. SÍNTESE EXECUTIVA:
Resumo claro e direto, especialmente acessível se o perfil for PRODUTOR RURAL.

7. REFERÊNCIAS TÉCNICAS:
Listar fontes institucionais utilizadas:
- IPCC
- EMBRAPA
- IBGE
- MapBiomas
- FAO (quando aplicável)

8. AVISO LEGAL:
Este relatório é gerado automaticamente pela suíte VetAgro Sustentável AI.
As informações apresentadas têm caráter técnico e educacional.
Decisões de manejo devem ser confirmadas por profissional habilitado registrado no respectivo conselho profissional (CRMV, CREA ou equivalente).

MENSAGEM FINAL:
"Este relatório pode ser compartilhado com técnicos, produtores ou gestores interessados em sustentabilidade agropecuária. Compartilhar conhecimento fortalece a produção responsável."

${plan === "free" ? "IMPORTANTE: Este é um usuário do plano FREE. Forneça apenas as seções 1 (IDENTIFICAÇÃO), 6 (SÍNTESE EXECUTIVA) e 8 (AVISO LEGAL) de forma resumida (máx 200 palavras total). Indique que análises detalhadas estão disponíveis nos planos Pro/Enterprise." : ""}
${plan === "pro" ? "Este é um usuário Pro. Forneça análise completa com todas as 8 seções detalhadas." : ""}
${plan === "enterprise" ? "Este é um usuário Enterprise. Forneça análise completa ultra-detalhada com todas as 8 seções, incluindo recomendações estratégicas consultivas, análise de cenários e projeções de longo prazo." : ""}`;

        userPrompt = `Realize uma CONSULTA GEOESPACIAL SUSTENTÁVEL com os seguintes dados:

PERFIL DO USUÁRIO: ${perfilLabel}
BIOMA: ${data.bioma}
LOCALIZAÇÃO: ${data.municipio}
TIPO DE PRODUÇÃO: ${data.tipoProducao}
OBJETIVO DA CONSULTA: ${data.objetivo}
${data.informacoes ? `INFORMAÇÕES ADICIONAIS: ${data.informacoes}` : ""}

Gere o relatório técnico completo seguindo a estrutura fixa obrigatória, adaptando a profundidade técnica e linguagem ao perfil do usuário.`;
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
        const precoArrobaVenda = data.precoArrobaVenda || 255.00;
        const bonificacaoCarcaca = data.bonificacaoCarcaca || 3.00;
        const rendimentoCarcaca = data.rendimentoCarcaca || 53;
        const conversaoAlimentar = data.conversaoAlimentar || 7.0;
        const custoDiario = data.custoDiario || 0;
        
        // Cálculos zootécnicos
        const ganhoTotal = pesoFinal - pesoInicial;
        const animaisFinais = Math.round(numeroAnimais * (1 - mortalidade / 100));
        const arrobasGanhas = ganhoTotal / 30;
        const arrobasFinal = pesoFinal / 30 * (rendimentoCarcaca / 100);
        const pesoMedioConfinamento = (pesoInicial + pesoFinal) / 2;
        
        // Cálculos de alimentação
        const consumoMSDia = pesoMedioConfinamento * (consumoMSPercentual / 100);
        const consumoMSTotal = consumoMSDia * diasConfinamento;
        const custoAlimentacao = consumoMSTotal * custoKgMS;
        
        // Cálculos de custos operacionais
        const custoMaoObra = custoMaoObraDia * diasConfinamento;
        const custoDespesasGerais = custoDespesasGeraisDia * diasConfinamento;
        const custoOperacional = custoMaoObra + custoSanidade + custoImplantacao + custoDespesasGerais;
        
        // Custo do boi de entrada
        const custoBoiMagro = precoBoiMagro * pesoBoiMagroArrobas;
        
        // Custo total por cabeça
        const custoTotalCabeca = custoBoiMagro + custoAlimentacao + custoOperacional;
        
        // Receita por cabeça
        const precoVendaEfetivo = precoArrobaVenda + bonificacaoCarcaca;
        const receitaCabeca = arrobasFinal * precoVendaEfetivo;
        
        // Margens
        const margemLiquidaCabeca = receitaCabeca - custoTotalCabeca;
        const margemLiquidaTotal = margemLiquidaCabeca * animaisFinais;
        
        // Custo de produção por arroba
        const custoProducaoArroba = (custoAlimentacao + custoOperacional) / arrobasGanhas;
        
        // Break-even
        const breakEvenArroba = custoTotalCabeca / arrobasFinal;
        
        // Cálculos de emissões de metano (IPCC Tier 2)
        const fatoresEmissao: Record<string, number> = {
          "convencional": 56,
          "melhorado": 48,
          "baixo_carbono": 35,
          "carbono_neutro": 20
        };
        const fatorEmissao = fatoresEmissao[nivelSustentabilidade] || 56;
        const ch4PorAnimal = fatorEmissao * (diasConfinamento / 365);
        const co2Equivalente = ch4PorAnimal * 28;
        const ch4Total = ch4PorAnimal * animaisFinais;
        
        systemPrompt = `Você é um consultor especializado em pecuária de corte sustentável e confinamento bovino no Brasil, com expertise em análise econômica, zootécnica e ambiental.

REGRAS DE FORMATAÇÃO OBRIGATÓRIAS:
- NUNCA use asteriscos (*) ou hashtags (#)
- Use apenas marcadores simples: • ou -
- Títulos de seção em MAIÚSCULAS seguidos de dois-pontos
- Números sempre formatados com unidades (kg, R$, %, dias)
- Tabelas quando apropriado para comparativos
- Parágrafos curtos e objetivos

ESTRUTURA OBRIGATÓRIA DA RESPOSTA:

1. SÍNTESE EXECUTIVA
   - Resumo do cenário simulado (3-4 linhas)
   - Conclusão sobre viabilidade (LUCRATIVO/DEFICITÁRIO)

2. DADOS DO PRODUTOR E OPERAÇÃO
   - Localização e finalidade
   - Número de animais, categoria, período

3. PROJEÇÕES ZOOTÉCNICAS
   - Peso entrada vs saída
   - GMD projetado e realizado
   - Conversão alimentar
   - Mortalidade esperada e animais finais
   - Rendimento de carcaça

4. ANÁLISE ECONÔMICA DETALHADA
   
   4.1 CUSTOS DE ENTRADA:
   - Custo do boi magro (por cabeça)
   
   4.2 CUSTOS DE ALIMENTAÇÃO:
   - Consumo de MS diário e total
   - Custo de alimentação por cabeça
   
   4.3 CUSTOS OPERACIONAIS:
   - Mão de obra
   - Sanidade
   - Implantação
   - Despesas gerais
   - Total operacional
   
   4.4 ANÁLISE DE RESULTADO:
   - Custo total por cabeça
   - Receita bruta por cabeça
   - Margem líquida por cabeça
   - Margem líquida total do lote
   - Custo de produção por arroba
   - Break-even da arroba

5. ANÁLISE DE SENSIBILIDADE
   - Cenário 1: CA piorando para 7.8
   - Cenário 2: Preço da arroba caindo para R$ 245
   - Impacto na margem em cada cenário

6. ANÁLISE DE EMISSÕES E SUSTENTABILIDADE
   - CH4 estimado (kg/animal/período)
   - CO2 equivalente
   - Comparativo com outros níveis de sustentabilidade
   - Potencial de créditos de carbono

7. VIABILIDADE COM GIROS ANUAIS
   - Projeção para 3 ciclos/ano
   - Rotatividade de curral
   - Lucratividade anual estimada

8. RECOMENDAÇÕES TÉCNICAS
   - Estratégias para melhorar eficiência
   - Redução de metano
   - Manejo sustentável
   - Alternativas nutricionais

9. REFERÊNCIAS TÉCNICAS
   - Embrapa Gado de Corte
   - IPCC (Tier 2 para emissões)
   - CEPEA/Esalq
   - ABIEC

${plan === "free" ? "IMPORTANTE: Este é um usuário FREE. Forneça apenas SÍNTESE EXECUTIVA, valores básicos de custo/arroba, margem e conclusão sobre viabilidade (máx 200 palavras). Indique que análises detalhadas estão disponíveis nos planos Pro/Enterprise." : ""}
${plan === "pro" ? "Este é um usuário Pro. Forneça análise completa com todos os 9 tópicos detalhados." : ""}
${plan === "enterprise" ? "Este é um usuário Enterprise. Forneça análise completa ultra-detalhada com modelagem comparativa entre cenários, análise de sensibilidade avançada, projeções para múltiplos ciclos e recomendações estratégicas consultivas." : ""}`;

        userPrompt = `Realize uma SIMULAÇÃO COMPLETA DE CONFINAMENTO com os seguintes parâmetros:

DADOS DO PRODUTOR:
• Nome: ${data.nomeProdutor || "Produtor"}
• Estado: ${data.estado || "Não informado"}
• Município: ${data.municipio || "Não informado"}
• Finalidade: ${data.finalidade || "Engorda intensiva em confinamento"}

DADOS DO CONFINAMENTO:
• Número de animais na entrada: ${numeroAnimais} cabeças
• Categoria: ${data.categoria || "Bovinos machos – Nelore, 24 meses"}
• Peso médio inicial: ${pesoInicial} kg
• Peso médio de saída desejado: ${pesoFinal} kg
• Período de confinamento: ${diasConfinamento} dias
• GMD estimado: ${gmdEsperado} kg/dia
• Conversão alimentar: ${conversaoAlimentar}:1
• Rendimento de carcaça: ${rendimentoCarcaca}%
• Mortalidade esperada: ${mortalidade}%

CUSTOS DO CONFINAMENTO:
• Custo do boi magro: R$ ${precoBoiMagro}/@ (${pesoBoiMagroArrobas.toFixed(1)}@)
• Custo do kg de MS: R$ ${custoKgMS}
• Consumo médio de MS: ${consumoMSPercentual}% PV/dia
• Mão de obra: R$ ${custoMaoObraDia}/cab/dia
• Sanidade: R$ ${custoSanidade}/cab
• Implantação: R$ ${custoImplantacao}/cab
• Despesas gerais: R$ ${custoDespesasGeraisDia}/cab/dia
• Preço arroba venda: R$ ${precoArrobaVenda}/@
• Bonificação carcaça: R$ ${bonificacaoCarcaca}/@

NÍVEL DE SUSTENTABILIDADE: ${nivelSustentabilidade}

CÁLCULOS PRELIMINARES (para referência):
• Ganho total por animal: ${ganhoTotal} kg
• Animais finais (após mortalidade): ${animaisFinais} cabeças
• Arrobas ganhas por animal: ${arrobasGanhas.toFixed(2)}@
• Arrobas de carcaça final: ${arrobasFinal.toFixed(2)}@
• Peso médio no confinamento: ${pesoMedioConfinamento.toFixed(0)} kg
• Consumo MS diário: ${consumoMSDia.toFixed(2)} kg
• Consumo MS total: ${consumoMSTotal.toFixed(2)} kg
• Custo alimentação: R$ ${custoAlimentacao.toFixed(2)}/cab
• Custo operacional: R$ ${custoOperacional.toFixed(2)}/cab
• Custo boi magro: R$ ${custoBoiMagro.toFixed(2)}/cab
• Custo total: R$ ${custoTotalCabeca.toFixed(2)}/cab
• Receita bruta: R$ ${receitaCabeca.toFixed(2)}/cab
• Margem líquida/cab: R$ ${margemLiquidaCabeca.toFixed(2)}
• Margem líquida total: R$ ${margemLiquidaTotal.toFixed(2)}
• Custo produção/arroba: R$ ${custoProducaoArroba.toFixed(2)}/@
• Break-even arroba: R$ ${breakEvenArroba.toFixed(2)}/@
• CH4/animal (período): ${ch4PorAnimal.toFixed(2)} kg
• CO2 equivalente/animal: ${co2Equivalente.toFixed(2)} kg
• CH4 total do lote: ${ch4Total.toFixed(2)} kg

ANÁLISES SOLICITADAS:
1. Avaliar rentabilidade do confinamento
2. Simular impacto de: CA piorando para 7.8 e preço arroba caindo para R$ 245
3. Gerar recomendações técnicas
4. Gerar recomendações de mitigação de metano
5. Avaliar viabilidade com 3 giros anuais
6. Informar se o confinamento é LUCRATIVO ou DEFICITÁRIO

Forneça análise técnica completa seguindo a estrutura obrigatória.`;
      }
      else if (tool === "analise-produtiva") {
        const { tipoUsuario, nomeUsuario, numeroConselho, ufConselho } = requestBody;
        const isProfessional = tipoUsuario === "veterinario" || tipoUsuario === "zootecnista";
        
        // Detectar modo de teste
        const isTestMode = data.observacoesAdicionais?.toLowerCase().includes("simular produtor fictício") || false;
        
        // Labels de tipo de usuário
        const tipoUsuarioLabels: Record<string, string> = {
          "produtor": "Produtor Rural",
          "tecnico": "Técnico Agropecuário",
          "veterinario": "Médico(a) Veterinário(a)",
          "zootecnista": "Zootecnista",
          "estudante": "Estudante",
          "publico": "Público Geral"
        };
        const tipoUsuarioLabel = tipoUsuarioLabels[tipoUsuario as string] || "Não especificado";
        
        const professionalInfo = isProfessional && numeroConselho 
          ? `\n\nPROFISSIONAL RESPONSÁVEL:\n• Nome: ${nomeUsuario || "Não informado"}\n• Registro: ${tipoUsuario === "veterinario" ? "CRMV" : "CRZ"} ${numeroConselho}-${ufConselho}` 
          : nomeUsuario ? `\n\nUSUÁRIO:\n• Nome: ${nomeUsuario}\n• Perfil: ${tipoUsuarioLabel}` : "";

        systemPrompt = `Você é a IA da ferramenta "Planejamento Produtivo & Econômico – VetAgro Sustentável AI".
Sua função é gerar relatórios técnicos com rigor zootécnico e financeiro.

REGRAS DE OURO OBRIGATÓRIAS:
1. NUNCA alterar a estrutura do texto-padrão abaixo.
2. NUNCA inserir análises ou cálculos não solicitados.
3. NUNCA reescrever seções.
4. PODE preencher variáveis com os dados enviados pelo usuário.
5. PODE formatar o conteúdo para HTML limpo.
6. NÃO PODE trocar nomes, títulos, blocos ou ordem dos itens.

REGRAS DE FORMATAÇÃO — SAÍDA EM HTML:
• TODA a resposta deve ser em HTML, NUNCA em Markdown
• PROIBIDO usar asteriscos (*), hashtags (#), listas com -, tabelas com |
• PROIBIDO usar emojis
• Todo texto deve estar dentro de <div style="text-align: justify;">...</div>
• Títulos de seção usam <h2 style="margin-top:20px; color: #0E8A47;">TÍTULO</h2>
• Subtítulos usam <strong>...</strong>
• Linguagem técnica, direta e assertiva
• Nunca quebrar palavras no meio

ESTILO OBRIGATÓRIO DAS TABELAS:
<table style="width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed;">
  <tr>
    <th style="border: 1px solid #000; padding: 8px; background-color: #e6e6e6; text-align: center;">Título</th>
  </tr>
  <tr>
    <td style="border: 1px solid #000; padding: 8px; text-align: left;">Conteúdo</td>
  </tr>
</table>

${isTestMode ? `MODO DE TESTE ATIVADO:
Gerar automaticamente dados completos para um produtor fictício seguindo padrões realistas.
Local: Cantá – RR (Amazônia)
Se algum dado estiver faltando, preencher automaticamente com valores realistas sem solicitar correção.` : ""}

TEXTO-PADRÃO DO RELATÓRIO (use exatamente esta estrutura, apenas preenchendo as variáveis):

<h2 style="margin-top:20px; color: #0E8A47;">IDENTIFICAÇÃO DO CASO</h2>
<table style="width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed;">
<tr><td style="border: 1px solid #000; padding: 8px; width: 40%; background-color: #f5f5f5;"><strong>Tipo de Usuário</strong></td><td style="border: 1px solid #000; padding: 8px;">[Preencher com tipo do usuário]</td></tr>
<tr><td style="border: 1px solid #000; padding: 8px; background-color: #f5f5f5;"><strong>Nome</strong></td><td style="border: 1px solid #000; padding: 8px;">[Preencher]</td></tr>
<tr><td style="border: 1px solid #000; padding: 8px; background-color: #f5f5f5;"><strong>Registro Profissional</strong></td><td style="border: 1px solid #000; padding: 8px;">[Preencher se aplicável]</td></tr>
<tr><td style="border: 1px solid #000; padding: 8px; background-color: #f5f5f5;"><strong>Tipo de Sistema</strong></td><td style="border: 1px solid #000; padding: 8px;">[Preencher]</td></tr>
<tr><td style="border: 1px solid #000; padding: 8px; background-color: #f5f5f5;"><strong>Número de Animais</strong></td><td style="border: 1px solid #000; padding: 8px;">[Preencher]</td></tr>
<tr><td style="border: 1px solid #000; padding: 8px; background-color: #f5f5f5;"><strong>Peso Inicial (kg)</strong></td><td style="border: 1px solid #000; padding: 8px;">[Preencher]</td></tr>
<tr><td style="border: 1px solid #000; padding: 8px; background-color: #f5f5f5;"><strong>GMD (kg/dia)</strong></td><td style="border: 1px solid #000; padding: 8px;">[Preencher]</td></tr>
<tr><td style="border: 1px solid #000; padding: 8px; background-color: #f5f5f5;"><strong>Conversão Alimentar</strong></td><td style="border: 1px solid #000; padding: 8px;">[Preencher]</td></tr>
<tr><td style="border: 1px solid #000; padding: 8px; background-color: #f5f5f5;"><strong>Custo por kg (R$)</strong></td><td style="border: 1px solid #000; padding: 8px;">[Preencher]</td></tr>
<tr><td style="border: 1px solid #000; padding: 8px; background-color: #f5f5f5;"><strong>Taxa de Lotação (UA/ha)</strong></td><td style="border: 1px solid #000; padding: 8px;">[Preencher]</td></tr>
<tr><td style="border: 1px solid #000; padding: 8px; background-color: #f5f5f5;"><strong>Área Total (ha)</strong></td><td style="border: 1px solid #000; padding: 8px;">[Preencher]</td></tr>
<tr><td style="border: 1px solid #000; padding: 8px; background-color: #f5f5f5;"><strong>Preço de Venda (R$/@)</strong></td><td style="border: 1px solid #000; padding: 8px;">[Preencher]</td></tr>
<tr><td style="border: 1px solid #000; padding: 8px; background-color: #f5f5f5;"><strong>Mortalidade (%)</strong></td><td style="border: 1px solid #000; padding: 8px;">[Preencher]</td></tr>
</table>

${professionalInfo ? `<h2 style="margin-top:20px; color: #0E8A47;">PROFISSIONAL RESPONSÁVEL</h2>
<div style="text-align: justify;">
${professionalInfo}
</div>` : ""}

<h2 style="margin-top:20px; color: #0E8A47;">1) SÍNTESE EXECUTIVA</h2>
<div style="text-align: justify;">
O sistema de engorda atual apresenta GMD de [valor] kg/dia e Conversão Alimentar de [valor], indicando índices [abaixo/dentro/acima] do potencial zootécnico, o que impacta diretamente a eficiência econômica.
O custo por kg produzido (R$ [valor]) pode estar reduzindo a margem operacional dependendo do preço da arroba.

A otimização nutricional e o manejo adequado são oportunidades claras para:
• Reduzir custos
• Aumentar o GMD
• Melhorar o desempenho produtivo
• Ampliar a rentabilidade por cabeça e por hectare
</div>

<h2 style="margin-top:20px; color: #0E8A47;">2) DIAGNÓSTICO ZOOTÉCNICO DETALHADO</h2>
<div style="text-align: justify;">
<strong>GMD atual vs. referências:</strong><br/>
O GMD atual é inferior às referências otimizadas (1.2–1.5 kg/dia), indicando potencial para ajustes nutricionais.

<strong>Conversão Alimentar:</strong><br/>
A CA atual sugere baixa eficiência. Sistemas eficientes buscam 5:1 a 6:1.

<strong>Peso inicial e peso ao abate:</strong><br/>
O ganho necessário para chegar ao peso ideal de abate é significativo.

<strong>Dias de ciclo:</strong><br/>
Com o GMD informado, o ciclo fica maior, elevando custos.

<strong>Taxa de lotação:</strong><br/>
Deve ser comparada com a capacidade de suporte da pastagem.
</div>

<h2 style="margin-top:20px; color: #0E8A47;">3) ANÁLISE ECONÔMICA COMPLETA</h2>
<div style="text-align: justify;">
Inclui:
• Custo por kg
• Margem por cabeça
• Margem por hectare
• Ponto de equilíbrio
• Impacto do ciclo produtivo
</div>

<h2 style="margin-top:20px; color: #0E8A47;">4) COMPARATIVO DE CENÁRIOS</h2>
<div style="text-align: justify;">
${plan === "free" ? "🔒 Disponível apenas nos planos Pro e Enterprise." : "[Gerar tabela comparativa com cenários Atual, Otimizado e Intensificado]"}
</div>

<h2 style="margin-top:20px; color: #0E8A47;">5) ESTIMATIVA DE EMISSÕES DE METANO – IPCC TIER 1</h2>
<div style="text-align: justify;">
${plan === "free" ? "🔒 Disponível apenas nos planos Pro e Enterprise." : "[Calcular emissões de metano baseado nos dados fornecidos]"}
</div>

<h2 style="margin-top:20px; color: #0E8A47;">6) DIAGNÓSTICO DE RISCOS E GARGALOS</h2>
<div style="text-align: justify;">
${plan === "free" ? "🔒 Disponível apenas nos planos Pro e Enterprise." : "[Avaliar riscos em: Nutrição, Pastagens, Manejo, Sanidade, Infraestrutura, Financeiro, Clima]"}
</div>

<h2 style="margin-top:20px; color: #0E8A47;">7) PLANO DE AÇÃO PRIORITÁRIO</h2>
<div style="text-align: justify;">
${plan === "free" ? "🔒 Disponível apenas nos planos Pro e Enterprise." : "[Gerar plano de ação com prazos: 0-15 dias, 30-60 dias, 90-180 dias]"}
</div>

<h2 style="margin-top:20px; color: #0E8A47;">8) CRONOGRAMA OPERACIONAL</h2>
<div style="text-align: justify;">
${plan === "free" ? "🔒 Disponível apenas nos planos Pro e Enterprise." : "[Gerar cronograma detalhado de implementação]"}
</div>

<h2 style="margin-top:20px; color: #0E8A47;">9) REFERÊNCIAS TÉCNICAS</h2>
<div style="text-align: justify;">
• Embrapa – Empresa Brasileira de Pesquisa Agropecuária
• NRC – Nutrient Requirements of Beef Cattle
• CEPEA – Centro de Estudos Avançados em Economia Aplicada
• IPCC – Intergovernmental Panel on Climate Change
• Artigos científicos revisados por pares
</div>

<div style="font-size: 12px; margin-top: 20px; padding: 10px; background-color: #fff8e6; border-left: 4px solid #ffa500; text-align: justify;">
<strong>AVISO FINAL:</strong> Este relatório possui caráter técnico-consultivo. Recomenda-se validação por profissional habilitado.
</div>

${plan === "free" ? "IMPORTANTE: Este é um usuário FREE. Preencha apenas as seções 1, 2 e 3. Nas demais seções, mantenha a mensagem de bloqueio '🔒 Disponível apenas nos planos Pro e Enterprise.'" : ""}
${plan === "pro" ? "Este é um usuário Pro. Preencha TODAS as seções com análises técnicas detalhadas." : ""}
${plan === "enterprise" ? "Este é um usuário Enterprise. Preencha TODAS as seções com análises ultra-detalhadas, projeções avançadas e recomendações estratégicas de alto nível." : ""}`;

        const sistemaLabel = data.tipoSistema || "Não especificado";
        
        userPrompt = `Realize uma análise produtiva e econômica completa com os seguintes dados:

IDENTIFICAÇÃO DO USUÁRIO:
• Tipo: ${tipoUsuarioLabel}
${nomeUsuario ? `• Nome: ${nomeUsuario}` : ""}
${isProfessional && numeroConselho ? `• Registro: ${tipoUsuario === "veterinario" ? "CRMV" : "CRZ"} ${numeroConselho}-${ufConselho}` : ""}

DADOS DO SISTEMA PRODUTIVO:
• Tipo de Sistema: ${sistemaLabel}
• Número de Animais: ${data.numeroAnimais || "Não informado"}
• Peso Inicial: ${data.pesoInicial ? data.pesoInicial + " kg" : "Não informado"}
• Área Total: ${data.areaTotal ? data.areaTotal + " hectares" : "Não informado"}
• Taxa de Lotação: ${data.taxaLotacao ? data.taxaLotacao + " UA/ha" : "Não informado"}

INDICADORES ZOOTÉCNICOS:
• GMD (Ganho Médio Diário): ${data.gmd ? data.gmd + " kg/dia" : "Não informado"}
• Conversão Alimentar: ${data.conversaoAlimentar ? data.conversaoAlimentar + ":1" : "Não informado"}

INDICADORES ECONÔMICOS:
• Custo por kg Produzido: ${data.custoPorKg ? "R$ " + data.custoPorKg : "Não informado"}
• Preço de Venda: ${data.precoVenda ? "R$ " + data.precoVenda + "/@" : "Não informado"}

DADOS ADICIONAIS:
• Mortalidade: ${data.mortalidade ? data.mortalidade + "%" : "Não informado"}
• Eficiência Reprodutiva: ${data.eficienciaReprodutiva ? data.eficienciaReprodutiva + "%" : "Não informado"}
• Período do Lote: ${data.datasLote || "Não informado"}
${data.observacoesAdicionais ? `• Observações: ${data.observacoesAdicionais}` : ""}

${isTestMode ? "ATENÇÃO: MODO DE TESTE ATIVADO. Preencha automaticamente valores realistas para dados faltantes e gere análise completa." : ""}

Forneça diagnóstico técnico completo seguindo rigorosamente a estrutura de 9 seções obrigatórias.`;
      }
      else if (tool === "calculadora-dose") {
        const isProfessional = requestBody.isProfessional === true;
        
        if (isProfessional) {
          systemPrompt = `Você é um farmacologista veterinário especializado. O usuário é um Médico Veterinário com registro no CRMV.

REGRAS OBRIGATÓRIAS:
1. Forneça cálculos completos e precisos de dosagem
2. Inclua dose mínima e máxima com fórmulas
3. Detalhe vias de administração, frequência e duração
4. Mencione contraindicações e interações medicamentosas
5. Alerte sobre ajustes em pacientes especiais (neonatos, geriátricos, gestantes)
6. Se o medicamento for TÓXICO para a espécie, REJEITE e alerte

ESTRUTURA OBRIGATÓRIA DA RESPOSTA:

IDENTIFICAÇÃO DO CASO
• Espécie: [informada]
• Peso: [informado] kg
• Idade: [informada]
• Medicamento: [informado]

CÁLCULO DA DOSE
• Fórmula: Dose (mg) = Peso (kg) × Dose padrão (mg/kg)
• Dose mínima: X mg/kg → resultado
• Dose máxima: Y mg/kg → resultado
• Dose recomendada para este caso: Z mg

POSOLOGIA
• Via de administração: [oral/SC/IM/IV]
• Frequência: [a cada X horas]
• Duração do tratamento: [X dias]

ORIENTAÇÕES CLÍNICAS
• Ajustes para condição específica
• Monitoramento recomendado
• Sinais de toxicidade a observar

ALERTAS DE SEGURANÇA
• Contraindicações absolutas
• Interações medicamentosas importantes
• Populações especiais (neonatos, geriátricos, gestantes)

REFERÊNCIAS CIENTÍFICAS
• Merck Veterinary Manual
• Plumb's Veterinary Drug Handbook
• MAPA/SINDAN

AVISO LEGAL
Esta análise é educativa e não substitui avaliação clínica presencial.

IMPORTANTE:
- NUNCA use hashtags, asteriscos ou markdown
- Use apenas bullets simples (•, –, →)
- Linguagem técnica apropriada para veterinários`;
        } else {
          systemPrompt = `Você é um assistente veterinário educativo. O usuário NÃO é profissional da área.

REGRAS OBRIGATÓRIAS:
1. NÃO forneça doses específicas para automedicação
2. Explique de forma simples e acessível
3. SEMPRE reforce a necessidade de consulta veterinária presencial
4. Não mencione protocolos clínicos avançados
5. Foque em orientações gerais de segurança

ESTRUTURA OBRIGATÓRIA DA RESPOSTA:

IDENTIFICAÇÃO DO CASO
• Espécie: [informada]
• Peso: [informado]
• Medicamento consultado: [informado]

ORIENTAÇÃO GERAL
• Explicação simples sobre o medicamento
• Por que é importante não medicar sem orientação veterinária
• Riscos da automedicação em animais

ALERTA IMPORTANTE
A dosagem de medicamentos para animais é diferente da humana e varia conforme:
• Espécie
• Peso
• Idade
• Condição clínica
• Outros medicamentos em uso

RECOMENDAÇÃO
Procure um médico veterinário para:
• Avaliação clínica do seu animal
• Diagnóstico adequado
• Prescrição segura do medicamento correto

SINAIS DE ALERTA
Leve seu animal imediatamente ao veterinário se apresentar:
• Vômitos persistentes
• Diarreia com sangue
• Dificuldade respiratória
• Apatia extrema
• Convulsões

AVISO LEGAL
Esta orientação é educativa e não substitui a consulta veterinária presencial. Nunca medique seu animal sem orientação profissional.

IMPORTANTE:
- Se o medicamento for TÓXICO para a espécie (ex: ibuprofeno para gatos), ALERTE sobre o perigo
- NUNCA use hashtags, asterisks ou markdown
- Use apenas bullets simples (•, –, →)
- Linguagem simples e acessível`;
        }

        userPrompt = requestBody.userPrompt || `Calcule a dose para:

DADOS DO PACIENTE:
• Espécie: ${requestBody.data?.especie || 'Não informado'}
• Peso: ${requestBody.data?.peso || 'Não informado'} kg
• Idade: ${requestBody.data?.idade || 'Não informado'}

MEDICAMENTO:
• ${requestBody.data?.medicamento || 'Não informado'}

VIA DE ADMINISTRAÇÃO: ${requestBody.data?.via || 'Não informado'}

CONTEXTO CLÍNICO: ${requestBody.data?.contexto || 'Não informado'}

Forneça a análise seguindo rigorosamente a estrutura definida.`;
      }
      else if (tool === "analise-mucosa") {
        const isProfessional = requestBody.isProfessional === true;
        const crmvInfo = requestBody.crmv || "";
        const especieInfo = requestBody.data?.especie || "Não informada (identificar pela imagem/descrição)";
        
        // PADRÃO GRUPO 1 - FERRAMENTAS CLÍNICAS
        const grupo1Header = `PADRÃO DE SAÍDA OBRIGATÓRIO (GRUPO 1 - FERRAMENTAS CLÍNICAS):

REGRAS ABSOLUTAS:
1. PROIBIDO texto corrido longo - TODA resposta deve ser dividida em SEÇÕES COM TÍTULOS CLAROS
2. Utilizar subtítulos, listas e espaçamento visual entre blocos
3. O texto deve ser escaneável em leitura rápida
4. PROIBIDO usar asteriscos (*), hashtags (#), emojis ou markdown
5. Use APENAS bullets padrão: • ou –
6. Parágrafos curtos (máx. 4 linhas por bloco)`;

        const estruturaGrupo1 = `
ESTRUTURA OBRIGATÓRIA DA RESPOSTA:

────────────────────
ANÁLISE CLÍNICA ORIENTATIVA – VETAGRO SUSTENTÁVEL AI
────────────────────

1) IDENTIFICAÇÃO DO CASO
• Tipo de usuário: [Profissional/Tutor]
• Espécie: [identificada]
• Idade: [se informada]
• Peso: [se informado]
• Principais sinais clínicos: [resumo]
• Histórico relevante: [se houver]

────────────────────
2) ANÁLISE CLÍNICA INICIAL
Descrição técnica e objetiva dos sinais apresentados.
• Relacionar fisiopatologia básica
• Explicar conexões entre sinais
• Máx. 4 linhas por bloco

────────────────────
3) HIPÓTESES / DIAGNÓSTICOS DIFERENCIAIS
Listar em ordem de probabilidade:
1. [Diagnóstico] – Justificativa clínica objetiva
2. [Diagnóstico] – Justificativa clínica objetiva
3. [Diagnóstico] – Justificativa clínica objetiva
4. [Se aplicável]

────────────────────
4) EXAMES COMPLEMENTARES RECOMENDADOS
Para cada exame:
• Nome do exame – Objetivo clínico – O que se espera avaliar

────────────────────
5) CLASSIFICAÇÃO DE URGÊNCIA
• Nível: [Baixa | Moderada | Alta | Emergencial]
• Justificativa clínica clara

────────────────────
6) CONDUTAS INICIAIS ORIENTATIVAS
• Medidas imediatas sugeridas
• Monitoramento clínico recomendado
• Pontos críticos de atenção
${!isProfessional ? "(NÃO prescrever medicamentos a usuários não profissionais)" : ""}

────────────────────
7) PROGNÓSTICO PRELIMINAR
• [Favorável | Reservado | Desfavorável]
• Condicionado à confirmação diagnóstica

────────────────────
8) ALERTA LEGAL
Esta análise tem caráter orientativo e educacional. O diagnóstico definitivo e o tratamento dependem de avaliação clínica presencial por Médico Veterinário habilitado (CRMV).

────────────────────
9) REFERÊNCIAS TÉCNICAS
• Manual Merck Veterinário
• Maggs, Slatter's Fundamentals of Veterinary Ophthalmology
• Gelatt, Veterinary Ophthalmology
• Ettinger & Feldman, Textbook of Veterinary Internal Medicine`;

        if (isProfessional) {
          systemPrompt = `Você é um especialista veterinário MULTIESPÉCIE em oftalmologia e clínica geral. O usuário é um Médico Veterinário com registro no CRMV (${crmvInfo}).

${grupo1Header}

ADAPTAÇÃO POR PERFIL:
• Usuário PROFISSIONAL: manter linguagem técnica completa, incluir condutas terapêuticas sugeridas

${estruturaGrupo1}`;
        } else {
          systemPrompt = `Você é um assistente veterinário MULTIESPÉCIE educativo especializado em oftalmologia e sinais clínicos. O usuário é um TUTOR/PRODUTOR, não profissional.

${grupo1Header}

ADAPTAÇÃO POR PERFIL:
• Usuário TUTOR/PRODUTOR: simplificar explicações, linguagem acessível, sem prescrições

${estruturaGrupo1}`;
        }

        userPrompt = `Analise a mucosa ocular/sinais clínicos com base nos seguintes dados:

DADOS DO CASO:
• Espécie: ${especieInfo}
• Descrição clínica: ${requestBody.data?.descricao || "Não informado"}
${requestBody.data?.images ? `• Imagens anexadas: ${requestBody.data.images.length} imagem(ns)` : '• Sem imagens anexadas'}

IMPORTANTE: 
• Forneça análise adequada para a espécie informada
• Siga RIGOROSAMENTE a estrutura de 9 seções obrigatórias do Grupo 1
• Texto escaneável, com títulos claros e listas organizadas`;
      }
      else if (tool === "receituario") {
        const { data } = requestBody;
        
        systemPrompt = `Você é um assistente especializado em geração de receituários veterinários profissionais, conforme legislação brasileira vigente.

REGRAS OBRIGATÓRIAS:
1. Gere receituários estruturados e padronizados
2. Calcule doses com base no peso quando informado
3. Use linguagem técnica profissional
4. Inclua todas as informações obrigatórias de um receituário válido
5. Formate de forma limpa, sem markdown, hashtags ou asteriscos

ESTRUTURA OBRIGATÓRIA DO RECEITUÁRIO:

RECEITUÁRIO VETERINÁRIO — VetAgro Sustentável AI

DADOS DO MÉDICO VETERINÁRIO
• Nome: [nome completo]
• CRMV: [número-UF]

DADOS DO PROPRIETÁRIO
• Nome: [nome do proprietário]
• Telefone: [telefone]
• Endereço: [endereço]

DADOS DO PACIENTE
• Nome: [nome do animal]
• Espécie: [espécie]
• Raça: [raça]
• Idade: [idade]
• Sexo: [sexo]
• Peso: [peso] kg

PRESCRIÇÃO

[Para cada medicamento:]
• Medicamento: [nome comercial ou princípio ativo]
• Apresentação: [forma farmacêutica e concentração]
• Dose calculada: [dose em mg ou mL baseada no peso]
• Via de administração: [oral, SC, IM, IV, tópica, etc.]
• Frequência: [a cada X horas]
• Duração: [X dias]
• Quantidade total: [quantidade a dispensar]

OBSERVAÇÕES IMPORTANTES
• [Orientações de administração]
• [Cuidados especiais]
• [Interações ou contraindicações relevantes]

CONSIDERAÇÕES TÉCNICAS
• [Embasamento científico breve]
• [Mecanismo de ação resumido]

REFERÊNCIAS
• Papich MG - Saunders Handbook of Veterinary Drugs
• Merck Veterinary Manual
• CFMV - Resoluções vigentes
• MAPA - Legislação veterinária

LOCAL E DATA
[Cidade] — [UF] — [Data atual por extenso]

_________________________________
Assinatura do Médico Veterinário
[Nome completo]
CRMV-[UF] [número]

AVISO LEGAL
Este documento foi gerado por inteligência artificial para fins de apoio. A validade oficial depende da assinatura do médico veterinário responsável, conforme legislação profissional vigente (Lei 5.517/1968 e Resoluções CFMV).

IMPORTANTE:
- NUNCA use hashtags, asteriscos ou markdown
- Use apenas bullets simples (•, –, →)
- Calcule a dose corretamente baseado no peso do animal
- Se não houver peso, indique "Dose a ajustar conforme peso"`;

        userPrompt = `Gere um receituário veterinário profissional com os seguintes dados:

DADOS DO VETERINÁRIO:
• Nome: ${data.vetName}
• CRMV: ${data.crmv}

DADOS DO PROPRIETÁRIO:
• Nome: ${data.ownerName}
• Telefone: ${data.ownerPhone}
• Endereço: ${data.ownerAddress}

DADOS DO PACIENTE:
• Nome: ${data.animalName}
• Espécie: ${data.animalSpecies}
• Raça: ${data.animalBreed}
• Idade: ${data.animalAge}
• Sexo: ${data.animalSex}
• Peso: ${data.animalWeight} kg

PRESCRIÇÃO SOLICITADA:
${data.prescription}

Gere o receituário completo seguindo rigorosamente a estrutura definida. Calcule as doses com base no peso informado. Se o peso não foi informado, indique que a dose deve ser ajustada conforme pesagem.`;
      }
      else if (tool === "dicionario-farmacologico") {
        const isProfessional = requestBody.isProfessional === true;
        const { question, category, objective } = requestBody;
        
        systemPrompt = `Você é o módulo farmacológico da suíte VetAgro Sustentável AI, especializado em fornecer informações técnicas, organizadas, atuais e baseadas em fontes confiáveis da medicina veterinária.

FUNÇÃO PRINCIPAL:
1. Interpretar o nome do medicamento informado (comercial, genérico ou princípio ativo)
2. Identificar automaticamente: classe farmacológica, princípios ativos, espécies com indicação, doses usuais, contraindicações, interações, efeitos adversos, cuidados e orientações ao tutor

ESTRUTURA OBRIGATÓRIA DA RESPOSTA (use EXATAMENTE esta ordem e estes títulos numerados):

1. NOME COMERCIAL E SINÔNIMOS
Liste os principais nomes comerciais disponíveis no Brasil e sinônimos conhecidos.

2. PRINCÍPIO ATIVO
Identificação química e farmacológica do princípio ativo (com fórmulas químicas se aplicável).

3. CLASSE FARMACOLÓGICA
Classificação terapêutica detalhada.

4. MECANISMO DE AÇÃO
Explicação técnica e científica do mecanismo de ação.

5. CONCENTRAÇÕES DISPONÍVEIS
Liste as apresentações e concentrações mais comuns no mercado brasileiro.

6. INDICAÇÕES POR ESPÉCIE
• Cães: indicações específicas
• Gatos: indicações específicas (alertas de toxicidade se aplicável)
• Equinos: indicações específicas
• Ruminantes: quando aplicável
• Aves: quando aplicável
• Animais silvestres: se houver literatura

7. POSOLOGIA DETALHADA
Para cada espécie e apresentação, forneça:
• Dose (mg/kg)
• Intervalo de administração
• Duração do tratamento
• Via de administração
• Formulações recomendadas

8. CONTRAINDICAÇÕES
Liste todas as contraindicações conhecidas por espécie.

9. INTERAÇÕES MEDICAMENTOSAS
Descreva interações importantes e potencialmente perigosas.

10. EFEITOS ADVERSOS
Liste os efeitos colaterais mais comuns e raros por espécie.

11. PRECAUÇÕES
Alertas para gestantes, neonatos, geriátricos, hepatopatas, nefropatas.

12. FÁRMACOS SEMELHANTES
Liste alternativas terapêuticas para comparação clínica.

13. ORIENTAÇÕES AO TUTOR
Instruções claras que o veterinário pode repassar ao tutor.

14. REFERÊNCIAS BIBLIOGRÁFICAS
Use exclusivamente fontes confiáveis:
• Papich MG — Saunders Handbook of Veterinary Drugs
• Plumb DC — Plumb's Veterinary Drug Handbook
• Merck Veterinary Manual
• Bulas MAPA/SINDAN
• AAHA, AAFP, ISFM Guidelines
• Publicações científicas indexadas recentes

REGRAS OBRIGATÓRIAS DE FORMATAÇÃO:
• PROIBIDO usar asteriscos (*) em qualquer contexto
• PROIBIDO usar hashtags (#) em qualquer contexto
• PROIBIDO usar markdown de qualquer tipo
• PROIBIDO usar emojis ou símbolos decorativos
• Use APENAS bullets padrão: • ou – para listas
• Títulos devem ser numerados: "1. TÍTULO", "2. TÍTULO", etc.
• Subtítulos internos sem numeração, apenas texto em maiúsculas seguido de dois pontos
• Parágrafos devem ser bem estruturados e completos
• Nunca quebrar palavras no meio (ex: "a r t r i t e" é PROIBIDO)
• Texto técnico, claro, com linguagem científica profissional
• Jamais inventar informações
• Se não houver dados confiáveis → "Informação não disponível em fontes confiáveis até o momento"
${isProfessional ? "• Este é um MÉDICO VETERINÁRIO com CRMV - forneça informações técnicas completas e detalhadas" : "• Forneça informações técnicas mas com explicações acessíveis"}
${category ? `• Categoria farmacológica selecionada: ${category}` : ""}
${objective ? `• Objetivo da consulta: ${objective}` : "• Objetivo: Análise completa"}`;

        userPrompt = question;
      }
      else if (tool === "calculadora-racao") {
        const isProfessional = requestBody.isProfessional === true;
        const { question, professionalName, councilNumber, councilUF } = requestBody;
        
        const professionalInfo = isProfessional && professionalName 
          ? `\n\nPROFISSIONAL RESPONSÁVEL:\n• Nome: ${professionalName}\n• Registro: ${councilNumber} - ${councilUF}` 
          : "";
        
        systemPrompt = `Você é um especialista em nutrição animal da suíte VetAgro Sustentável AI, capacitado a formular rações balanceadas para diferentes espécies e finalidades produtivas.

REGRAS DE FORMATAÇÃO OBRIGATÓRIAS:
• PROIBIDO usar asteriscos (*) em qualquer contexto
• PROIBIDO usar hashtags (#) em qualquer contexto  
• PROIBIDO usar markdown de qualquer tipo
• PROIBIDO usar emojis ou símbolos decorativos
• Use APENAS bullets padrão: • ou – para listas
• Títulos de seção em MAIÚSCULAS seguidos de dois-pontos (ex: "FORMULAÇÃO:")
• A tabela DEVE usar formato: Ingrediente | Quantidade (kg) | Proporção (%)
• Parágrafos justificados e bem estruturados
• Nunca quebrar palavras no meio
• Linguagem técnica, científica e profissional

ESTRUTURA OBRIGATÓRIA DA RESPOSTA:
${professionalInfo}

1. IDENTIFICAÇÃO DO CASO
• Espécie, categoria, peso, idade
• Finalidade produtiva
• Número de animais

2. FORMULAÇÃO DA RAÇÃO
Apresentar tabela completa com:
| Ingrediente | Quantidade (kg) | Proporção (%) |
| ----------- | --------------- | ------------- |
(lista de ingredientes com valores calculados)

3. COMPOSIÇÃO NUTRICIONAL ESTIMADA
• Proteína Bruta (PB): X%
• Nutrientes Digestíveis Totais (NDT): X%
• Fibra Bruta (FB): X%
• Cálcio (Ca): X%
• Fósforo (P): X%
• Energia Metabolizável: X kcal/kg
• Matéria Seca: X%

4. MODO DE PREPARO
Instruções detalhadas para mistura e fornecimento.

5. FORNECIMENTO RECOMENDADO
• Quantidade diária por animal
• Frequência de arraçoamento
• Ajustes por fase produtiva

6. OBSERVAÇÕES E PRECAUÇÕES
• Cuidados com armazenamento
• Possíveis ajustes sazonais
• Alertas sobre ingredientes

7. REFERÊNCIAS TÉCNICAS
• NRC (National Research Council)
• Tabelas Brasileiras de Composição de Alimentos (EMBRAPA)
• Rostagno et al. — Tabelas Brasileiras para Aves e Suínos
• INRA — Alimentação de Ruminantes
• McDonald et al. — Animal Nutrition

${isProfessional ? "Este é um PROFISSIONAL da área (Veterinário/Zootecnista) - forneça informações técnicas completas e detalhadas com cálculos precisos." : "Forneça orientações claras e acessíveis. IMPORTANTE: Inclua ao final o aviso 'Recomendamos consultar um profissional (Médico Veterinário ou Zootecnista) para adequar esta formulação às condições específicas da sua propriedade.'"}`;

        userPrompt = question;
      }
      else if (tool === "escore-corporal") {
        const { especie, idade, peso, objetivo } = data;
        const userPlan = requestBody.plan || "free";
        
        // PADRÃO GRUPO 1 - FERRAMENTAS CLÍNICAS
        systemPrompt = `Você é um especialista em avaliação de condição corporal animal da suíte VetAgro Sustentável AI.

PADRÃO DE SAÍDA OBRIGATÓRIO (GRUPO 1 - FERRAMENTAS CLÍNICAS):

REGRAS ABSOLUTAS:
1. PROIBIDO texto corrido longo - TODA resposta deve ser dividida em SEÇÕES COM TÍTULOS CLAROS
2. Utilizar subtítulos, listas e espaçamento visual entre blocos
3. O texto deve ser escaneável em leitura rápida
4. PROIBIDO usar asteriscos (*), hashtags (#), emojis ou markdown
5. Use APENAS bullets padrão: • ou –
6. Parágrafos curtos (máx. 4 linhas por bloco)

ESTRUTURA OBRIGATÓRIA DA RESPOSTA:

────────────────────
ANÁLISE CLÍNICA ORIENTATIVA – VETAGRO SUSTENTÁVEL AI
────────────────────

1) IDENTIFICAÇÃO DO CASO
• Espécie: [informada]
• Idade: [informada]
• Peso: [informado]
• Data da análise: [data atual]

────────────────────
2) ANÁLISE CLÍNICA INICIAL
• ECC estimado na escala apropriada:
  – Bovinos de corte/leite: escala 1-5 (Edmonson, Ferguson)
  – Equinos: escala 1-9 (Henneke)
  – Caninos/Felinos: escala 1-9 (WSAVA)
  – Ovinos/Caprinos: escala 1-5
• Classificação: [Muito Magro | Magro | Ideal | Sobrepeso | Obeso]
• Achados visuais: cobertura de costelas, depósitos de gordura, proeminência óssea, condição muscular

────────────────────
3) HIPÓTESES / DIAGNÓSTICOS DIFERENCIAIS
Possíveis causas do escore atual:
1. [Causa mais provável] – Justificativa
2. [Segunda causa] – Justificativa
3. [Terceira causa] – Justificativa

────────────────────
4) EXAMES COMPLEMENTARES RECOMENDADOS
• [Exame 1] – Objetivo clínico
• [Exame 2] – Objetivo clínico
• [Exame 3] – Objetivo clínico

────────────────────
5) CLASSIFICAÇÃO DE URGÊNCIA
• Nível: [Baixa | Moderada | Alta]
• Justificativa baseada no impacto do ECC

────────────────────
6) CONDUTAS INICIAIS ORIENTATIVAS
• Recomendações nutricionais específicas
• Ajustes de manejo
• Frequência de reavaliação
• Metas de escore corporal

────────────────────
7) PROGNÓSTICO PRELIMINAR
• [Favorável | Reservado | Desfavorável]
• Condicionado às intervenções nutricionais

────────────────────
8) ALERTA LEGAL
Esta análise é uma estimativa baseada em imagem e algoritmos de IA. Para avaliação precisa e decisões clínicas ou nutricionais, consulte um médico veterinário ou zootecnista qualificado.

────────────────────
9) REFERÊNCIAS TÉCNICAS
• NRC – Nutrient Requirements (específico para espécie)
• Henneke et al. (1983) – Escala ECC Equinos
• Edmonson et al. (1989) – Body Condition Scoring Bovinos
• Ferguson et al. (1994) – Descriptors of Body Condition Score
• WSAVA Body Condition Score Charts
• Embrapa – Boletins Técnicos de Nutrição Animal`;

        userPrompt = `Avalie o Escore de Condição Corporal (ECC) com os dados:

DADOS DO ANIMAL:
• Espécie: ${especie || "Não informada"}
• Idade: ${idade || "Não informada"}
• Peso Atual: ${peso || "Não informado"}
• Data: ${new Date().toLocaleDateString("pt-BR")}

${objetivo ? `OBJETIVO: ${objetivo}` : ""}

IMPORTANTE:
• Siga RIGOROSAMENTE a estrutura de 9 seções obrigatórias do Grupo 1
• Texto escaneável, com títulos claros e listas organizadas
• PROIBIDO texto corrido ou blocos longos`;
      }
      else if (tool === "identificador-plantas") {
        const isProfessional = requestBody.isProfessional === true;
        const description = requestBody.description || "";
        const images = requestBody.images || [];
        const councilType = requestBody.councilType || "";
        const councilNumber = requestBody.councilNumber || "";
        const councilUF = requestBody.councilUF || "";
        
        systemPrompt = `Você é um especialista em botânica, agronomia, toxicologia vegetal e manejo de pastagens da plataforma VetAgro Sustentável AI.

OBJETIVO: A partir da imagem enviada (folha, caule, raiz, flores, fruto ou foto de pastagem), gerar relatório técnico completo e padronizado sobre identificação botânica, fitossanidade e toxicidade animal.

REGRAS DE FORMATAÇÃO OBRIGATÓRIAS:
• SEM asteriscos, hashtags, emojis ou markdown
• Bullets apenas com • ou –
• Títulos em MAIÚSCULAS seguidos de dois-pontos
• Texto 100% justificado
• Parágrafos contínuos sem quebras desnecessárias
• Tabelas devem ser alinhadas e claras

ESTRUTURA OBRIGATÓRIA DA RESPOSTA:

1) IDENTIFICAÇÃO BOTÂNICA E MORFOLÓGICA:
• Nome popular
• Nome científico
• Família botânica
• Sinônimos botânicos (se houver)
• Características morfológicas observadas na imagem:
  – Tipo de folha e disposição
  – Nervuras e coloração
  – Formato e margem
  – Textura
  – Estolhos, rizomas (se visíveis)
  – Aspecto do caule
  – Presença de inflorescência ou sementes
  – Estrutura radicular (se visível)
• Se forem imagens de pasto: formação, densidade, manejo aparente
• Se não houver segurança na identificação: apresentar as 3 espécies mais prováveis explicando similaridades

2) ANÁLISE FITOSSANITÁRIA:
• Pragas comuns no Brasil (lagarta-militar, percevejos, cigarrinha-das-pastagens, cochonilhas, ácaros)
• Doenças fúngicas, bacterianas ou virais (ferrugem, míldio, antracnose, helmintosporiose)
• Deficiências nutricionais visuais: N, P, K, Ca, Mg, S, micronutrientes
• Estresse hídrico, queimaduras solares, encharcamento, compactação do solo
• Danos mecânicos ou fisiológicos
• Recomendação objetiva de correção: nutrição do solo, manejo de pragas, rotação, correção de solo, adubação, pastejo rotacionado, altura de manejo

3) ANÁLISE DE TOXICIDADE ANIMAL (SE APLICÁVEL):
• Princípios tóxicos (oxalatos, glicosídeos, alcaloides, saponinas, fotossensibilizantes)
• Partes tóxicas da planta
• Espécies animais afetadas
• Dose tóxica (quando existir literatura)
• Sinais clínicos detalhados:
  – Fase inicial
  – Fase intermediária
  – Fase grave
• Riscos de morte ou sequelas
• Tratamento recomendado (suporte, antídotos se existirem)
• Conduta imediata no campo

4) CONTEXTO AGROECOLÓGICO E BIOMAS:
• Identificar o bioma provável:
  – Amazônia
  – Cerrado
  – Mata Atlântica
  – Caatinga
  – Pantanal
  – Pampa
• Subclasses regionais quando aplicável:
  – Lavrado de Roraima (savana amazônica)
  – Campos de altitude
  – Savanas úmidas
  – Campinaranas
  – Veredas
  – Áreas de várzea e igapó
  – Faixas de transição (ecótonos)

5) FORRAGEIRAS ADEQUADAS POR BIOMA:
• Avaliar se o pasto observado é adequado ou inadequado ao bioma local
• Listar forrageiras mais adequadas por bioma:
  – Brachiaria brizantha cv. Marandu, Paiaguás, BRS Ipyporã
  – Brachiaria humidicola
  – Andropogon gayanus
  – Panicum maximum cv. Mombaça, BRS Zuri, Tamani
  – Cynodon spp. (Tifton 85, Coastcross)
  – Forrageiras nativas de savana amazônica (Lavrado)
  – Espécies tóxicas rurais frequentes
• Recomendações de manejo específicas do bioma
• No Lavrado de Roraima: evitar degradar áreas arenosas, cuidados com invasoras (capim-navalha, malícia, marupazinho), maior adaptação ao clima quente e solos pobres em P e Ca

6) RECOMENDAÇÕES DE MANEJO:
• Manejo da pastagem
• Indicadores de degradação
• Altura ideal de entrada e saída
• Correções de solo (V%, P, K)
• Adequação para bovinos, equinos, ovinos, bubalinos
• Viabilidade ambiental e produtiva
• Controle de pragas e doenças
• Riscos de intoxicação
• Alternativas de substituição (plantas seguras)

7) RISCOS ZOOTÉCNICOS:
• Impacto na produção animal
• Perdas econômicas potenciais
• Medidas preventivas

8) REFERÊNCIAS TÉCNICAS:
Sempre citar:
• Embrapa Gado de Corte / Amazônia Oriental / Roraima
• Plantas Tóxicas da Embrapa
• Tokarnia et al. – Manual de Plantas Tóxicas
• Flora do Brasil (Reflora)
• CEVAP
• Artigos científicos revisados por pares
• MAPA – listagens oficiais
• Guias de gramíneas brasileiras

9) AVISO FINAL:
${isProfessional ? "Este relatório é de apoio técnico. A avaliação diagnóstica completa requer análise presencial por engenheiro agrônomo, florestal, biólogo ou médico veterinário." : "⚠ Este relatório é uma estimativa baseada na imagem. A avaliação diagnóstica completa requer análise presencial por engenheiro agrônomo, florestal, biólogo ou médico veterinário."}`;

        userPrompt = `Identifique a planta/pastagem e gere relatório técnico completo:

DADOS DO PROFISSIONAL:
• Tipo: ${isProfessional ? "Profissional da área" : "Não profissional"}
${isProfessional && councilType ? `• Conselho: ${councilType}` : ""}
${isProfessional && councilNumber ? `• Registro: ${councilNumber}-${councilUF}` : ""}
• Data: ${new Date().toLocaleDateString("pt-BR")}

DESCRIÇÃO FORNECIDA: ${description || "Não fornecida - analisar pela imagem"}

${images.length > 0 ? `IMAGENS ANEXADAS: ${images.length} imagem(ns) para análise` : "Nenhuma imagem anexada"}

Forneça identificação botânica completa, análise fitossanitária, toxicidade animal (se aplicável), contexto agroecológico, forrageiras adequadas ao bioma e recomendações de manejo. Siga RIGOROSAMENTE a estrutura definida com texto 100% justificado, sem markdown, títulos em MAIÚSCULAS.`;
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

    console.log('Processando consulta veterinária');

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

    console.log('Resposta gerada com sucesso');

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
