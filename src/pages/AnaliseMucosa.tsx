import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Loader2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cleanTextForDisplay } from "@/lib/textUtils";
import { MarkdownTableRenderer } from "@/components/MarkdownTableRenderer";
import { ResponseActionButtons } from "@/components/ResponseActionButtons";

const AnaliseMucosa = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isProfessional, setIsProfessional] = useState<string>("");
  const [crmv, setCrmv] = useState("");
  const [uf, setUf] = useState("");
  const [especie, setEspecie] = useState("");
  const [animalData, setAnimalData] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [result, setResult] = useState("");

  const ufs = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    
    for (let i = 0; i < files.length && images.length + newImages.length < 5; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      await new Promise<void>((resolve) => {
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    setImages([...images, ...newImages]);
    toast({
      title: "Imagem(ns) carregada(s)",
      description: `${newImages.length} imagem(ns) adicionada(s). Total: ${images.length + newImages.length}/5`,
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const validateCrmv = (): boolean => {
    if (isProfessional !== "sim") return true;
    
    if (!crmv.trim() || !uf) {
      toast({
        title: "CRMV obrigatório",
        description: "Para usuários veterinários, CRMV e UF são obrigatórios para emitir análise técnica.",
        variant: "destructive",
      });
      return false;
    }

    const crmvRegex = /^\d{3,6}$/;
    if (!crmvRegex.test(crmv.trim())) {
      toast({
        title: "CRMV inválido",
        description: "Informe um número de CRMV válido (3-6 dígitos).",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleAnalyze = async () => {
    if (!isProfessional) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe se você é um profissional da área.",
        variant: "destructive",
      });
      return;
    }

    if (!validateCrmv()) {
      return;
    }

    if (images.length === 0 && !animalData.trim()) {
      toast({
        title: "Dados insuficientes",
        description: "Envie pelo menos uma imagem ou forneça dados clínicos do animal.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          tool: "analise-mucosa",
          isProfessional: isProfessional === "sim",
          crmv: isProfessional === "sim" ? `${crmv}-${uf}` : null,
          data: {
            especie: especie || "Não identificada (analisar pela imagem)",
            descricao: animalData,
            images: images.length > 0 ? images : null,
          },
        },
      });

      if (error) {
        if (error.message?.includes("429")) {
          toast({
            title: "Limite de requisições",
            description: "Aguarde alguns instantes e tente novamente.",
            variant: "destructive",
          });
          return;
        }
        if (error.message?.includes("402")) {
          toast({
            title: "Créditos insuficientes",
            description: "Faça upgrade do seu plano para continuar.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      const cleanedResult = cleanTextForDisplay(data.answer || data.response);
      setResult(cleanedResult);

      toast({
        title: "Análise concluída!",
        description: "A mucosa foi analisada com sucesso.",
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
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Eye className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analisador de Mucosa Ocular e Sinais Clínicos</h1>
            <p className="text-muted-foreground">Análise de mucosa ocular e dados clínicos para identificação de alterações</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl">
        {/* Identificação do usuário */}
        <Card>
          <CardHeader>
            <CardTitle>Identificação do Usuário</CardTitle>
            <CardDescription>
              Informe seu perfil para receber a análise adequada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={isProfessional} onValueChange={setIsProfessional}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="prof-sim" />
                <Label htmlFor="prof-sim">Sou Médico(a) Veterinário(a)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="prof-nao" />
                <Label htmlFor="prof-nao">Não sou profissional da área (tutor/produtor)</Label>
              </div>
            </RadioGroup>

            {isProfessional === "sim" && (
              <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-muted/50 rounded-lg border">
                <div>
                  <Label htmlFor="crmv">Número CRMV *</Label>
                  <Input
                    id="crmv"
                    placeholder="Ex: 12345"
                    value={crmv}
                    onChange={(e) => setCrmv(e.target.value.replace(/\D/g, ""))}
                    maxLength={6}
                  />
                </div>
                <div>
                  <Label htmlFor="uf">UF *</Label>
                  <Select value={uf} onValueChange={setUf}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {ufs.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="col-span-2 text-xs text-muted-foreground">
                  CRMV obrigatório para emissão de análise técnica completa
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Espécie */}
        <Card>
          <CardHeader>
            <CardTitle>Espécie do Animal</CardTitle>
            <CardDescription>
              Selecione a espécie ou deixe para identificação automática pela imagem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={especie} onValueChange={setEspecie}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a espécie (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="canina">Canina (Cão)</SelectItem>
                <SelectItem value="felina">Felina (Gato)</SelectItem>
                <SelectItem value="equina">Equina (Cavalo)</SelectItem>
                <SelectItem value="bovina">Bovina</SelectItem>
                <SelectItem value="ovina">Ovina (Ovino)</SelectItem>
                <SelectItem value="caprina">Caprina (Caprino)</SelectItem>
                <SelectItem value="suina">Suína</SelectItem>
                <SelectItem value="aves">Aves</SelectItem>
                <SelectItem value="outra">Outra</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Upload de Imagens */}
        <Card>
          <CardHeader>
            <CardTitle>Imagens da Mucosa/Olho</CardTitle>
            <CardDescription>
              Envie até 5 fotos claras da mucosa ocular ou sinais clínicos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="flex-1"
                multiple
                disabled={images.length >= 5}
              />
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>

            {images.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-primary">
                  {images.length} de 5 imagens carregadas ✓
                </p>
                <div className="flex flex-wrap gap-2">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Imagem ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-md border"
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
          </CardContent>
        </Card>

        {/* Dados Clínicos */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Clínicos do Animal</CardTitle>
            <CardDescription>
              Forneça informações relevantes sobre o animal e sintomas observados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="animalData"
              placeholder="Ex: Cão, 7 anos, raça Labrador, apresentando mancha esverdeada no olho direito, sem sinais de dor aparente. Observado há 3 dias..."
              value={animalData}
              onChange={(e) => setAnimalData(e.target.value)}
              className="min-h-[120px]"
            />
          </CardContent>
        </Card>

        {/* Botão de Análise */}
        <Button
          onClick={handleAnalyze}
          disabled={loading || !isProfessional}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Eye className="mr-2 h-5 w-5" />
              Analisar Mucosa
            </>
          )}
        </Button>

        {/* Resultado */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado da Análise</CardTitle>
              <CardDescription>
                Avaliação clínica baseada nos dados fornecidos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MarkdownTableRenderer 
                content={result}
                className="prose prose-sm max-w-none bg-muted p-4 rounded-lg text-sm leading-relaxed"
              />

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-3 italic">
                  Relatório gerado via VetAgro Sustentável AI — Análise Assistida © 2025
                </p>
                
                <ResponseActionButtons
                  content={result}
                  title="Análise de Mucosa Ocular"
                  toolName="Analisador de Mucosa Ocular e Sinais Clínicos"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AnaliseMucosa;
