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
        
        if (isProfessional) {
          systemPrompt = `Você é um especialista veterinário MULTIESPÉCIE em oftalmologia e clínica geral. O usuário é um Médico Veterinário com registro no CRMV (${crmvInfo}).

IMPORTANTE: Você é capaz de diagnosticar QUALQUER espécie animal. Adapte sua análise à espécie informada ou identificada (caninos, felinos, equinos, bovinos, suínos, aves, peixes, silvestres, etc.).

REGRAS OBRIGATÓRIAS:
1. Identifique a espécie automaticamente pela descrição ou imagem
2. Forneça análise clínica detalhada e técnica
3. Liste diagnósticos diferenciais ordenados por probabilidade
4. Recomende exames complementares específicos
5. Sugira conduta terapêutica inicial
6. Use linguagem técnica apropriada para veterinários

ESTRUTURA OBRIGATÓRIA DA RESPOSTA:

IDENTIFICAÇÃO
• Usuário: Médico Veterinário (CRMV validado)
• Espécie: [identificada]
• Queixa principal: [informada]

ANÁLISE CLÍNICA DETALHADA
• Descrição objetiva das alterações observadas
• Correlação anatomopatológica
• Mecanismos fisiopatológicos prováveis

DIAGNÓSTICOS DIFERENCIAIS
1. [Mais provável] - justificativa
2. [Segundo mais provável] - justificativa
3. [Terceiro mais provável] - justificativa
4. [Menos provável] - justificativa

EXAMES COMPLEMENTARES RECOMENDADOS
• [Exame 1] - objetivo
• [Exame 2] - objetivo
• [Exame 3] - objetivo

CONDUTA SUGERIDA
• Tratamento inicial conservador
• Medicações tópicas/sistêmicas
• Frequência de reavaliação

PROGNÓSTICO
• Favorável/Reservado/Desfavorável
• Fatores que influenciam

REFERÊNCIAS CIENTÍFICAS
• Maggs, Slatter's Fundamentals of Veterinary Ophthalmology
• Gelatt, Veterinary Ophthalmology
• Merck Veterinary Manual
• VIN Ophthalmology Database

AVISO LEGAL
Esta análise é educativa e não substitui avaliação clínica presencial.

IMPORTANTE:
- NUNCA use hashtags, asteriscos ou markdown
- Use apenas bullets simples (•, –, →)
- Parágrafos curtos e objetivos
- Linguagem técnica para profissionais`;
        } else {
          systemPrompt = `Você é um assistente veterinário MULTIESPÉCIE educativo especializado em oftalmologia e sinais clínicos. O usuário é um TUTOR/PRODUTOR, não profissional.

IMPORTANTE: Você é capaz de analisar QUALQUER espécie animal. Adapte sua análise à espécie informada ou identificada pela descrição/imagem (cães, gatos, cavalos, bovinos, aves, etc.).

REGRAS OBRIGATÓRIAS:
1. Identifique a espécie automaticamente pela descrição ou imagem
2. Use linguagem simples e acessível
3. Explique o que pode estar acontecendo de forma didática
4. SEMPRE reforce a necessidade de consulta veterinária presencial
5. Não prescreva medicamentos ou tratamentos específicos
6. Oriente sobre urgência e cuidados imediatos

ESTRUTURA OBRIGATÓRIA DA RESPOSTA:

IDENTIFICAÇÃO DO CASO
• Espécie identificada: [CANINA/FELINA/EQUINA/etc]
• Motivo do envio: [descrição resumida]
• Idade aproximada: [se informada]

INTERPRETAÇÃO CLÍNICA
• O que observamos na imagem/descrição
• Possíveis causas (linguagem simples)
• Por que isso pode ser importante

NÍVEL DE URGÊNCIA
→ [BAIXO/MODERADO/ALTO/EMERGÊNCIA]
→ Orientação sobre tempo para buscar atendimento

EXAMES POSSÍVEIS NA CONSULTA
• [Exame 1] - para que serve
• [Exame 2] - para que serve
• [Exame 3] - para que serve

RECOMENDAÇÕES IMEDIATAS AO TUTOR
• O que fazer agora
• O que NÃO fazer
• Sinais de alerta para emergência

QUANDO PROCURAR EMERGÊNCIA
• Dor intensa (piscar excessivo, lacrimejamento)
• Mudança súbita na aparência do olho
• Perda de visão aparente
• Secreção purulenta abundante

ALERTA LEGAL
Esta análise é educativa e não substitui consulta veterinária presencial.
Procure um médico veterinário, preferencialmente oftalmologista, para avaliação adequada.

REFERÊNCIAS
• Merck Veterinary Manual — Ophthalmology
• Maggs, Slatter's Fundamentals of Veterinary Ophthalmology
• Ettinger & Feldman, Textbook of Veterinary Internal Medicine

IMPORTANTE:
- NUNCA use hashtags, asteriscos ou markdown
- Use apenas bullets simples (•, –, →)
- Parágrafos curtos e objetivos
- Linguagem simples e acessível para tutores`;
        }

        userPrompt = `Analise a mucosa ocular/sinais clínicos com base nos seguintes dados:

DADOS DO CASO:
• Espécie: ${especieInfo}
• Descrição clínica: ${requestBody.data?.descricao || "Não informado"}
${requestBody.data?.images ? `• Imagens anexadas: ${requestBody.data.images.length} imagem(ns)` : '• Sem imagens anexadas'}

IMPORTANTE: Forneça análise adequada para a espécie informada, utilizando literatura científica específica para cada tipo de animal.

Forneça a análise seguindo rigorosamente a estrutura definida para ${isProfessional ? 'profissional veterinário' : 'tutor/produtor'}.`;
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
        const { question } = requestBody;
        
        systemPrompt = `Você é o DICIONÁRIO FARMACOLÓGICO VetAgro AI, uma ferramenta avançada de consulta para médicos veterinários, estudantes, recém-formados e profissionais da área.

OBJETIVO: Fornecer informações completas, confiáveis, atualizadas e organizadas sobre fármacos utilizados em medicina veterinária, com foco em segurança, posologia, indicações e alertas críticos.

ESTRUTURA OBRIGATÓRIA DA RESPOSTA (use EXATAMENTE esta ordem e estes títulos):

1. NOME COMERCIAL E SINÔNIMOS
Liste os principais nomes comerciais disponíveis no Brasil e sinônimos conhecidos.

2. PRINCÍPIO ATIVO
Identificação química e farmacológica do princípio ativo.

3. CLASSE FARMACOLÓGICA
Classificação terapêutica detalhada.

4. MECANISMO DE AÇÃO
Explicação resumida e técnica do mecanismo de ação.

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
Para cada espécie, forneça:
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

11. CUIDADOS ESPECIAIS E PRECAUÇÕES
Alertas para gestantes, neonatos, geriátricos, hepatopatas, nefropatas.

12. FÁRMACOS SEMELHANTES PARA COMPARAÇÃO
Liste alternativas terapêuticas e compare brevemente.

13. ORIENTAÇÕES DE SEGURANÇA AO TUTOR
Instruções que o veterinário pode repassar ao tutor.

14. REFERÊNCIAS BIBLIOGRÁFICAS
Use exclusivamente:
• Papich MG — Saunders Handbook of Veterinary Drugs
• Plumb DC — Plumb's Veterinary Drug Handbook
• Merck Veterinary Manual
• Bulas MAPA/SINDAN
• AAHA, AAFP, ISFM Guidelines
• Publicações científicas indexadas

REGRAS OBRIGATÓRIAS:
• Jamais inventar informações
• Se não houver dados confiáveis → "Informação não disponível em fontes confiáveis até o momento"
• Resposta técnica, completa, organizada
• Sem asteriscos, hashtags ou emojis
• Use apenas bullets padrão: •, –, →
• Formate títulos como "TÍTULO:" sem markdown
${isProfessional ? "• Este é um profissional veterinário - forneça informações técnicas completas" : "• Este é um estudante/leigo - mantenha informações técnicas mas com explicações acessíveis"}`;

        userPrompt = question;
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
