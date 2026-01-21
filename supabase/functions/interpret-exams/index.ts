import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS (production + development)
const allowedOrigins = [
  'https://vetagro.ai',
  'https://www.vetagro.ai',
  'https://vetagroai.lovable.app',
  'https://id-preview--3dd84b8e-5245-406b-9a7f-df349f142adc.lovable.app',
  'https://3dd84b8e-5245-406b-9a7f-df349f142adc.lovableproject.com',
  'https://app.vetagroai.com.br',
  'https://vetagro-sustentavel.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

interface FileData {
  url: string;
  type: string;
  name: string;
}

interface RequestBody {
  files: FileData[];
  clinicalData: string;
  userType: 'profissional' | 'tutor';
  crmv?: string;
  patient: {
    species: string;
    age: string;
    weight: string;
  };
  examType: string;
  plan?: 'free' | 'pro' | 'enterprise';
}

// ===== AUTHENTICATION HELPER =====
interface AuthResult {
  user: { id: string; email?: string } | null;
  plan: string;
  isAdmin: boolean;
  error: string | null;
}

async function authenticateRequest(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, plan: 'free', isAdmin: false, error: 'Authentication required' };
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  
  if (authError || !user) {
    return { user: null, plan: 'free', isAdmin: false, error: 'Invalid or expired token' };
  }

  // Retrieve actual plan from profiles table
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('current_plan')
    .eq('user_id', user.id)
    .single();

  const actualPlan = profile?.current_plan || 'free';

  return { user, plan: actualPlan, isAdmin: false, error: null };
}
// ===== END AUTHENTICATION HELPER =====

// Extract lab values from text using regex patterns
function extractLabValues(text: string): { found: boolean; values: string[]; missing: string[] } {
  const patterns = {
    hemoglobina: /(?:hemoglobina|hb|hgb)[:\s]*(\d+[.,]?\d*)/gi,
    hematocrito: /(?:hematócrito|hematocrito|ht|hct)[:\s]*(\d+[.,]?\d*)/gi,
    hemacias: /(?:hemácias|hemacias|eritrócitos|eritrocitos|rbc)[:\s]*(\d+[.,]?\d*)/gi,
    leucocitos: /(?:leucócitos|leucocitos|wbc)[:\s]*(\d+[.,]?\d*)/gi,
    plaquetas: /(?:plaquetas|plt)[:\s]*(\d+[.,]?\d*)/gi,
  };

  const found: string[] = [];
  const missing: string[] = [];

  for (const [name, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match) {
      found.push(name);
    } else {
      missing.push(name);
    }
  }

  // Consider valid if at least 2 key values found
  const hasMinimumValues = found.length >= 2;

  return { found: hasMinimumValues, values: found, missing };
}

