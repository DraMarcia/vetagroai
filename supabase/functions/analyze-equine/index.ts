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
    const { images, breed, age, purpose, horseName, sex, coat, isProfessional, crmv } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurado');
    }

    console.log('Analisando equino:', { breed, age, purpose, imageCount: images.length, isProfessional });

    // Prepare image contents
    const imageContents = images.map((img: string) => ({
      type: "image_url",
      image_url: { url: img }
    }));

    // Different prompts for professional vs lay users
    const professionalSystemPrompt = `Você é uma IA veterinária especializada em Medicina Equina e identificação morfológica, responsável por gerar resenhas técnicas oficiais curtas e profissionalmente padronizadas.

REGRAS OBRIGATÓRIAS:
1. Esta ferramenta é EXCLUSIVA para equinos. Se as imagens NÃO forem de equinos, responda APENAS: "Esta ferramenta é exclusiva para avaliação morfológica de equinos. Por favor, utilize a ferramenta correspondente à espécie correta."

2. O texto deve seguir EXATAMENTE este formato estruturado com seções curtas:

IDENTIFICAÇÃO
• Raça: [valor]
• Idade: [valor]
• Sexo: [valor se informado]
• Pelagem: [valor]
• Finalidade: [valor]

MORFOLOGIA E CONFORMAÇÃO
• [bullet objetivo]
• [bullet objetivo]

PELAGEM E MARCAS DISTINTIVAS
• [bullet objetivo]
• [bullet objetivo]

CONDIÇÃO FÍSICA
• [bullet objetivo]

POTENCIAL FUNCIONAL
• [bullet objetivo]

CONCLUSÃO TÉCNICA
• [bullet objetivo]

REFERÊNCIAS
• ANM Manual de Identificação Equina
• Merck Veterinary Manual
• Gelatt – Veterinary Ophthalmology

3. NÃO use parágrafos longos — use APENAS bullets e frases objetivas
4. NÃO use asteriscos, hashtags ou símbolos markdown
5. Analise APENAS o que é visível nas imagens — NUNCA invente marcas ou diagnósticos
6. Se a imagem estiver ruim ou ilegível, avise e solicite nova imagem
7. Tom: profissional, neutro, direto, sem emoção ou floreio
8. Máximo 1 página de conteúdo`;

    const layPersonSystemPrompt = `Você é uma IA veterinária especializada em Medicina Equina, responsável por gerar descrições informativas sobre equinos para proprietários e criadores.

REGRAS OBRIGATÓRIAS:
1. Esta ferramenta é EXCLUSIVA para equinos. Se as imagens NÃO forem de equinos, responda APENAS: "Esta ferramenta é exclusiva para avaliação morfológica de equinos. Por favor, utilize a ferramenta correspondente à espécie correta."

2. Use linguagem acessível e educativa
3. Estruture a resposta em seções claras:

SOBRE SEU EQUINO
• [descrição geral acessível]

CARACTERÍSTICAS OBSERVADAS
• [bullets com linguagem simples]

PELAGEM E MARCAS
• [descrição das marcas visíveis]

CONDIÇÃO GERAL
• [avaliação em linguagem leiga]

OBSERVAÇÕES
• [pontos de atenção para o proprietário]

IMPORTANTE
Esta análise é informativa e não substitui avaliação presencial por médico veterinário.

4. NÃO use termos técnicos complexos sem explicação
5. NÃO use asteriscos, hashtags ou símbolos markdown
6. Analise APENAS o que é visível nas imagens
7. Tom: amigável, educativo e acessível`;

    const systemPrompt = isProfessional ? professionalSystemPrompt : layPersonSystemPrompt;

    // Build user prompt with all available data
    let userPromptText = isProfessional 
      ? `Crie uma resenha técnica oficial para este equino conforme o formato especificado:`
      : `Descreva este equino de forma acessível para o proprietário:`;
    
    userPromptText += `\n\nDados informados:`;
    if (horseName) userPromptText += `\n• Nome: ${horseName}`;
    userPromptText += `\n• Raça: ${breed}`;
    userPromptText += `\n• Idade: ${age}`;
    if (sex) userPromptText += `\n• Sexo: ${sex}`;
    if (coat) userPromptText += `\n• Pelagem informada: ${coat}`;
    userPromptText += `\n• Finalidade: ${purpose}`;
    if (isProfessional && crmv) userPromptText += `\n• Veterinário responsável: CRMV ${crmv}`;
    
    userPromptText += `\n\nAnalise as ${images.length} imagens fornecidas e gere a resenha conforme o formato especificado.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: "text",
                text: userPromptText
              },
              ...imageContents
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    const resenha = data.choices[0].message.content;

    console.log('Resenha gerada com sucesso');

    return new Response(JSON.stringify({ resenha }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao processar resenha:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
