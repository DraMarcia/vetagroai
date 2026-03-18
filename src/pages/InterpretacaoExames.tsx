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
import { MarkdownTableRenderer } from "@/components/MarkdownTableRenderer";
import { ResponseActionButtons } from "@/components/ResponseActionButtons";
import { resilientInvoke, extractAnswer } from "@/lib/resilientInvoke";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useCrmvValidation, UFS, SPECIES_OPTIONS } from "@/hooks/useCrmvValidation";

interface UploadedFile {
  url: string;
  name: string;
  type: "image" | "pdf";
}

const InterpretacaoExames = () => {
  const { toast } = useToast();
  const { plan } = useSubscription();
  const { validateAndNotify } = useCrmvValidation();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [isProfessional, setIsProfessional] = useState("");
  const [crmv, setCrmv] = useState("");
  const [uf, setUf] = useState("");
  const [species, setSpecies] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [examType, setExamType] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [clinicalData, setClinicalData] = useState("");
  const [result, setResult] = useState("");
  const [showFallbackInput, setShowFallbackInput] = useState(false);
  const [ocrFailed, setOcrFailed] = useState(false);
  const [canExportPdf, setCanExportPdf] = useState(false);

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

    // Gate keeper: CRMV + UF validation for professionals
    if (isProfessional === "sim") {
      const crmvResult = validateAndNotify(true, crmv, uf);
      if (!crmvResult.isValid) {
        return;
      }
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
    setLoadingMessage("Enviando dados para análise...");
    
    try {
      // Prepare request body for Edge Function
      const requestBody = {
        files: files.map(f => ({
          url: f.url,
          type: f.type,
          name: f.name
        })),
        clinicalData: clinicalData.trim(),
        userType: isProfessional === "sim" ? "profissional" : "tutor",
        crmv: isProfessional === "sim" ? crmv : undefined,
        patient: {
          species,
          age,
          weight
        },
        examType,
        plan: plan || "free"
      };

      setLoadingMessage("Processando exames (OCR e análise)...");

      // Call the Edge Function
      const res = await resilientInvoke("interpret-exams", requestBody, { answerField: "analysis" });

      if (!res.ok) {
        // Generate fallback guidance instead of showing technical error
        throw new Error(res.friendlyError || "Não foi possível processar a análise.");
      }

      const data = res.data;

      // Check for API errors returned in the response
      if (data?.error) {
        const errorCode = data.code;
        
        if (errorCode === "RATE_LIMIT") {
          toast({
            title: "Limite de requisições",
            description: "Aguarde 2 minutos e tente novamente.",
            variant: "destructive",
          });
          return;
        }
        
        if (errorCode === "CREDITS_INSUFFICIENT") {
          toast({
            title: "Créditos insuficientes",
            description: "Atualize seu plano para continuar.",
            variant: "destructive",
          });
          return;
        }
        
        throw new Error(data.error);
      }

      // Success! Set the result
      if (data?.analysis) {
        setResult(data.analysis);
        setCanExportPdf(data.canExportPdf !== false);
        
        // Show image fallback notice
        if (data.imageFallback) {
          toast({
            title: "Análise clínica gerada",
            description: "A imagem não pôde ser interpretada. Os diagnósticos foram gerados com base nos dados clínicos.",
          });
        } else if (data.ocrErrors && data.ocrErrors.length > 0) {
          toast({
            title: "Alguns arquivos não foram lidos",
            description: `Arquivos não processados: ${data.ocrErrors.join(", ")}. A análise foi feita com os dados disponíveis.`,
          });
        } else {
          toast({
            title: "Análise concluída",
            description: "Interpretação dos exames gerada com sucesso.",
          });
        }
      } else {
        throw new Error("Resposta vazia da análise");
      }

    } catch (error: any) {
      console.error("Erro:", error);
      
      // Generate fallback guidance
      const fallbackResult = `IDENTIFICAÇÃO DO PACIENTE
• Espécie: ${species}
• Idade: ${age}
• Peso: ${weight}
• Tipo de exame: ${examType}

AVISO DE PROCESSAMENTO
Não foi possível realizar a análise automática neste momento.

POSSÍVEIS CAUSAS
• O arquivo enviado pode estar ilegível ou corrompido
• O PDF pode estar protegido ou escaneado em baixa qualidade
• Problema temporário de conexão

O QUE FAZER
1. Insira os valores manualmente no campo de texto abaixo
2. Tente enviar uma imagem mais nítida do exame
3. Aguarde alguns minutos e tente novamente

VALORES IMPORTANTES PARA INFORMAR

Hemograma:
• Hemácias, Hemoglobina, Hematócrito
• Leucócitos totais e diferencial
• Plaquetas

Bioquímica:
• ALT, AST, Ureia, Creatinina
• Proteínas totais, Albumina
• Glicose (se disponível)

RECOMENDAÇÃO
Consulte um médico veterinário para interpretação presencial dos exames.

---
Esta análise tem caráter educativo e não substitui a consulta veterinária presencial.
Relatório gerado via VetAgro Sustentável AI © 2025`;

      setResult(fallbackResult);
      setShowFallbackInput(true);
      setCanExportPdf(false);
      
      toast({
        title: "Atenção",
        description: "A análise automática não pôde ser concluída. Insira os dados manualmente para continuar.",
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
    setCanExportPdf(false);
    
    toast({
      title: "Nova análise",
      description: `Preparado para ${type}. Anexe os arquivos ou insira os dados.`,
    });
  };

  const imageCount = files.filter(f => f.type === "image").length;
  const pdfCount = files.filter(f => f.type === "pdf").length;

  // === SAFE COPY FUNCTION ===
  const [copied, setCopied] = useState(false);
  
  const handleCopyReport = async () => {
    if (!result) return;
    
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "Relatório copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar. Selecione o texto manualmente.",
        variant: "destructive",
      });
    }
  };

  // === ISOLATED PDF GENERATION ===
  const [pdfLoading, setPdfLoading] = useState(false);
  
  const handleGeneratePdfExperimental = async () => {
    if (!result) return;
    
    setPdfLoading(true);
    
    try {
      // Dynamic import to isolate PDF generation
      const { exportToPDF } = await import("@/lib/reportExport");
      
      const reportData = {
        title: `Interpretação de ${examType}`,
        content: result,
        toolName: "Interpretação de Exames",
        references: getReferences(),
        userInputs: getUserInputs(),
        date: new Date()
      };
      
      await exportToPDF(reportData);
      
      toast({
        title: "PDF gerado!",
        description: "Download iniciado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "PDF temporariamente indisponível",
        description: "Utilize o botão Copiar Relatório como alternativa.",
        variant: "destructive",
      });
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Interpretação de Exames Laboratoriais e de Imagem
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Hemograma, bioquímica, imagem, PDFs de laudos e outros exames veterinários
            </p>
          </div>
        </div>

        {/* Bloco Explicativo Padronizado */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed mb-4">
            Ferramenta de interpretação de exames laboratoriais e de imagem veterinários. Analisa arquivos (PDF, imagens) ou dados digitados, correlaciona achados com o contexto clínico e gera relatório interpretativo completo.
          </p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <p className="font-medium text-sm text-foreground mb-1">O que faz</p>
              <p className="text-xs text-muted-foreground">Interpreta exames correlacionando valores com contexto clínico do paciente</p>
            </div>
            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <p className="font-medium text-sm text-foreground mb-1">Para quem é</p>
              <p className="text-xs text-muted-foreground">Médicos Veterinários, laboratórios veterinários e tutores</p>
            </div>
            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <p className="font-medium text-sm text-foreground mb-1">Quando usar</p>
              <p className="text-xs text-muted-foreground">Ao receber resultados de exames que necessitam de interpretação clínica</p>
            </div>
            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <p className="font-medium text-sm text-foreground mb-1">O que você recebe</p>
              <p className="text-xs text-muted-foreground">Valores alterados, interpretação clínica, correlação diagnóstica e recomendações</p>
            </div>
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
              <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-foreground">CRMV obrigatório para respostas técnicas</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="crmv">Número CRMV *</Label>
                    <Input
                      id="crmv"
                      placeholder="Ex: 12345"
                      value={crmv}
                      onChange={(e) => setCrmv(e.target.value.replace(/\D/g, ""))}
                      maxLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uf">UF *</Label>
                    <Select value={uf} onValueChange={setUf}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {UFS.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  CRMV e UF obrigatórios para emissão de análise técnica completa
                </p>
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
                    {SPECIES_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
                  <strong>O PDF foi lido, porém os valores não puderam ser extraídos automaticamente.</strong>
                  <br />
                  Por favor, insira os valores manualmente no campo abaixo:
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
          disabled={loading}
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
              <CardHeader>
                <CardTitle className="text-lg">Interpretação</CardTitle>
                <CardDescription>
                  {isProfessional === "sim" 
                    ? "Análise técnica para profissional" 
                    : "Explicação simplificada"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <MarkdownTableRenderer 
                  content={result}
                  className="prose prose-sm max-w-none bg-muted p-4 rounded-lg text-sm leading-relaxed"
                />

                {/* Action Buttons - Padrão Global */}
                <div className="pt-4 border-t border-border">
                  <ResponseActionButtons
                    content={result}
                    title={`Interpretação de ${examType}`}
                    toolName="Interpretação de Exames Veterinários"
                  />
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
