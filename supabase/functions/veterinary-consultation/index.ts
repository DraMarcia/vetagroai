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

      if (tool === "consulta-geoespacial") {
        systemPrompt = `Você é um especialista em sustentabilidade agropecuária e geoespacial do Brasil.
Analise dados sobre biomas, produção agrícola e práticas sustentáveis.
Forneça recomendações técnicas baseadas em evidências científicas.

ESTRUTURA DA RESPOSTA:
1. **SÍNTESE EXECUTIVA** - Resumo em 2-3 frases
2. **ANÁLISE TÉCNICA** - Características do bioma, clima, solo e aptidão produtiva
3. **RECOMENDAÇÕES SUSTENTÁVEIS** - Práticas recomendadas para a região
4. **OPORTUNIDADES E INCENTIVOS** - PSA, créditos de carbono, certificações
5. **MONITORAMENTO SUGERIDO** - Indicadores para acompanhamento

${plan === "free" ? "IMPORTANTE: Este é um usuário do plano FREE. Forneça apenas a SÍNTESE EXECUTIVA e RECOMENDAÇÕES SUSTENTÁVEIS de forma resumida (máx 150 palavras total). Indique que análises detalhadas estão disponíveis nos planos Pro/Enterprise." : ""}
${plan === "pro" ? "Este é um usuário Pro. Forneça análise completa com todos os tópicos." : ""}
${plan === "enterprise" ? "Este é um usuário Enterprise. Forneça análise completa, detalhada e com recomendações estratégicas consultivas." : ""}

Sempre cite referências confiáveis (Embrapa, IPCC, MAPA, INPE, etc.).`;

        userPrompt = `Realize uma consulta geoespacial sustentável com os seguintes dados:

**Bioma:** ${data.bioma}
**Localização:** ${data.municipio}
**Tipo de Produção:** ${data.tipoProducao}
**Objetivo da Consulta:** ${data.objetivo}
${data.informacoes ? `**Informações Adicionais:** ${data.informacoes}` : ""}

Forneça análise técnica completa sobre sustentabilidade, riscos, oportunidades e recomendações para esta região e atividade.`;
      } 
      else if (tool === "simulador-confinamento") {
        const ganhoTotal = data.pesoFinal - data.pesoInicial;
        const diasNecessarios = Math.ceil(ganhoTotal / data.gmdEsperado);
        const custoTotal = data.custoDiario * data.diasConfinamento;
        const arrobasGanhas = ganhoTotal / 15;
        const custoArroba = custoTotal / arrobasGanhas;

        systemPrompt = `Você é um especialista em pecuária de corte sustentável e confinamento bovino.
Analise dados de confinamento e forneça projeções técnicas sobre desempenho, custos e emissões.

ESTRUTURA DA RESPOSTA:
1. **SÍNTESE EXECUTIVA** - Resumo do cenário simulado
2. **PROJEÇÕES ZOOTÉCNICAS**
   - Peso projetado final
   - GMD ajustado
   - Conversão alimentar estimada
3. **ANÁLISE ECONÔMICA**
   - Custo por arroba
   - Custo total por cabeça
   - Ponto de equilíbrio
4. **ANÁLISE DE EMISSÕES**
   - CH₄ estimado (kg/animal)
   - CO₂ equivalente
   - Comparativo por nível de sustentabilidade
5. **RECOMENDAÇÕES TÉCNICAS**
   - Estratégias para eficiência
   - Redução de metano
   - Manejo sustentável

${plan === "free" ? "IMPORTANTE: Este é um usuário do plano FREE. Forneça apenas SÍNTESE EXECUTIVA e valores básicos de custo/arroba e emissões (máx 150 palavras). Indique que análises detalhadas estão disponíveis nos planos Pro/Enterprise." : ""}
${plan === "pro" ? "Este é um usuário Pro. Forneça análise completa com todos os tópicos." : ""}
${plan === "enterprise" ? "Este é um usuário Enterprise. Forneça análise completa com modelagem comparativa entre cenários e recomendações estratégicas consultivas." : ""}

Use referências técnicas (Embrapa, IPCC Tier 2, literatura científica).`;

        userPrompt = `Simule um confinamento sustentável com os seguintes parâmetros:

**Categoria Animal:** ${data.categoria}
**Peso Inicial:** ${data.pesoInicial} kg
**Peso Final Desejado:** ${data.pesoFinal} kg
**Dias de Confinamento:** ${data.diasConfinamento} dias
**GMD Esperado:** ${data.gmdEsperado} kg/dia
**Custo Diário da Dieta:** R$ ${data.custoDiario}/cab
**Mortalidade Esperada:** ${data.mortalidade}%
**Nível de Sustentabilidade:** ${data.nivelSustentabilidade}

**Cálculos preliminares:**
- Ganho total necessário: ${ganhoTotal} kg
- Dias necessários para atingir GMD: ${diasNecessarios} dias
- Custo total estimado: R$ ${custoTotal.toFixed(2)}/cab
- Arrobas ganhas: ${arrobasGanhas.toFixed(2)}@
- Custo por arroba (estimado): R$ ${custoArroba.toFixed(2)}/@

Forneça análise técnica completa sobre projeções de desempenho, custos, emissões e recomendações sustentáveis.`;
      }
      else if (tool === "analise-produtiva") {
        systemPrompt = `Você é um consultor zootécnico especializado em eficiência produtiva e econômica de sistemas agropecuários.

ESTRUTURA OBRIGATÓRIA DA RESPOSTA:

1. SÍNTESE EXECUTIVA
   - Resumo em 3-4 frases do cenário analisado

2. DIAGNÓSTICO ZOOTÉCNICO
   - Análise do GMD comparado a referências do setor
   - Avaliação da conversão alimentar (ideal vs atual)
   - Taxa de lotação (adequação à capacidade de suporte)
   - Eficiência do sistema produtivo

3. INDICADORES ECONÔMICOS
   - ROI estimado (%)
   - Margem por arroba/hectare (R$)
   - Custo de produção por kg
   - Ponto de equilíbrio

4. GARGALOS IDENTIFICADOS
   - Pontos críticos que limitam a eficiência
   - Fatores de risco econômico
   - Perdas potenciais identificadas

5. CENÁRIOS DE OTIMIZAÇÃO
   - Cenário Conservador: ajustes mínimos
   - Cenário Realista: melhorias moderadas
   - Cenário Otimista: investimentos significativos
   - Para cada: "Se ajustar X, seu lucro sobe Y"

6. RECOMENDAÇÕES ESTRATÉGICAS
   - Plano de ação prioritário
   - Estratégias de manejo, nutrição e gestão
   - Cronograma sugerido de implementação

7. REFERÊNCIAS TÉCNICAS
   - Embrapa, ABIEC, FAO, CEPEA, literatura científica

REGRAS DE FORMATAÇÃO:
- NÃO use asteriscos (*) ou hashtags (#)
- Use apenas marcadores simples: • ou -
- Estruture em parágrafos claros
- Números sempre com unidades (kg, R$, %, ha)
- Tabelas quando apropriado para comparativos

${plan === "free" ? "IMPORTANTE: Este é um usuário FREE. Forneça apenas SÍNTESE EXECUTIVA, DIAGNÓSTICO básico e 2 RECOMENDAÇÕES principais (máx 200 palavras total). Indique que análises completas com cenários de otimização estão disponíveis nos planos Pro/Enterprise." : ""}
${plan === "pro" ? "Este é um usuário Pro. Forneça análise completa com todos os 7 tópicos detalhados." : ""}
${plan === "enterprise" ? "Este é um usuário Enterprise. Forneça análise completa, detalhada, com modelagem comparativa avançada entre cenários, projeções financeiras de 12 meses e recomendações estratégicas consultivas de alto nível." : ""}`;

        const sistemaLabel = data.tipoSistema || "Não especificado";
        
        userPrompt = `Realize uma análise produtiva e econômica completa com os seguintes dados:

DADOS DO SISTEMA PRODUTIVO:
- Tipo de Sistema: ${sistemaLabel}
- Número de Animais: ${data.numeroAnimais || "Não informado"}
- Área Total: ${data.areaTotal ? data.areaTotal + " hectares" : "Não informado"}
- Taxa de Lotação: ${data.taxaLotacao ? data.taxaLotacao + " UA/ha" : "Não informado"}

INDICADORES ZOOTÉCNICOS:
- GMD (Ganho Médio Diário): ${data.gmd ? data.gmd + " kg/dia" : "Não informado"}
- Conversão Alimentar: ${data.conversaoAlimentar ? data.conversaoAlimentar + ":1" : "Não informado"}

INDICADORES ECONÔMICOS:
- Custo por kg Produzido: ${data.custoPorKg ? "R$ " + data.custoPorKg : "Não informado"}
- Preço de Venda: ${data.precoVenda ? "R$ " + data.precoVenda + "/@" : "Não informado"}

DADOS ADICIONAIS:
- Mortalidade: ${data.mortalidade ? data.mortalidade + "%" : "Não informado"}
- Eficiência Reprodutiva: ${data.eficienciaReprodutiva ? data.eficienciaReprodutiva + "%" : "Não informado"}
- Período do Lote: ${data.datasLote || "Não informado"}
${data.observacoesAdicionais ? `- Observações: ${data.observacoesAdicionais}` : ""}

Forneça diagnóstico técnico completo, identifique gargalos, calcule indicadores econômicos, projete cenários de otimização e recomende estratégias práticas para melhorar a rentabilidade.`;
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
