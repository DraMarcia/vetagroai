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
    const { images, breed, age, purpose } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurado');
    }

    console.log('Analisando equino:', { breed, age, purpose, imageCount: images.length });

    // Preparar mensagens com imagens
    const imageContents = images.map((img: string) => ({
      type: "image_url",
      image_url: { url: img }
    }));

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
            content: `Você é um veterinário especialista em equinos. Sua tarefa é criar uma resenha técnica detalhada baseada nas imagens fornecidas.
            
Analise as imagens do equino e crie uma descrição técnica completa incluindo:
- Características morfológicas (estrutura, proporções, conformação)
- Pelagem e coloração detalhada
- Características específicas visíveis (marcas, sinais distintivos)
- Avaliação da condição física aparente
- Pontos fortes e características notáveis
- Observações sobre conformação e tipo racial

A resenha deve ser profissional, técnica e adequada para documentação oficial veterinária.`
          },
          {
            role: 'user',
            content: [
              {
                type: "text",
                text: `Crie uma resenha técnica para este equino:
Raça: ${breed}
Idade: ${age}
Finalidade: ${purpose}

Analise as imagens fornecidas e crie uma descrição completa e profissional.`
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
