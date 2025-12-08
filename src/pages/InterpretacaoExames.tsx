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
import { FileText, Loader2, Upload, Image as ImageIcon, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ReportExporter } from "@/components/ReportExporter";
import { cleanTextForDisplay } from "@/lib/textUtils";

const InterpretacaoExames = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isProfessional, setIsProfessional] = useState("");
  const [crmv, setCrmv] = useState("");
  const [species, setSpecies] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [examType, setExamType] = useState("");
  const [images, setImages] = useState<{ url: string; name: string }[]>([]);
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    const imagePromises = fileArray.map((file) => {
      return new Promise<{ url: string; name: string }>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve({
          url: reader.result as string,
          name: file.name
        });
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then((loadedImages) => {
      setImages(prev => [...prev, ...loadedImages]);
      toast({
        title: "Imagens carregadas",
        description: `${loadedImages.length} arquivo(s) adicionado(s).`,
      });
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const getReferences = () => [
    "Merck Veterinary Manual (11th Edition)",
    "Nelson & Couto — Medicina Interna de Pequenos Animais",
    "Ettinger & Feldman — Veterinary Internal Medicine",
    "Thrall MA — Veterinary Diagnostic Imaging",
    "Thrall MA — Hematologia e Bioquímica Clínica Veterinária"
  ];

  const getUserInputs = () => ({
    "Tipo de Usuário": isProfessional === "sim" ? "Profissional Veterinário" : "Tutor/Produtor",
    ...(isProfessional === "sim" && crmv ? { "CRMV": crmv } : {}),
    "Espécie": species,
    "Idade": age,
    "Peso": weight,
    "Tipo de Exame": examType,
    "Imagens Anexadas": images.length > 0 ? `${images.length} imagem(ns)` : "Nenhuma",
    ...(clinicalData ? { "Dados Clínicos": clinicalData.substring(0, 200) + (clinicalData.length > 200 ? "..." : "") } : {}),
  });

  const handleAnalyze = async () => {
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

    if (images.length === 0 && !clinicalData.trim()) {
      toast({
        title: "Dados insuficientes",
        description: "Anexe imagens dos exames ou descreva os valores clínicos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const userType = isProfessional === "sim" ? "profissional" : "tutor";
      const hasImages = images.length > 0;
      
      const systemPrompt = `Você é a inteligência clínica da ferramenta Interpretação de Exames – VetAgro Sustentável AI.

Sua função: analisar imagem (quando fornecida) + texto clínico e gerar um relatório estruturado, legível e técnico.

${!hasImages ? `IMPORTANTE: Nenhuma imagem foi enviada — análise realizada apenas com as informações clínicas fornecidas.` : ""}

ESTRUTURA OBRIGATÓRIA DA RESPOSTA (use exatamente estes títulos em MAIÚSCULAS):

IDENTIFICAÇÃO DO CASO
• Espécie: ${species}
• Idade: ${age}
• Peso: ${weight}
• Tipo de exame: ${examType}
• Tipo de usuário: ${userType === "profissional" ? "Profissional veterinário" : "Tutor/Produtor"}

AVALIAÇÃO CLÍNICA
${userType === "profissional" 
  ? "• Forneça análise técnica detalhada dos parâmetros\n• Inclua valores de referência\n• Use terminologia técnica apropriada"
  : "• Explique de forma simples e acessível\n• Evite termos técnicos complexos\n• Foque no significado prático dos resultados"}

ACHADOS NA IMAGEM
${hasImages 
  ? "• Descreva os achados visuais identificados na(s) imagem(ns)"
  : "• Nenhuma imagem foi anexada para análise visual"}

DIAGNÓSTICOS DIFERENCIAIS
• Liste em ordem de probabilidade (mais provável primeiro)
• Máximo de 4 diagnósticos principais
• Justifique brevemente cada hipótese

EXAMES COMPLEMENTARES RECOMENDADOS
• Liste exames que ajudariam a confirmar/descartar diagnósticos
• Priorize por relevância

CLASSIFICAÇÃO DE URGÊNCIA
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

DADOS CLÍNICOS/VALORES:
${clinicalData || "Não foram fornecidos dados clínicos textuais."}

${hasImages ? `IMAGENS: ${images.length} imagem(ns) anexada(s) para análise.` : "IMAGENS: Nenhuma imagem foi anexada."}

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

      // Call Lovable AI Gateway directly (no Edge Function dependency)
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
        throw new Error(`Erro ao processar análise: ${response.status}`);
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || "Não foi possível gerar a interpretação.";

      // Clean and format the response
      const cleanedResult = cleanTextForDisplay(answer);

      setResult(cleanedResult);
      toast({
        title: "Análise concluída",
        description: "Interpretação dos exames gerada com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro ao analisar",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
              Interpretação de Exames
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Hemograma, bioquímica, imagem e outros exames veterinários
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
              Anexe imagens e/ou descreva os valores do exame. A análise funciona com texto, imagem ou ambos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="exam-images"
              />
              <label htmlFor="exam-images" className="cursor-pointer">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Clique para anexar imagens</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Fotos do exame, laudos, resultados (JPG, PNG)
                </p>
              </label>
            </div>

            {images.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-primary">
                  {images.length} imagem(ns) carregada(s) ✓
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.url}
                        alt={`Exame ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg border border-border"
                      />
                      <button
                        onClick={() => removeImage(index)}
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
              <Label htmlFor="clinicalData">Valores/Dados Clínicos (opcional se tiver imagens)</Label>
              <Textarea
                id="clinicalData"
                placeholder="Ex: Hemácias 5.2 milhões/µL, Leucócitos 18.000/µL, ALT 120 U/L, Creatinina 1.8 mg/dL..."
                value={clinicalData}
                onChange={(e) => setClinicalData(e.target.value)}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                Descreva os valores encontrados no exame. Se anexar imagens, este campo é opcional.
              </p>
            </div>
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
              Analisando exames...
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