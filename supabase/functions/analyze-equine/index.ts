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
    const { images, breed, age, purpose, horseName, sex, coat, vetName, crmv } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurado');
    }

    // CRMV validation - mandatory for this tool
    if (!crmv) {
      return new Response(JSON.stringify({ 
        error: 'Esta ferramenta é restrita a médicos veterinários. Informe CRMV + estado para continuar.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Analisando equino:', { breed, age, purpose, imageCount: images.length, crmv });

    // Prepare image contents
    const imageContents = images.map((img: string) => ({
      type: "image_url",
      image_url: { url: img }
    }));

    const systemPrompt = `Você é o módulo oficial de Resenha Técnica Equina da plataforma VetAgro Sustentável AI.

OBJETIVO: Gerar resenhas morfológicas de equinos com linguagem técnica veterinária, estrutura padronizada e formato institucional.

INSTRUÇÕES IMPORTANTES:

1. ASSUMA QUE AS IMAGENS SÃO DE EQUINOS. O usuário já selecionou esta ferramenta específica para cavalos.
   - Analise as imagens como equinos e gere a resenha técnica imediatamente.
   - NÃO questione se são equinos — o usuário enviou as imagens para esta ferramenta de propósito.
   - SOMENTE rejeite se for CLARAMENTE ÓBVIO que NÃO é um equino (exemplo: cachorro, gato, vaca com chifres visíveis, etc.)
   - Se houver QUALQUER dúvida sobre a espécie, prossiga com a análise como equino.

2. Use APENAS linguagem técnica veterinária — NUNCA linguagem leiga.

3. ESTRUTURA OBRIGATÓRIA DA RESENHA (seguir EXATAMENTE):

IDENTIFICAÇÃO
• Raça: [valor]
• Idade: [valor]
• Sexo: [valor ou "Não informado"]
• Pelagem: [valor ou descrever da imagem]
• Finalidade: [valor]
• Responsável técnico: [nome se informado] — CRMV [número]

MORFOLOGIA E CONFORMAÇÃO
• Cabeça: [descrição anatômica]
• Pescoço: [descrição anatômica]
• Tronco: [descrição anatômica]
• Garupa: [descrição anatômica]
• Aprumos: [descrição anatômica]
• Cascos: [descrição anatômica]
• Musculatura: [descrição anatômica]

PELAGEM E MARCAÇÕES PERMANENTES
• Pelagem geral: [descrição]
• Crina e cauda: [descrição]
• Marcações de cabeça: [estrela, faixa, cordão, etc. ou "ausentes"]
• Balzados: [discriminar por membro: MAD, MAE, MPD, MPE ou "ausentes"]
• Outras marcas: [remoinhos, cicatrizes, etc. ou "não observadas"]

CONDIÇÃO CORPORAL E APTIDÃO FUNCIONAL
• Escore corporal estimado: [1-9]
• Aptidão funcional observada: [descrição]

PONTOS NOTÁVEIS E VALOR ZOOTÉCNICO
• [bullets com características relevantes para a raça/finalidade]

OBSERVAÇÕES RELEVANTES
• [achados importantes ou "Sem observações adicionais"]

CONCLUSÃO TÉCNICA
• [síntese da conformidade racial e aptidão do animal]

4. REGRAS DE FORMATAÇÃO:
   • NÃO usar asteriscos, hashtags ou símbolos markdown
   • Usar APENAS bullets (•) e frases curtas e objetivas
   • Tom: profissional, neutro, direto — nível veterinário
   • Se informação não estiver disponível, escrever "Não informado" — NUNCA inferir

5. Se houver 2-5 imagens, consolidar avaliação conjunta analisando todos os ângulos.

6. Se imagem estiver ruim ou ilegível, indicar: "Imagem com qualidade insuficiente para avaliação de [região]."

LEMBRE-SE: O usuário está usando uma ferramenta de RESENHA EQUINA. As imagens SÃO de cavalos. Analise-as e gere a resenha técnica completa.`;

    // Build user prompt with all available data
    let userPromptText = `Gere uma RESENHA TÉCNICA OFICIAL para este equino conforme a estrutura especificada.

DADOS INFORMADOS:`;
    if (horseName) userPromptText += `\n• Nome do animal: ${horseName}`;
    userPromptText += `\n• Raça: ${breed}`;
    userPromptText += `\n• Idade: ${age}`;
    if (sex) userPromptText += `\n• Sexo: ${sex}`;
    if (coat) userPromptText += `\n• Pelagem informada: ${coat}`;
    userPromptText += `\n• Finalidade: ${purpose}`;
    if (vetName) userPromptText += `\n• Veterinário responsável: ${vetName}`;
    userPromptText += `\n• CRMV: ${crmv}`;
    
    userPromptText += `\n\nAnalise as ${images.length} imagens fornecidas e gere a resenha técnica completa no formato especificado. Use linguagem técnica veterinária e terminologia anatômica oficial.`;

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
