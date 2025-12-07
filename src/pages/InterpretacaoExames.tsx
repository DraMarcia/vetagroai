import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2, Download, Upload, Image as ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ReportExporter } from "@/components/ReportExporter";

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
        description: "Anexe imagens dos exames ou descreva os valores.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const userType = isProfessional === "sim" ? "profissional" : "tutor";
      
      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          tool: "interpretacao-exames",
          question: `Interprete os seguintes exames veterinários:

DADOS DO PACIENTE:
• Espécie: ${species}
• Idade: ${age}
• Peso: ${weight}
• Tipo de exame: ${examType}

DADOS CLÍNICOS/VALORES:
${clinicalData || "Analisar a partir das imagens anexadas"}

TIPO DE USUÁRIO: ${userType}
${isProfessional === "sim" ? `CRMV: ${crmv}` : ""}

INSTRUÇÕES:
${isProfessional === "sim" ? `
- Forneça uma interpretação TÉCNICA e DETALHADA
- Inclua possíveis diagnósticos diferenciais
- Sugira exames complementares se necessário
- Indique condutas terapêuticas possíveis
- Use terminologia técnica apropriada
- Cite valores de referência quando aplicável
` : `
- Forneça uma explicação SIMPLES e COMPREENSÍVEL
- Evite termos técnicos complexos ou explique-os
- Foque no significado prático dos resultados
- Indique claramente o que está normal e alterado
- NÃO sugira tratamentos específicos
`}

Estruture a resposta em:
1. Resumo Geral
2. Análise dos Parâmetros
3. ${isProfessional === "sim" ? "Diagnósticos Diferenciais" : "O que isso significa"}
4. ${isProfessional === "sim" ? "Recomendações Técnicas" : "Próximos Passos Sugeridos"}
5. Referências Científicas`,
          isProfessional: isProfessional === "sim",
          images: images.map(img => img.url),
          context: `Interpretação de ${examType} - ${species}`,
        },
      });

      if (error) throw error;

      // Limpar formatação e adicionar disclaimers
      let interpretation = data.answer
        .replace(/\*\*/g, '')
        .replace(/##/g, '')
        .replace(/###/g, '')
        .replace(/\*/g, '•')
        .replace(/#+\s*/g, '');

      if (isProfessional === "sim") {
        interpretation += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOTAS PROFISSIONAIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Correlacione sempre com o quadro clínico do paciente
• Considere exames complementares conforme evolução
• Avalie histórico e exames anteriores do paciente
• A conduta final é de responsabilidade do profissional

REFERÊNCIAS CONSULTADAS:
• Merck Veterinary Manual (11th Edition)
• Nelson & Couto - Medicina Interna de Pequenos Animais
• Laboratórios de referência veterinária regionais
• Thrall MA - Hematologia e Bioquímica Clínica Veterinária`;
      } else {
        interpretation += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Esta interpretação tem caráter EDUCATIVO e INFORMATIVO.

Para diagnóstico definitivo, tratamento e acompanhamento, 
consulte um médico veterinário presencialmente.

Não inicie ou altere tratamentos sem orientação profissional.`;
      }

      setResult(interpretation);
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
              Anexe imagens ou descreva os valores do exame
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <Input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="exam-images"
              />
              <label htmlFor="exam-images" className="cursor-pointer">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Clique para anexar imagens</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Fotos do exame, laudos, resultados (JPG, PNG, PDF)
                </p>
              </label>
            </div>

            {images.length > 0 && (
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
            )}

            <div className="space-y-2">
              <Label htmlFor="clinicalData">Valores/Dados Clínicos</Label>
              <Textarea
                id="clinicalData"
                placeholder="Ex: Hemácias 5.2 milhões/µL, Leucócitos 18.000/µL, ALT 120 U/L, Creatinina 1.8 mg/dL..."
                value={clinicalData}
                onChange={(e) => setClinicalData(e.target.value)}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                Descreva os valores encontrados no exame para uma análise mais precisa
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
              />
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm">
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