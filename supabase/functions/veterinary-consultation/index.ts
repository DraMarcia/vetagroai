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
    const { question, isProfessional, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurado');
    }

    console.log('Processando consulta:', { isProfessional, questionLength: question.length });

    const systemPrompt = isProfessional
      ? `Você é um assistente veterinário especializado. Forneça respostas técnicas e detalhadas para profissionais da área veterinária. 
      Use terminologia técnica apropriada e cite bases científicas quando relevante.`
      : `Você é um assistente veterinário educacional. Forneça informações claras e acessíveis para tutores de animais.
      Use linguagem simples e didática. IMPORTANTE: Ao final de cada resposta, sempre inclua o aviso:
      "⚠️ Esta é uma orientação educacional. Recomendamos fortemente consultar um médico veterinário para diagnóstico e tratamento adequados."`;

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
          { role: 'user', content: `${context ? `Contexto: ${context}\n\n` : ''}${question}` }
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
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;

    console.log('Resposta gerada com sucesso');

    return new Response(JSON.stringify({ answer }), {
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
