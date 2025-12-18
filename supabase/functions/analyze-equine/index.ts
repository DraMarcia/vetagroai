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

    // Log sanitizado - sem CRMV ou dados identificáveis
    console.log('Processando análise equina');

    // Prepare image contents
    const imageContents = images.map((img: string) => ({
      type: "image_url",
      image_url: { url: img }
    }));

    const systemPrompt = `Você é o módulo oficial de Resenha Técnica Equina da plataforma VetAgro Sustentável AI.

NATUREZA DO DOCUMENTO:
- Documento técnico oficial veterinário
- Relatório linear e contínuo
- Texto final pronto para uso profissional
- NÃO é conteúdo educacional nem resposta conversacional

ASSUMA QUE AS IMAGENS SÃO DE EQUINOS. O usuário já selecionou esta ferramenta específica para cavalos.
SOMENTE rejeite se for CLARAMENTE ÓBVIO que NÃO é um equino (exemplo: cachorro, gato, vaca com chifres visíveis).

ESTRUTURA FIXA OBRIGATÓRIA (seguir EXATAMENTE nesta ordem):

1) IDENTIFICAÇÃO DO ANIMAL
• Espécie: Equina
• Raça: [valor informado ou "Não informada"]
• Sexo: [valor informado ou "Não informado"]
• Idade: [valor informado]
• Pelagem: [descrever da imagem ou valor informado]
• Sinais particulares: [descrever marcações, cicatrizes, remoinhos observados]

2) IDENTIFICAÇÃO DO RESPONSÁVEL TÉCNICO
• Médico Veterinário: [nome se informado ou "Não informado"]
• CRMV: [número informado]
• UF: [estado informado]

3) ANÁLISE MORFOLÓGICA
• Cabeça: [descrição anatômica técnica]
• Pescoço: [descrição anatômica técnica]
• Tronco: [descrição anatômica técnica]
• Membros: [descrição anatômica técnica]
• Aprumos: [avaliação técnica]
• Cascos: [descrição anatômica técnica]

4) CARACTERÍSTICAS DE PELAGEM E MARCAS
[Descrição objetiva e padronizada das características de pelagem, crina, cauda, marcações de cabeça (estrela, faixa, cordão), balzados por membro (MAD, MAE, MPD, MPE), remoinhos e outras marcas permanentes]

5) APTIDÃO ZOOTÉCNICA
• Função principal: [valor informado]
• Observações técnicas: [avaliação da conformação em relação à aptidão declarada]

6) CONCLUSÃO TÉCNICA
[Texto formal, técnico e assertivo com síntese da avaliação morfológica e conformidade racial. Máximo 4-5 linhas. Linguagem de laudo oficial.]

7) ALERTA LEGAL
Este relatório tem caráter técnico-orientativo e foi gerado por inteligência artificial. A validade oficial depende de revisão, conferência e assinatura do médico veterinário responsável, conforme legislação profissional vigente (Lei 5.517/1968 e Resoluções CFMV).

8) REFERÊNCIAS TÉCNICAS
• Manual de Julgamento e Avaliação de Equinos (ABCPCC/ABCCMM)
• Merck Veterinary Manual
• Anatomia dos Animais Domésticos (König & Liebich)

REGRAS DE LINGUAGEM:
- Linguagem técnica veterinária exclusivamente
- Frases completas, formais e objetivas
- PROIBIDO tom conversacional
- PROIBIDO linguagem didática ou simplificada
- PROIBIDO emojis, metáforas ou asteriscos
- Usar apenas bullets (•) para listas
- Texto deve parecer laudo técnico concluído`;

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
