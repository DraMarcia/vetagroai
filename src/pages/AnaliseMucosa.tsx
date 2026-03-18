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
import { cleanTextForDisplay } from "@/lib/textUtils";
import { MarkdownTableRenderer } from "@/components/MarkdownTableRenderer";
import { ResponseActionButtons } from "@/components/ResponseActionButtons";
import { resilientInvoke, extractAnswer } from "@/lib/resilientInvoke";
import { fileToCompressedDataUrl } from "@/lib/imageDataUrl";
import { supabase } from "@/integrations/supabase/client";
import { AuthDialog } from "@/components/AuthDialog";

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
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const MAX_IMAGES = 5;
  // Keep payload comfortably under typical serverless body limits.
  const MAX_IMAGE_BYTES = 1_500_000; // ~1.5MB per image after compression
  const MAX_TOTAL_BYTES = 5_000_000; // ~5MB total for all images

  const ufs = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    let added = 0;
    let skipped = 0;
    let oversize = 0;
    let totalBytes = images.reduce((sum, s) => {
      const idx = s.indexOf("base64,");
      if (idx === -1) return sum;
      const b64 = s.slice(idx + 7);
      return sum + Math.floor((b64.length * 3) / 4);
    }, 0);
    
    for (let i = 0; i < files.length && images.length + newImages.length < MAX_IMAGES; i++) {
      const file = files[i];
      try {
        const { dataUrl, approxBytes } = await fileToCompressedDataUrl(file, {
          maxDimension: 1600,
          quality: 0.85,
          mimeType: "image/jpeg",
        });

        if (approxBytes > MAX_IMAGE_BYTES || totalBytes + approxBytes > MAX_TOTAL_BYTES) {
          oversize++;
          continue;
        }

        newImages.push(dataUrl);
        totalBytes += approxBytes;
        added++;
      } catch {
        skipped++;
      }
    }

    setImages([...images, ...newImages]);

    // reset input so re-uploading same file triggers onChange
    e.target.value = "";

    if (added === 0) {
      toast({
        title: "Não foi possível adicionar a imagem",
        description: oversize
          ? "A imagem ficou muito grande para envio. Tente uma foto mais leve/recortada."
          : "Tente novamente com outra imagem.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Imagem(ns) carregada(s)",
      description: `${added} imagem(ns) adicionada(s). Total: ${images.length + newImages.length}/${MAX_IMAGES}`
        + (oversize ? ` • ${oversize} muito grande(s) e ignorada(s)` : "")
        + (skipped ? ` • ${skipped} com falha ao processar` : ""),
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
    console.log("[AnaliseMucosa] handleAnalyze TRIGGERED");
    if (!isProfessional) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe se você é um profissional da área.",
        variant: "destructive",
      });
      return;
    }

    // Esta ferramenta exige sessão autenticada (evita enviar token anon e receber 401)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Faça login para continuar",
        description: "Entre ou crie uma conta para realizar análises e usar seus créditos.",
        variant: "destructive",
      });
      setShowAuthDialog(true);
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
      const res = await resilientInvoke("vet-clinical-handler", {
        tool: "analise-mucosa",
        isProfessional: isProfessional === "sim",
        crmv: isProfessional === "sim" ? `${crmv}-${uf}` : null,
        data: {
          especie: especie || "Não identificada (analisar pela imagem)",
          descricao: animalData,
          images: images.length > 0 ? images : null,
        },
      });

      if (!res.ok) {
        toast({
          title: "Atenção",
          description: res.friendlyError || "Ocorreu um problema temporário. Por favor, tente novamente.",
          variant: "destructive",
        });
        return;
      }

      const cleanedResult = cleanTextForDisplay(extractAnswer(res.data));
      setResult(cleanedResult);

      toast({
        title: "Análise concluída!",
        description: "A mucosa foi analisada com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Atenção",
        description: "A análise automática da imagem não pôde ser concluída neste momento. O relatório foi gerado com base nas informações fornecidas.",
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
            <p className="text-muted-foreground">Análise de mucosa ocular e dados clínicos para identificação de alterações sistêmicas</p>
          </div>
        </div>

        {/* Bloco Explicativo Padronizado */}
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-foreground leading-relaxed mb-4">
            Ferramenta multiespécie para análise de imagens da mucosa ocular e dados clínicos. Identifica alterações de coloração e aspecto indicativas de condições sistêmicas ou locais, com diagnósticos diferenciais e recomendações.
          </p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <p className="font-medium text-sm text-foreground mb-1">O que faz</p>
              <p className="text-xs text-muted-foreground">Analisa imagens e dados clínicos para identificar alterações na mucosa ocular</p>
            </div>
            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <p className="font-medium text-sm text-foreground mb-1">Para quem é</p>
              <p className="text-xs text-muted-foreground">Médicos Veterinários, estudantes de veterinária e tutores de animais</p>
            </div>
            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <p className="font-medium text-sm text-foreground mb-1">Quando usar</p>
              <p className="text-xs text-muted-foreground">Ao observar alterações na mucosa ocular ou sinais clínicos sistêmicos</p>
            </div>
            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <p className="font-medium text-sm text-foreground mb-1">O que você recebe</p>
              <p className="text-xs text-muted-foreground">Avaliação da mucosa, correlações clínicas, diagnósticos diferenciais e recomendações</p>
            </div>
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
                disabled={images.length >= MAX_IMAGES}
              />
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>

            {images.length > 0 && (
              <div className="space-y-2">
                  <p className="text-sm font-medium text-primary">
                    {images.length} de {MAX_IMAGES} imagens carregadas ✓
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
          disabled={loading}
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

       <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
     </div>
   );
};

export default AnaliseMucosa;
