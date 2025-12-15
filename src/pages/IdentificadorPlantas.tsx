import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Leaf, Loader2, Upload, X, ImageIcon, User, AlertTriangle, MapPin, Microscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UFS } from "@/hooks/useCrmvValidation";
import { MarkdownTableRenderer } from "@/components/MarkdownTableRenderer";
import { ResponseActionButtons } from "@/components/ResponseActionButtons";
import { cleanTextForDisplay } from "@/lib/textUtils";

const COUNCIL_TYPES = [
  { value: "CREA", label: "CREA - Engenharia e Agronomia" },
  { value: "CRBio", label: "CRBio - Biologia" },
  { value: "CFTA", label: "CFTA - Técnicos Agrícolas" },
  { value: "CRMV", label: "CRMV - Medicina Veterinária" },
  { value: "Outro", label: "Outro" },
];

const IdentificadorPlantas = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isProfessional, setIsProfessional] = useState<string>("");
  const [councilType, setCouncilType] = useState("");
  const [councilNumber, setCouncilNumber] = useState("");
  const [councilUF, setCouncilUF] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [result, setResult] = useState("");

  const handleExampleFill = () => {
    setDescription("Planta encontrada em pastagem de bovinos no Cerrado de Roraima. Folhas verde-escuras, formato de coração, caule ereto. Alguns animais apresentaram salivação excessiva e apatia após ingestão. Planta tem cerca de 50cm de altura, flores pequenas amareladas.");
    toast({
      title: "Exemplo carregado",
      description: "Descrição de exemplo preenchida. Adicione imagens se disponíveis.",
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > 5) {
      toast({
        title: "Limite de imagens",
        description: "Máximo de 5 imagens permitidas.",
        variant: "destructive",
      });
      return;
    }

    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result as string);
        if (newImages.length === files.length) {
          setImages((prev) => [...prev, ...newImages]);
          toast({
            title: "Imagens carregadas",
            description: `${newImages.length} imagem(ns) adicionada(s).`,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleIdentify = async () => {
    if (loading) return;

    if (!isProfessional) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe se você é um profissional da área.",
        variant: "destructive",
      });
      return;
    }

    if (isProfessional === "sim") {
      if (!councilType || !councilNumber.trim() || !councilUF) {
        toast({
          title: "Campos obrigatórios",
          description: "Informe o tipo de conselho, número e UF.",
          variant: "destructive",
        });
        return;
      }
    }

    if (images.length === 0 && !description.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Envie pelo menos uma imagem ou forneça uma descrição da planta/pastagem.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult("");

    try {
      toast({
        title: "Analisando...",
        description: "Processando dados fornecidos.",
      });

      const prompt = `IDENTIFICADOR DE PLANTAS — VetAgro Sustentável AI

Você é o Identificador de Plantas VetAgro AI, uma ferramenta técnica de identificação botânica com foco em toxicidade animal e manejo de pastagens.

DESCRIÇÃO FORNECIDA: ${description || "Sem descrição adicional — analisar apenas imagens"}
NÚMERO DE IMAGENS: ${images.length}
${isProfessional === "sim" ? `PROFISSIONAL: ${councilType} ${councilNumber}/${councilUF}` : "USUÁRIO: Não profissional da área"}

ESTRUTURA OBRIGATÓRIA DA RESPOSTA (seguir rigorosamente):

1. IDENTIFICAÇÃO PRELIMINAR:
– Nome popular (quando possível identificar)
– Nome científico provável
– Família botânica

2. CARACTERÍSTICAS MORFOLÓGICAS:
– Folhas: formato, cor, textura, nervação
– Caule: tipo, cor, presença de pelos ou espinhos
– Flores: cor, formato, disposição (se visíveis)
– Frutos: tipo, cor, formato (se visíveis)
– Raízes: características (se informadas)

3. HABITAT E OCORRÊNCIA:
– Regiões comuns no Brasil e biomas típicos
– Ambientes de ocorrência: pastagem, mata, áreas alagadas, cerrado, etc.
– Condições favoráveis ao desenvolvimento

4. IMPORTÂNCIA VETERINÁRIA:
– Planta tóxica: SIM / NÃO / POTENCIALMENTE
– Espécies animais mais afetadas
– Princípio tóxico (se conhecido)
– Principais sinais clínicos em caso de intoxicação
– Dose tóxica aproximada (se disponível na literatura)

5. CONDUTA TÉCNICA RECOMENDADA:
– Medidas preventivas para evitar intoxicação
– Manejo de pastagem recomendado
– Orientações gerais para produtores
– Importância do diagnóstico diferencial

6. ALERTA TÉCNICO:
A identificação por imagem é indicativa e não substitui avaliação botânica especializada. Em casos de suspeita de intoxicação, procure assistência veterinária imediata.

7. REFERÊNCIAS TÉCNICAS:
– EMBRAPA — Plantas Tóxicas do Brasil
– Tokarnia CH, Döbereiner J, Peixoto PV — Plantas Tóxicas do Brasil (2ª ed.)
– Universidades brasileiras — herbários e estudos regionais
– Manuais de identificação botânica

REGRAS OBRIGATÓRIAS:
– Linguagem técnica, clara e objetiva
– Sem asteriscos, hashtags ou emojis
– Use apenas bullets padrão: –, •
– Formate títulos como "TÍTULO:" em maiúsculas
– Se não for possível identificar com segurança, informar claramente
– Não inventar características não observáveis nas imagens ou descrição`;

      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          tool: "identificador-plantas",
          question: prompt,
          images: images,
          description: description || "Sem descrição adicional",
          isProfessional: isProfessional === "sim",
          councilType: isProfessional === "sim" ? councilType : undefined,
          councilNumber: isProfessional === "sim" ? councilNumber : undefined,
          councilUF: isProfessional === "sim" ? councilUF : undefined,
        },
      });

      if (error) throw error;

      if (!data?.answer) {
        throw new Error("Resposta vazia do servidor. Tente novamente.");
      }

      const cleanedResult = cleanTextForDisplay(data.answer);
      setResult(cleanedResult);
      toast({
        title: "Identificação concluída",
        description: "Relatório gerado com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro ao identificar",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Institucional */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-600 to-lime-600 flex items-center justify-center shadow-lg">
            <Leaf className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Identificador de Plantas</h1>
            <p className="text-muted-foreground">Identificação botânica, toxicidade animal e manejo de pastagens</p>
          </div>
        </div>

        {/* Bloco Conceitual */}
        <Card className="bg-gradient-to-r from-green-50 to-lime-50 dark:from-green-950/30 dark:to-lime-950/30 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <p className="text-foreground leading-relaxed mb-4">
              Ferramenta técnica para identificação de plantas com foco em toxicidade veterinária e manejo de pastagens. Analisa características morfológicas, habitat, potencial tóxico e recomendações de conduta.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Microscope className="h-4 w-4 text-green-600" />
                <span>Identificação botânica</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-green-600" />
                <span>Toxicidade animal</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-green-600" />
                <span>Habitat e biomas</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Leaf className="h-4 w-4 text-green-600" />
                <span>Manejo de pastagem</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 max-w-3xl">
        {/* Botão de Exemplo */}
        <div className="flex justify-start">
          <Button
            variant="outline"
            onClick={handleExampleFill}
            className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950/50"
          >
            <Leaf className="mr-2 h-4 w-4" />
            Usar exemplo: Planta suspeita no Cerrado
          </Button>
        </div>

        {/* Identificação Profissional */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-green-600" />
              Identificação Profissional
            </CardTitle>
            <CardDescription>
              Profissionais: agrônomos, engenheiros florestais, biólogos, veterinários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={isProfessional} onValueChange={setIsProfessional}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="prof-sim" />
                <Label htmlFor="prof-sim">Sou profissional da área</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="prof-nao" />
                <Label htmlFor="prof-nao">Não sou profissional da área</Label>
              </div>
            </RadioGroup>

            {isProfessional === "sim" && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="councilType">Tipo de Conselho *</Label>
                  <Select value={councilType} onValueChange={setCouncilType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o conselho" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNCIL_TYPES.map((council) => (
                        <SelectItem key={council.value} value={council.value}>
                          {council.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="councilNumber">Número do Registro *</Label>
                    <Input
                      id="councilNumber"
                      placeholder="Ex: 12345"
                      value={councilNumber}
                      onChange={(e) => setCouncilNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="councilUF">UF *</Label>
                    <Select value={councilUF} onValueChange={setCouncilUF}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {UFS.map((uf) => (
                          <SelectItem key={uf} value={uf}>
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload de Imagens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImageIcon className="h-5 w-5 text-green-600" />
              Imagens da Planta
            </CardTitle>
            <CardDescription>
              Envie até 5 imagens claras: folhas, caule, flores, frutos, raízes ou pastagem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="flex-1"
              />
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            
            {images.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {images.length} de 5 imagens carregadas
                  </span>
                  <span className="text-xs text-green-600 font-medium">
                    Pronto para análise
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Imagem ${index + 1}`}
                        className="w-full h-16 object-cover rounded border"
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

            {images.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                <span>Nenhuma imagem carregada</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Descrição */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Leaf className="h-5 w-5 text-green-600" />
              Descrição Adicional
            </CardTitle>
            <CardDescription>
              Descreva características, local, bioma, sintomas observados em animais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="description"
              placeholder="Ex: Planta com folhas verdes escuras, formato de coração, encontrada em pastagem de bovinos no Cerrado. Alguns animais apresentaram salivação excessiva..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px]"
            />
          </CardContent>
        </Card>

        {/* Botão de Análise */}
        <Button
          onClick={handleIdentify}
          disabled={loading || !isProfessional}
          size="lg"
          className="w-full bg-gradient-to-r from-green-600 to-lime-600 hover:from-green-700 hover:to-lime-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Leaf className="mr-2 h-5 w-5" />
              Identificar Planta
            </>
          )}
        </Button>

        {/* Resultado */}
        {result && (
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="bg-gradient-to-r from-green-50 to-lime-50 dark:from-green-950/30 dark:to-lime-950/30 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Leaf className="h-5 w-5" />
                Relatório de Identificação
              </CardTitle>
              <CardDescription>
                Identificação botânica, toxicidade e recomendações técnicas
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Result Display */}
              <div className="prose prose-sm max-w-none">
                <MarkdownTableRenderer 
                  content={result}
                  className="bg-muted/30 p-6 rounded-lg text-sm leading-relaxed border"
                />
              </div>

              {/* Action Buttons */}
              <ResponseActionButtons
                content={result}
                title="Identificador de Plantas e Toxicidade"
                toolName="Identificador de Plantas"
                className="mt-6 pt-4 border-t"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default IdentificadorPlantas;