// Clean response text - remove markdown symbols
function cleanResponseText(text: string): string {
  return text
    .replace(/#{1,6}\s*/g, '')           // Remove headers
    .replace(/\*\*/g, '')                 // Remove bold
    .replace(/\*/g, '')                   // Remove italic
    .replace(/`{1,3}/g, '')               // Remove code blocks
    .replace(/~~(.*?)~~/g, '$1')          // Remove strikethrough
    .replace(/^\s*[-*+]\s+/gm, '• ')      // Standardize bullets
    .replace(/^\s*\d+\.\s+/gm, '• ')      // Convert numbered lists to bullets
    .replace(/\n{3,}/g, '\n\n')           // Reduce multiple newlines
    .trim();
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user and get actual plan from database
    const authResult = await authenticateRequest(req);
    
    if (authResult.error) {
      return new Response(
        JSON.stringify({ error: authResult.error, code: 'AUTH_ERROR' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const plan = authResult.plan; // Server-validated plan

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ 
        error: "Configuração do servidor incompleta. Contate o suporte.",
        code: "CONFIG_ERROR"
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: RequestBody = await req.json();
    const { files, clinicalData, userType, crmv, patient, examType } = body;

    console.log("Request received: processing exam interpretation");

    // Validate minimum input
    if ((!files || files.length === 0) && !clinicalData?.trim()) {
      return new Response(JSON.stringify({ 
        error: "Nenhum arquivo ou dado clínico fornecido. Por favor, envie um PDF/imagem do exame ou insira os valores manualmente.",
        code: "NO_INPUT"
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process files with OCR
    let extractedContent = "";
    let ocrSuccess = false;
    const ocrErrors: string[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        try {
          // Build content for OCR
          const ocrMessages: any[] = [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Você é um especialista em OCR de laudos veterinários. Extraia TODOS os valores laboratoriais deste exame.

FORMATO DE EXTRAÇÃO OBRIGATÓRIO:
Para cada parâmetro encontrado, liste:
PARÂMETRO: valor unidade (referência: valor_min - valor_max)

PARÂMETROS PRIORITÁRIOS A EXTRAIR:
• Hemácias/Eritrócitos (RBC)
• Hemoglobina (Hb/Hgb)
• Hematócrito (Ht/Hct)
• VCM, HCM, CHCM
• Leucócitos totais (WBC)
• Neutrófilos, Linfócitos, Monócitos, Eosinófilos, Basófilos
• Plaquetas (PLT)
• Proteínas totais
• Qualquer outro parâmetro presente

Se não conseguir ler algum valor, indique: "[ilegível]"
Se o documento não for um exame laboratorial, indique: "DOCUMENTO NÃO RECONHECIDO COMO EXAME LABORATORIAL"

Extraia agora:`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: file.url
                  }
                }
              ]
            }
          ];

          const ocrResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: ocrMessages,
            }),
          });

          if (ocrResponse.ok) {
            const ocrData = await ocrResponse.json();
            const ocrText = ocrData.choices?.[0]?.message?.content || "";
            
            if (ocrText && !ocrText.includes("DOCUMENTO NÃO RECONHECIDO")) {
              extractedContent += `\n\n--- Dados extraídos de ${file.name} ---\n${ocrText}`;
              ocrSuccess = true;
              console.log('OCR success');
            } else {
              ocrErrors.push(file.name);
              console.log('OCR failed: document not recognized');
            }
          } else {
            const errorText = await ocrResponse.text();
            console.error('OCR API error:', ocrResponse.status, errorText);
            ocrErrors.push(file.name);
          }
        } catch (ocrError) {
          console.error('OCR processing error:', ocrError);
          ocrErrors.push(file.name);
        }
      }
    }

    // Combine extracted content with clinical data
    let combinedData = "";
    if (extractedContent) {
      combinedData += extractedContent;
    }
    if (clinicalData?.trim()) {
      combinedData += `\n\n--- Dados clínicos informados pelo usuário ---\n${clinicalData}`;
    }

    // Validate lab values
    const labValidation = extractLabValues(combinedData);
    
    // If no lab values found, return guidance
    if (!labValidation.found && !clinicalData?.trim()) {
      const ocrFailedFiles = ocrErrors.length > 0 ? `\n\nArquivos não lidos: ${ocrErrors.join(', ')}` : '';
      
      return new Response(JSON.stringify({ 
        error: `O PDF foi lido, porém os valores não puderam ser extraídos automaticamente.

Para realizar a interpretação, forneça os valores do exame:
• Hemograma: Hemácias, Hemoglobina, Hematócrito, Leucócitos, Plaquetas
• Bioquímica: ALT, AST, Ureia, Creatinina, Proteínas totais

Insira os valores no campo de texto ou envie uma imagem mais nítida do exame.${ocrFailedFiles}`,
        code: "NO_LAB_VALUES",
        ocrSuccess: ocrSuccess
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build interpretation prompt based on user type and server-validated plan
    const isProfessional = userType === 'profissional';
    const isFreePlan = plan === 'free';
    
    const depthInstruction = isFreePlan 
      ? "Forneça uma análise resumida e objetiva, focando nos principais achados."
      : "Forneça uma análise detalhada e completa, com todas as correlações clínicas relevantes.";

    const userTypeInstruction = isProfessional
      ? `O usuário é um PROFISSIONAL VETERINÁRIO (CRMV: ${crmv || 'não informado'}).
         Utilize linguagem técnica, inclua diagnóstico sindrômico, fisiopatologia, hipóteses diagnósticas ordenadas por probabilidade, e condutas terapêuticas sugeridas.`
      : `O usuário é um TUTOR/PROPRIETÁRIO do animal.
         Utilize linguagem SIMPLES e ACOLHEDORA. Explique o significado dos valores de forma clara.
         SEMPRE inclua a recomendação: "Procure um médico veterinário para avaliação presencial."`;

    // PADRÃO GRUPO 1 - FERRAMENTAS CLÍNICAS
    const systemPrompt = `Você é um especialista em medicina veterinária laboratorial da suíte VetAgro Sustentável AI, especializado em interpretação de exames.

PADRÃO DE SAÍDA OBRIGATÓRIO:

REGRAS ABSOLUTAS DE FORMATAÇÃO:
1. PROIBIDO texto corrido longo - TODA resposta DEVE ser dividida em SEÇÕES NUMERADAS
2. PROIBIDO usar asteriscos (*), hashtags (#), emojis ou markdown
3. Use APENAS bullets padrão: • ou –
4. Parágrafos curtos (máximo 4 linhas cada)
5. O texto deve ser ESCANEÁVEL em leitura rápida
6. Espaçamento visual consistente entre blocos
7. Cada seção deve ser VISUALMENTE RECONHECÍVEL

INFORMAÇÕES DO PACIENTE:
• Espécie: ${patient.species || 'Não informada'}
• Idade: ${patient.age || 'Não informada'}
• Peso: ${patient.weight || 'Não informado'}
• Tipo de exame: ${examType || 'Não especificado'}

PERFIL DO USUÁRIO:
${userTypeInstruction}

NÍVEL DE DETALHE:
${depthInstruction}

ESTRUTURA OBRIGATÓRIA DA RESPOSTA:

[INTERPRETAÇÃO DE EXAMES]

Análise Clínica Orientativa — VetAgro Sustentável AI

────────────────────
1) IDENTIFICAÇÃO DO CASO

• Tipo de usuário: [Profissional/Tutor]
• Espécie: ${patient.species || 'Não informada'}
• Idade: ${patient.age || 'Não informada'}
• Peso: ${patient.weight || 'Não informado'}
• Tipo de exame: ${examType || 'Não especificado'}

────────────────────
2) ANÁLISE CLÍNICA INICIAL

INTERPRETAÇÃO DA TABELA DE VALORES:
Para cada parâmetro encontrado, indique:
• [Parâmetro]: [valor] [unidade] → [NORMAL/ALTO/BAIXO]
  – Significado clínico: [explicação breve]

(Organizar por categorias: Eritrograma, Leucograma, Plaquetograma, Bioquímica, etc.)

────────────────────
3) HIPÓTESES / DIAGNÓSTICOS DIFERENCIAIS

Listar em ordem de probabilidade:

1. [Diagnóstico mais provável]
   – Justificativa baseada nos achados laboratoriais

2. [Segundo mais provável]
   – Justificativa baseada nos achados laboratoriais

3. [Terceiro]
   – Justificativa baseada nos achados laboratoriais

4. [Quarto, se aplicável]
   – Justificativa

────────────────────
4) EXAMES COMPLEMENTARES RECOMENDADOS

Formato obrigatório:
• [Nome do exame] — [Objetivo clínico / justificativa]

────────────────────
5) CLASSIFICAÇÃO DE URGÊNCIA

• Nível: [Baixa | Moderada | Alta | Emergencial]
• Justificativa clínica clara
• Liberação para procedimentos cirúrgicos (quando aplicável)

────────────────────
6) CONDUTAS INICIAIS ORIENTATIVAS

${isProfessional ? '• Condutas terapêuticas sugeridas\n• Monitoramento indicado\n• Parâmetros para reavaliação' : '• Orientações para o tutor\n• Quando procurar atendimento veterinário\n• Cuidados gerais em casa'}

────────────────────
7) PROGNÓSTICO PRELIMINAR

• [Favorável | Reservado | Desfavorável]
• Condicionado à confirmação diagnóstica

────────────────────
8) ALERTA LEGAL

Esta análise tem caráter educativo e não substitui a consulta veterinária presencial.
Relatório gerado via VetAgro Sustentável AI — Análise Assistida © 2025

────────────────────
9) REFERÊNCIAS TÉCNICAS

• Merck Veterinary Manual
• Nelson & Couto — Medicina Interna de Pequenos Animais
• Ettinger & Feldman — Textbook of Veterinary Internal Medicine
• VIN — Veterinary Information Network`;

    console.log("Sending to AI for interpretation...");

    // Call AI for interpretation
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analise os seguintes dados laboratoriais:\n\n${combinedData}` }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorStatus = aiResponse.status;
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", errorStatus, errorText);

      if (errorStatus === 429) {
        return new Response(JSON.stringify({ 
          error: "Limite de requisições atingido. Aguarde 2 minutos e tente novamente.",
          code: "RATE_LIMIT"
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (errorStatus === 402) {
        return new Response(JSON.stringify({ 
          error: "Créditos insuficientes. Por favor, atualize seu plano.",
          code: "CREDITS_INSUFFICIENT"
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        error: "Erro ao processar análise. Tente novamente em instantes.",
        code: "AI_ERROR"
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    let analysisResult = aiData.choices?.[0]?.message?.content || "";

    if (!analysisResult) {
      return new Response(JSON.stringify({ 
        error: "A análise não retornou resultado. Verifique se os dados do exame estão legíveis e tente novamente.",
        code: "EMPTY_RESPONSE"
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clean the response
    analysisResult = cleanResponseText(analysisResult);

    console.log("Analysis completed successfully");

    // Return successful response
    return new Response(JSON.stringify({ 
      success: true,
      analysis: analysisResult,
      extractedData: extractedContent,
      ocrSuccess: ocrSuccess,
      ocrErrors: ocrErrors.length > 0 ? ocrErrors : null,
      plan: plan,
      canExportPdf: plan !== 'free'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Server error:", error);
    return new Response(JSON.stringify({ 
      error: "Erro interno do servidor. Por favor, tente novamente.",
      code: "SERVER_ERROR"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
