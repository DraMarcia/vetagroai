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
import { FileText, Loader2, Upload, Image as ImageIcon, X, AlertTriangle, FileUp } from "lucide-react";
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
    "Nelson & Couto — Medicina Interna de Pequenos Animais",
    "Ettinger & Feldman — Veterinary Internal Medicine",
    "Thrall MA — Veterinary Diagnostic Imaging",
    "Thrall MA — Hematologia e Bioquímica Clínica Veterinária"
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

  const extractPdfContent = async (pdfBase64: string): Promise<string> => {
    try {
      // Use Lovable AI to extract text from PDF via OCR
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
                  text: `Extraia TODO o texto deste documento PDF de exame laboratorial veterinário. 
                  
INSTRUÇÕES:
- Extraia todos os valores laboratoriais (hemograma, bioquímica, etc.)
- Mantenha os valores numéricos e unidades exatamente como aparecem
- Se houver observações ou interpretações do laboratório, inclua-as
- Se o PDF estiver ilegível ou criptografado, retorne: "PDF_NAO_LEGIVEL"
- Organize os dados de forma clara e estruturada

Retorne APENAS o conteúdo extraído, sem comentários adicionais.`
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
        return "PDF_ERRO_LEITURA";
      }

      const data = await response.json();
      const extractedText = data.choices?.[0]?.message?.content || "PDF_ERRO_LEITURA";
      return extractedText;
    } catch (error) {
      console.error("Erro ao extrair PDF:", error);
      return "PDF_ERRO_LEITURA";
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
    
    try {
      const userType = isProfessional === "sim" ? "profissional" : "tutor";
      const images = files.filter(f => f.type === "image");
      const pdfs = files.filter(f => f.type === "pdf");
      
      let extractedPdfContent = "";
      let pdfWarning = "";

      // Process PDFs if any
      if (pdfs.length > 0) {
        setLoadingMessage("Extraindo dados dos PDFs...");
        
        const pdfContents: string[] = [];
        for (const pdf of pdfs) {
          const content = await extractPdfContent(pdf.url);
          if (content === "PDF_NAO_LEGIVEL" || content === "PDF_ERRO_LEITURA") {
            pdfWarning = `Não conseguimos ler automaticamente o PDF "${pdf.name}". Os valores do laudo devem ser descritos no campo de texto.`;
          } else {
            pdfContents.push(`--- Conteúdo de ${pdf.name} ---\n${content}`);
          }
        }
        
        if (pdfContents.length > 0) {
          extractedPdfContent = pdfContents.join("\n\n");
        }
      }

      setLoadingMessage("Analisando dados clínicos...");

      const hasImages = images.length > 0;
      const hasExtractedPdf = extractedPdfContent.length > 0;
      const hasTextData = clinicalData.trim().length > 0;

      // Build analysis context
      let analysisContext = "";
      if (hasExtractedPdf) {
        analysisContext += `\nDADOS EXTRAÍDOS DO PDF:\n${extractedPdfContent}\n`;
      }
      if (hasTextData) {
        analysisContext += `\nDADOS CLÍNICOS INFORMADOS:\n${clinicalData}\n`;
      }
      if (!hasImages && !hasExtractedPdf && !hasTextData) {
        analysisContext = "\nNENHUM DADO FOI FORNECIDO PARA ANÁLISE.\n";
      }

      const systemPrompt = `Você é a inteligência clínica da ferramenta Interpretação de Exames – VetAgro Sustentável AI.

Sua função: analisar imagens de exames (quando fornecidas), dados de PDFs extraídos e/ou texto clínico fornecido pelo usuário, gerando um relatório estruturado, legível e técnico.

${!hasImages ? "IMPORTANTE: Nenhuma imagem foi enviada — análise realizada apenas com as informações clínicas/laboratoriais fornecidas." : ""}
${pdfWarning ? `AVISO: ${pdfWarning}` : ""}

ESTRUTURA OBRIGATÓRIA DA RESPOSTA (use exatamente estes títulos em MAIÚSCULAS):

IDENTIFICAÇÃO DO CASO
• Espécie: ${species}
• Idade: ${age}
• Peso: ${weight}
• Tipo de exame: ${examType}
• Tipo de usuário: ${userType === "profissional" ? "Profissional veterinário" : "Tutor/Produtor"}
• Arquivos analisados: ${hasImages ? `${images.length} imagem(ns)` : ""}${hasExtractedPdf ? `${hasImages ? " e " : ""}${pdfs.length} PDF(s)` : ""}${!hasImages && !hasExtractedPdf ? "Apenas dados textuais" : ""}

AVALIAÇÃO CLÍNICA
${userType === "profissional" 
  ? "• Forneça análise técnica detalhada dos parâmetros\n• Inclua valores de referência quando disponíveis\n• Use terminologia técnica apropriada\n• Correlacione achados laboratoriais"
  : "• Explique de forma simples e acessível\n• Evite termos técnicos complexos\n• Foque no significado prático dos resultados"}

ACHADOS DE EXAME
${hasImages 
  ? "• Descreva os achados visuais identificados na(s) imagem(ns)\n• Correlacione com dados laboratoriais se disponíveis"
  : "• Interprete os valores laboratoriais fornecidos\n• Identifique alterações significativas"}
${hasExtractedPdf ? "• Analise os dados extraídos do PDF laboratorial" : ""}

DIAGNÓSTICOS DIFERENCIAIS
• Liste em ordem de probabilidade (mais provável primeiro)
• Máximo de 4 diagnósticos principais
• Justifique brevemente cada hipótese com base nos achados

EXAMES COMPLEMENTARES RECOMENDADOS
• Liste exames que ajudariam a confirmar/descartar diagnósticos
• Priorize por relevância e urgência

NÍVEL DE URGÊNCIA
• Indique o nível: BAIXO, MODERADO, ALTO ou URGÊNCIA
• Descreva sinais de alerta que o tutor/profissional deve observar

RECOMENDAÇÕES PRÁTICAS
${userType === "profissional"
  ? "• Condutas terapêuticas sugeridas\n• Manejo clínico recomendado\n• Monitoramento indicado"
  : "• Orientações claras e acessíveis\n• Cuidados domiciliares quando apropriado\n• Sinais que indicam necessidade de atendimento urgente"}

ALERTA LEGAL
Esta análise tem caráter educativo e não substitui a consulta veterinária presencial.

REFERÊNCIAS
• Merck Veterinary Manual (11th Edition)
• Nelson & Couto — Medicina Interna de Pequenos Animais
• Ettinger & Feldman — Veterinary Internal Medicine
• Thrall MA — Veterinary Diagnostic Imaging

REGRAS DE FORMATAÇÃO OBRIGATÓRIAS:
- NUNCA use hashtags (#), asteriscos (*) ou emojis
- Use apenas marcadores simples: • ou –
- Mantenha títulos das seções em MAIÚSCULAS
- Estruture em parágrafos claros e organizados`;

      const userPrompt = `Interprete os seguintes exames veterinários:

DADOS DO PACIENTE:
• Espécie: ${species}
• Idade: ${age}
• Peso: ${weight}
• Tipo de exame: ${examType}
${analysisContext}

TIPO DE USUÁRIO: ${userType}
${isProfessional === "sim" ? `CRMV: ${crmv}` : ""}

Gere o relatório estruturado conforme as instruções do sistema.`;

      // Build messages array with multimodal support
      const messages: any[] = [
        { role: "system", content: systemPrompt }
      ];

      // If images are present, use multimodal content
      if (hasImages) {
        const userContent: any[] = [
          { type: "text", text: userPrompt }
        ];
        
        // Add each image to the content
        for (const img of images) {
          userContent.push({
            type: "image_url",
            image_url: { url: img.url }
          });
        }
        
        messages.push({ role: "user", content: userContent });
      } else {
        // Text-only request
        messages.push({ role: "user", content: userPrompt });
      }

      setLoadingMessage("Gerando interpretação...");

      // Call Lovable AI Gateway directly
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
          throw new Error("Limite de requisições excedido. Tente novamente em alguns minutos.");
        }
        if (response.status === 402) {
          throw new Error("Créditos insuficientes. Atualize seu plano para continuar.");
        }
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        throw new Error(`Erro ao processar análise. Tente novamente.`);
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || "Não foi possível gerar a interpretação.";

      // Clean and format the response
      let cleanedResult = cleanTextForDisplay(answer);
      
      // Add PDF warning if needed
      if (pdfWarning) {
        cleanedResult = `AVISO: ${pdfWarning}\n\n${cleanedResult}`;
      }

      // Add footer
      cleanedResult += "\n\n---\nRelatório gerado via VetAgro Sustentável AI — Análise Assistida, não substitui consulta presencial veterinária registrada. © 2025";

      setResult(cleanedResult);
      toast({
        title: "Análise concluída",
        description: "Interpretação dos exames gerada com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro:", error);
      
      // Fallback: try to provide basic guidance based on text input
      if (clinicalData.trim()) {
        const fallbackResult = `IDENTIFICAÇÃO DO CASO
• Espécie: ${species}
• Idade: ${age}
• Peso: ${weight}
• Tipo de exame: ${examType}

AVISO IMPORTANTE
Ocorreu um erro técnico ao processar a análise completa. Abaixo estão orientações básicas baseadas nos dados fornecidos.

DADOS INFORMADOS
${clinicalData}

RECOMENDAÇÃO
Por favor, consulte um médico veterinário para interpretação completa dos exames. Se o problema persistir, tente novamente em alguns minutos ou descreva os valores de forma mais detalhada.

ALERTA LEGAL
Esta análise tem caráter educativo e não substitui a consulta veterinária presencial.

---
Relatório gerado via VetAgro Sustentável AI — Análise Assistida © 2025`;

        setResult(fallbackResult);
        toast({
          title: "Análise parcial",
          description: "Houve um erro, mas geramos orientações básicas. Consulte um veterinário.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao analisar",
          description: error.message || "Tente novamente mais tarde ou descreva os valores no campo de texto.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
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
              Anexe imagens (raio-x, ultrassom) e/ou PDFs (hemograma, bioquímica, laudos). A ferramenta extrai automaticamente os dados.
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

            <div className="space-y-2">
              <Label htmlFor="clinicalData">Valores/Dados Clínicos (opcional se anexar arquivos)</Label>
              <Textarea
                id="clinicalData"
                placeholder="Ex: Hemácias 5.2 milhões/µL, Leucócitos 18.000/µL, ALT 120 U/L, Creatinina 1.8 mg/dL, histórico de apatia há 3 dias..."
                value={clinicalData}
                onChange={(e) => setClinicalData(e.target.value)}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                Descreva os valores encontrados no exame, histórico clínico e sinais observados. Se anexar imagens/PDFs, este campo complementa a análise.
              </p>
            </div>

            {pdfCount > 0 && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Os PDFs serão processados automaticamente. Se não conseguirmos extrair os dados, você receberá orientação para inserir manualmente.
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
              {loadingMessage || "Analisando..."}
            </>
          ) : (
            <>
              <FileText className="mr-2 h-5 w-5" />
              Interpretar Exames
            </>
          )}
        </Button>

        {result && (
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
        )}
      </div>
    </div>
  );
};

export default InterpretacaoExames;
