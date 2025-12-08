import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2, Upload, Image as ImageIcon, X, AlertTriangle, FileUp, RefreshCw, Stethoscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ReportExporter } from "@/components/ReportExporter";
import { cleanTextForDisplay } from "@/lib/textUtils";

interface UploadedFile {
  url: string;
  name: string;
  type: "image" | "pdf";
}

const InterpretacaoExames = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [isProfessional, setIsProfessional] = useState("");
  const [crmv, setCrmv] = useState("");
  const [species, setSpecies] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [examType, setExamType] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [clinicalData, setClinicalData] = useState("");
  const [result, setResult] = useState("");
  const [showFallbackInput, setShowFallbackInput] = useState(false);
  const [ocrFailed, setOcrFailed] = useState(false);

  const speciesOptions = [
    "Canina",
    "Felina",
    "Bovina",
    "Equina",
    "Suína",
    "Ovina",
    "Caprina",
    "Aves",
    "Outra"
  ];

  const examTypes = [
    "Hemograma Completo",
    "Bioquímica Sérica",
    "Urinálise",
    "Coproparasitológico",
    "Raio-X",
    "Ultrassonografia",
    "Eletrocardiograma",
    "Citologia",
    "Histopatológico",
    "Outro"
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    const fileArray = Array.from(uploadedFiles);
    const filePromises = fileArray.map((file) => {
      return new Promise<UploadedFile>((resolve, reject) => {
        const isPdf = file.type === "application/pdf";
        const isImage = file.type.startsWith("image/");
        
        if (!isPdf && !isImage) {
          reject(new Error(`Arquivo não suportado: ${file.name}`));
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => resolve({
          url: reader.result as string,
          name: file.name,
          type: isPdf ? "pdf" : "image"
        });
        reader.onerror = () => reject(new Error(`Erro ao ler ${file.name}`));
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises)
      .then((loadedFiles) => {
        setFiles(prev => [...prev, ...loadedFiles]);
        setOcrFailed(false);
        setShowFallbackInput(false);
        
        const imageCount = loadedFiles.filter(f => f.type === "image").length;
        const pdfCount = loadedFiles.filter(f => f.type === "pdf").length;
        
        let message = "";
        if (imageCount > 0) message += `${imageCount} imagem(ns)`;
        if (pdfCount > 0) message += `${message ? " e " : ""}${pdfCount} PDF(s)`;
        
        toast({
          title: "Arquivos carregados",
          description: `${message} adicionado(s) com sucesso.`,
        });
      })
      .catch((error) => {
        toast({
          title: "Erro ao carregar arquivo",
          description: error.message,
          variant: "destructive",
        });
      });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getReferences = () => [
    "Merck Veterinary Manual (11th Edition)",
    "Nelson & Couto — Medicina Interna de Pequenos Animais (Elsevier)",
    "Ettinger & Feldman — Veterinary Internal Medicine (Elsevier)",
    "Thrall MA — Veterinary Diagnostic Imaging",
    "VIN Veterinary Information Network"
  ];

  const getUserInputs = () => {
    const imageCount = files.filter(f => f.type === "image").length;
    const pdfCount = files.filter(f => f.type === "pdf").length;
    
    let filesInfo = "Nenhum";
    if (imageCount > 0 || pdfCount > 0) {
      const parts = [];
      if (imageCount > 0) parts.push(`${imageCount} imagem(ns)`);
      if (pdfCount > 0) parts.push(`${pdfCount} PDF(s)`);
      filesInfo = parts.join(" e ");
    }

    return {
      "Tipo de Usuário": isProfessional === "sim" ? "Profissional Veterinário" : "Tutor/Produtor",
      ...(isProfessional === "sim" && crmv ? { "CRMV": crmv } : {}),
      "Espécie": species,
      "Idade": age,
      "Peso": weight,
      "Tipo de Exame": examType,
      "Arquivos Anexados": filesInfo,
      ...(clinicalData ? { "Dados Clínicos": clinicalData.substring(0, 200) + (clinicalData.length > 200 ? "..." : "") } : {}),
    };
  };

  const extractPdfContent = async (pdfBase64: string, fileName: string): Promise<{ content: string; success: boolean }> => {
    try {
      setLoadingMessage(`Extraindo dados de ${fileName}...`);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Você é um extrator de laudos laboratoriais veterinários.

TAREFA: Extraia TODOS os valores do exame laboratorial deste documento.

INSTRUÇÕES:
1. Identifique o tipo de exame (hemograma, bioquímica, urinálise, etc.)
2. Extraia TODOS os parâmetros com seus valores e unidades
3. Inclua valores de referência se visíveis
4. Copie observações ou conclusões do laboratório
5. Organize os dados de forma estruturada

FORMATO DE SAÍDA:
TIPO DE EXAME: [identificado]
PARÂMETROS:
- [Nome]: [Valor] [Unidade] (Ref: [valor referência se disponível])
...
OBSERVAÇÕES DO LABORATÓRIO:
[se houver]

Se o PDF estiver ilegível, criptografado, ou não contiver dados laboratoriais reconhecíveis, responda EXATAMENTE: "OCR_FALHOU"

Retorne APENAS os dados extraídos, sem explicações adicionais.`
                },
                {
                  type: "image_url",
                  image_url: { url: pdfBase64 }
                }
              ]
            }
          ],
        }),
      });

      if (!response.ok) {
        console.error("OCR API error:", response.status);
        return { content: "", success: false };
      }

      const data = await response.json();
      const extractedText = data.choices?.[0]?.message?.content || "";
      
      if (extractedText.includes("OCR_FALHOU") || extractedText.trim().length < 20) {
        return { content: "", success: false };
      }
      
      // Validate if key lab values were found
      const hasLabValues = /hemácias|leucócitos|plaquetas|hemoglobina|hematócrito|alt|ast|ureia|creatinina|proteína|glicose|albumina/i.test(extractedText);
      
      if (!hasLabValues && examType === "Hemograma Completo" || examType === "Bioquímica Sérica") {
        return { content: extractedText, success: false };
      }
      
      return { content: extractedText, success: true };
    } catch (error) {
      console.error("Erro ao extrair PDF:", error);
      return { content: "", success: false };
    }
  };

  const handleAnalyze = async () => {
    // Validation
    if (!isProfessional) {
      toast({
        title: "Campo obrigatório",
        description: "Informe se você é profissional da área.",
        variant: "destructive",
      });
      return;
    }

    if (isProfessional === "sim" && !crmv.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Informe seu número de CRMV.",
        variant: "destructive",
      });
      return;
    }

    if (!species || !age.trim() || !weight.trim() || !examType) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha espécie, idade, peso e tipo de exame.",
        variant: "destructive",
      });
      return;
    }

    if (files.length === 0 && !clinicalData.trim()) {
      toast({
        title: "Dados insuficientes",
        description: "Anexe arquivos (imagens ou PDFs) ou descreva os valores clínicos no campo de texto.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult("");
    setOcrFailed(false);
    
    try {
      const userType = isProfessional === "sim" ? "profissional" : "tutor";
      const images = files.filter(f => f.type === "image");
      const pdfs = files.filter(f => f.type === "pdf");
      
      let extractedPdfContent = "";
      let pdfOcrFailed = false;
      const failedPdfs: string[] = [];

      // Process PDFs if any
      if (pdfs.length > 0) {
        setLoadingMessage("Processando PDFs...");
        
        for (const pdf of pdfs) {
          const { content, success } = await extractPdfContent(pdf.url, pdf.name);
          if (success && content) {
            extractedPdfContent += `\n--- Dados de ${pdf.name} ---\n${content}\n`;
          } else {
            failedPdfs.push(pdf.name);
            pdfOcrFailed = true;
          }
        }
      }

      // If OCR failed and no manual data provided, show fallback
      if (pdfOcrFailed && failedPdfs.length > 0 && !clinicalData.trim() && images.length === 0) {
        setOcrFailed(true);
        setShowFallbackInput(true);
        setLoading(false);
        setLoadingMessage("");
        
        toast({
          title: "Não foi possível ler o PDF automaticamente",
          description: "Por favor, insira os valores manualmente no campo abaixo.",
          variant: "destructive",
        });
        return;
      }

      setLoadingMessage("Analisando dados clínicos...");

      const hasImages = images.length > 0;
      const hasExtractedPdf = extractedPdfContent.length > 0;
      const hasTextData = clinicalData.trim().length > 0;

      // Build analysis context
      let analysisContext = "";
      let ocrWarning = "";
      
      if (hasExtractedPdf) {
        analysisContext += `\nDADOS EXTRAÍDOS DOS LAUDOS:\n${extractedPdfContent}\n`;
      }
      if (hasTextData) {
        analysisContext += `\nDADOS CLÍNICOS INFORMADOS PELO USUÁRIO:\n${clinicalData}\n`;
      }
      if (failedPdfs.length > 0) {
        ocrWarning = `AVISO: Os seguintes arquivos não puderam ser lidos automaticamente: ${failedPdfs.join(", ")}. A análise foi realizada com os dados disponíveis.`;
      }
      if (!hasImages && !hasExtractedPdf && !hasTextData) {
        analysisContext = "\nNENHUM DADO LABORATORIAL FOI FORNECIDO.\n";
      }

      const systemPrompt = `Você é a inteligência clínica da ferramenta Interpretação de Exames – VetAgro Sustentável AI.

FUNÇÃO: Analisar exames laboratoriais veterinários (imagens, PDFs, dados textuais) e gerar relatório estruturado, técnico e legível.

${!hasImages && !hasExtractedPdf && !hasTextData ? `
ATENÇÃO: Nenhum dado laboratorial foi fornecido.
Responda orientando o usuário a fornecer os valores, exemplo:
"Para realizar a interpretação, forneça os valores do exame:
- Hemograma: Hemácias, Hemoglobina, Hematócrito, Leucócitos, Plaquetas
- Bioquímica: ALT, AST, Ureia, Creatinina, Proteínas totais
Insira os valores no campo de texto ou anexe o laudo."
` : ""}

${ocrWarning ? `${ocrWarning}` : ""}

ESTRUTURA OBRIGATÓRIA DA RESPOSTA (títulos em MAIÚSCULAS, sem # ou *):

IDENTIFICAÇÃO DO PACIENTE
• Espécie: ${species}
• Idade: ${age}
• Peso: ${weight}
• Tipo de exame: ${examType}
• Tipo de usuário: ${userType === "profissional" ? "Profissional veterinário" : "Tutor/Produtor"}

INTERPRETAÇÃO DA TABELA DE VALORES
• Listar cada parâmetro analisado
• Indicar se está NORMAL, ALTO ou BAIXO
• Correlacionar com possíveis condições clínicas

CONCLUSÕES CLÍNICAS
${userType === "profissional" 
  ? `• Diagnóstico sindrômico
• Fisiopatologia resumida
• Hipóteses diagnósticas ordenadas por probabilidade
• Condutas recomendadas`
  : `• Explicação em linguagem simples e acolhedora
• O que os resultados significam na prática
• Orientações claras para o tutor`}

DIAGNÓSTICOS DIFERENCIAIS
• Listar em ordem de probabilidade (mais provável primeiro)
• Máximo 4 diagnósticos
• Justificar brevemente cada hipótese

EXAMES COMPLEMENTARES RECOMENDADOS
• Exames que ajudariam a confirmar/descartar diagnósticos
• Priorizar por relevância

NÍVEL DE URGÊNCIA
• BAIXO / MODERADO / ALTO / URGÊNCIA
• Sinais de alerta para observar
• Quando procurar emergência
• ${examType.includes("Hemograma") || examType.includes("Bioquímica") ? "Indicar se está liberado para procedimentos cirúrgicos (ex: castração)" : ""}

RECOMENDAÇÕES
${userType === "profissional"
  ? `• Condutas terapêuticas sugeridas
• Manejo clínico
• Monitoramento indicado`
  : `• Cuidados domiciliares
• Sinais que indicam piora
• Quando retornar ao veterinário`}

REFERÊNCIAS
• Merck Veterinary Manual
• Nelson & Couto – Medicina Interna de Pequenos Animais
• Ettinger & Feldman – Veterinary Internal Medicine
• VIN Veterinary Information Network

RODAPÉ OBRIGATÓRIO:
"Esta análise tem caráter educativo e não substitui a consulta veterinária presencial."
"Relatório gerado via VetAgro Sustentável AI – Análise Assistida © 2025"

REGRAS DE FORMATAÇÃO:
- NUNCA use hashtags (#), asteriscos (*) ou emojis
- Use apenas marcadores: • ou –
- Títulos das seções em MAIÚSCULAS
- Parágrafos organizados e claros
- Números sempre com unidades`;

      const userPrompt = `Interprete os seguintes exames veterinários:

DADOS DO PACIENTE:
• Espécie: ${species}
• Idade: ${age}
• Peso: ${weight}
• Tipo de exame: ${examType}
${analysisContext}

TIPO DE USUÁRIO: ${userType}
${isProfessional === "sim" ? `CRMV: ${crmv}` : ""}

Gere o relatório estruturado conforme as instruções.`;

      // Build messages array with multimodal support
      const messages: any[] = [
        { role: "system", content: systemPrompt }
      ];

      // If images are present, use multimodal content
      if (hasImages) {
        const userContent: any[] = [
          { type: "text", text: userPrompt }
        ];
        
        for (const img of images) {
          userContent.push({
            type: "image_url",
            image_url: { url: img.url }
          });
        }
        
        messages.push({ role: "user", content: userContent });
      } else {
        messages.push({ role: "user", content: userPrompt });
      }

      setLoadingMessage("Gerando interpretação...");

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: messages,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("RATE_LIMIT");
        }
        if (response.status === 402) {
          throw new Error("CREDITS_INSUFFICIENT");
        }
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        throw new Error("API_ERROR");
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content;

      if (!answer || answer.trim().length < 50) {
        throw new Error("EMPTY_RESPONSE");
      }

      // Clean and format the response
      const cleanedResult = cleanTextForDisplay(answer);

      setResult(cleanedResult);
      toast({
        title: "Análise concluída",
        description: "Interpretação dos exames gerada com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro:", error);
      
      // Generate intelligent fallback based on error type
      let errorMessage = "";
      let fallbackResult = "";
      
      switch (error.message) {
        case "RATE_LIMIT":
          errorMessage = "Limite de requisições excedido. Aguarde alguns minutos e tente novamente.";
          break;
        case "CREDITS_INSUFFICIENT":
          errorMessage = "Créditos insuficientes. Atualize seu plano para continuar usando a ferramenta.";
          break;
        case "EMPTY_RESPONSE":
          errorMessage = "Não conseguimos gerar uma interpretação completa. Verifique os dados inseridos.";
          break;
        default:
          errorMessage = "Ocorreu um erro ao processar a análise.";
      }
      
      // Generate fallback report if we have any data
      if (clinicalData.trim() || files.length > 0) {
        fallbackResult = `IDENTIFICAÇÃO DO PACIENTE
• Espécie: ${species}
• Idade: ${age}
• Peso: ${weight}
• Tipo de exame: ${examType}

AVISO DE PROCESSAMENTO
Não foi possível realizar a análise automática completa neste momento.

DADOS FORNECIDOS
${clinicalData || "Arquivos anexados aguardando processamento"}

O QUE FAZER
Para continuar, você pode:
• Aguardar alguns minutos e tentar novamente
• Inserir os valores do exame manualmente no campo de texto
• Verificar se o arquivo está legível e não está corrompido

VALORES IMPORTANTES PARA HEMOGRAMA
Se você possui um hemograma, informe:
• Hemácias (milhões/µL)
• Hemoglobina (g/dL)
• Hematócrito (%)
• Leucócitos totais (/µL)
• Plaquetas (/µL)

VALORES IMPORTANTES PARA BIOQUÍMICA
• ALT/TGP (U/L)
• AST/TGO (U/L)
• Ureia (mg/dL)
• Creatinina (mg/dL)
• Proteínas totais (g/dL)

RECOMENDAÇÃO
Consulte um médico veterinário para interpretação presencial dos exames.

---
Relatório gerado via VetAgro Sustentável AI – Análise Assistida © 2025`;

        setResult(fallbackResult);
        setShowFallbackInput(true);
      }
      
      toast({
        title: "Erro na análise",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  const handleNewAnalysis = (type: string) => {
    setResult("");
    setFiles([]);
    setClinicalData("");
    setOcrFailed(false);
    setShowFallbackInput(false);
    setExamType(type);
    
    toast({
      title: "Nova análise",
      description: `Preparado para ${type}. Anexe os arquivos ou insira os dados.`,
    });
  };

  const imageCount = files.filter(f => f.type === "image").length;
  const pdfCount = files.filter(f => f.type === "pdf").length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Interpretação de Exames
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Hemograma, bioquímica, imagem, PDFs de laudos e outros exames veterinários
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Identificação</CardTitle>
            <CardDescription>
              A resposta será adaptada ao seu perfil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={isProfessional} onValueChange={setIsProfessional}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="prof-sim" />
                <Label htmlFor="prof-sim">
                  Sou profissional veterinário (resposta técnica)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="prof-nao" />
                <Label htmlFor="prof-nao">
                  Sou tutor/produtor (resposta simplificada)
                </Label>
              </div>
            </RadioGroup>

            {isProfessional === "sim" && (
              <div className="space-y-2">
                <Label htmlFor="crmv">CRMV *</Label>
                <Input
                  id="crmv"
                  placeholder="Ex: CRMV-SP 12345"
                  value={crmv}
                  onChange={(e) => setCrmv(e.target.value)}
                />
              </div>
            )}

            {isProfessional === "nao" && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  A resposta será simplificada. Para diagnóstico e tratamento, consulte um médico veterinário.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do Paciente</CardTitle>
            <CardDescription>
              Informações do animal para contextualização
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="species">Espécie *</Label>
                <Select value={species} onValueChange={setSpecies}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {speciesOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Idade *</Label>
                <Input
                  id="age"
                  placeholder="Ex: 5 anos"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Peso *</Label>
                <Input
                  id="weight"
                  placeholder="Ex: 25 kg"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="examType">Tipo de Exame *</Label>
              <Select value={examType} onValueChange={setExamType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de exame" />
                </SelectTrigger>
                <SelectContent>
                  {examTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Dados do Exame
            </CardTitle>
            <CardDescription>
              Anexe imagens (raio-x, ultrassom) e/ou PDFs (hemograma, bioquímica, laudos).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <Input
                type="file"
                accept="image/*,.pdf,application/pdf"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="exam-files"
              />
              <label htmlFor="exam-files" className="cursor-pointer">
                <div className="flex justify-center gap-2 mb-3">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <FileUp className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Clique para anexar arquivos</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Imagens (JPG, PNG) ou PDFs de laudos laboratoriais
                </p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  {imageCount > 0 && <span>{imageCount} imagem(ns)</span>}
                  {imageCount > 0 && pdfCount > 0 && <span>e</span>}
                  {pdfCount > 0 && <span>{pdfCount} PDF(s)</span>}
                  <span>✓</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {files.map((file, index) => (
                    <div key={index} className="relative group">
                      {file.type === "image" ? (
                        <img
                          src={file.url}
                          alt={`Exame ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg border border-border"
                        />
                      ) : (
                        <div className="w-full h-20 rounded-lg border border-border bg-muted flex flex-col items-center justify-center">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground mt-1 px-2 truncate w-full text-center">
                            {file.name}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* OCR Fallback Alert */}
            {ocrFailed && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>O exame não foi reconhecido automaticamente.</strong>
                  <br />
                  Por favor, descreva os valores manualmente abaixo:
                  <br />
                  <em>Exemplo: Hemácias 5,2; Hemoglobina 13 g/dL; Plaquetas 190.000; Leucócitos 12.000</em>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="clinicalData">
                {showFallbackInput 
                  ? "Insira os valores do exame manualmente *" 
                  : "Valores/Dados Clínicos (opcional se anexar arquivos)"}
              </Label>
              <Textarea
                id="clinicalData"
                placeholder={showFallbackInput 
                  ? "Ex: Hemácias 5.2 milhões/µL, Hemoglobina 13 g/dL, Leucócitos 18.000/µL, Plaquetas 190.000/µL, ALT 120 U/L..."
                  : "Ex: Hemácias 5.2 milhões/µL, Leucócitos 18.000/µL, ALT 120 U/L, Creatinina 1.8 mg/dL, histórico de apatia há 3 dias..."}
                value={clinicalData}
                onChange={(e) => setClinicalData(e.target.value)}
                className={`min-h-[120px] ${showFallbackInput ? "border-primary" : ""}`}
              />
              <p className="text-xs text-muted-foreground">
                {showFallbackInput 
                  ? "Copie os valores principais do seu laudo: hemácias, hemoglobina, leucócitos, plaquetas, bioquímica, etc."
                  : "Descreva os valores encontrados no exame, histórico clínico e sinais observados."}
              </p>
            </div>

            {pdfCount > 0 && !ocrFailed && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Os PDFs serão processados automaticamente com OCR. Se não conseguirmos extrair os dados, você receberá orientação para inserir manualmente.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={handleAnalyze}
          disabled={loading || !isProfessional}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {loadingMessage || "Analisando arquivos e dados clínicos..."}
            </>
          ) : (
            <>
              <Stethoscope className="mr-2 h-5 w-5" />
              Interpretar Exames
            </>
          )}
        </Button>

        {result && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Interpretação</CardTitle>
                  <CardDescription>
                    {isProfessional === "sim" 
                      ? "Análise técnica para profissional" 
                      : "Explicação simplificada"}
                  </CardDescription>
                </div>
                <ReportExporter
                  title={`Interpretação de ${examType}`}
                  content={result}
                  toolName="Interpretação de Exames"
                  references={getReferences()}
                  userInputs={getUserInputs()}
                  showAllFormats={true}
                />
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm leading-relaxed">
                    {result}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feedback Section */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Deseja reenviar outro exame?
                </CardTitle>
                <CardDescription>
                  Selecione o tipo de exame para nova análise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleNewAnalysis("Hemograma Completo")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Hemograma
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleNewAnalysis("Bioquímica Sérica")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Bioquímica
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleNewAnalysis("Raio-X")}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Raio-X
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleNewAnalysis("Ultrassonografia")}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Ultrassonografia
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default InterpretacaoExames;
