import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Leaf, Loader2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cleanTextForDisplay } from "@/lib/textUtils";
import { MarkdownTableRenderer } from "@/components/MarkdownTableRenderer";
import { ResponseActionButtons } from "@/components/ResponseActionButtons";
import { invokeEdgeFunction } from "@/lib/edgeInvoke";
import { fileToCompressedDataUrl } from "@/lib/imageDataUrl";
import { supabase } from "@/integrations/supabase/client";
import { AuthDialog } from "@/components/AuthDialog";

const DiagnosticoMandioca = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [regiao, setRegiao] = useState("");
  const [estado, setEstado] = useState("");
  const [sintomas, setSintomas] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [result, setResult] = useState("");
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const MAX_IMAGES = 5;
  const MAX_IMAGE_BYTES = 1_500_000;
  const MAX_TOTAL_BYTES = 5_000_000;

  const estados = [
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
      description: `${added} imagem(ns) adicionada(s). Total: ${images.length + newImages.length}/${MAX_IMAGES}`,
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Faça login para continuar",
        description: "Entre ou crie uma conta para realizar diagnósticos.",
        variant: "destructive",
      });
      setShowAuthDialog(true);
      return;
    }

    if (images.length === 0 && !sintomas.trim()) {
      toast({
        title: "Dados insuficientes",
        description: "Envie pelo menos uma imagem ou descreva os sintomas observados na lavoura.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const res = await invokeEdgeFunction<any>("veterinary-consultation", {
        tool: "diagnostico-mandioca",
        data: {
          regiao: regiao || "Não informada",
          estado: estado || "Não informado",
          sintomas: sintomas,
          images: images.length > 0 ? images : null,
        },
      });

      if (!res.ok) {
        toast({
          title: "Atenção",
          description: (res.error as any)?.friendlyError || "Ocorreu um problema temporário. Por favor, tente novamente.",
          variant: "destructive",
        });
        return;
      }

      const cleanedResult = cleanTextForDisplay(res.data?.answer || res.data?.response);
      setResult(cleanedResult);

      toast({ title: "Diagnóstico concluído!", description: "A análise fitossanitária foi gerada com sucesso." });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({ title: "Atenção", description: "Ocorreu um problema temporário. Por favor, tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Leaf className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Diagnóstico Fitossanitário da Mandioca</h1>
            <p className="text-muted-foreground">Identificação da vassoura-de-bruxa e outras doenças da mandioca</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-foreground leading-relaxed mb-4">
            Ferramenta especializada na identificação de sintomas da vassoura-de-bruxa da mandioca (Ceratobasidium theobromae) e outras doenças. Analisa imagens da lavoura e descrições de sintomas para gerar relatórios técnicos com diagnósticos diferenciais e recomendações fitossanitárias.
          </p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <p className="font-medium text-sm text-foreground mb-1">O que faz</p>
              <p className="text-xs text-muted-foreground">Analisa imagens e sintomas para identificar doenças da mandioca</p>
            </div>
            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <p className="font-medium text-sm text-foreground mb-1">Para quem é</p>
              <p className="text-xs text-muted-foreground">Produtores rurais, extensionistas, técnicos agrícolas e pesquisadores</p>
            </div>
            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <p className="font-medium text-sm text-foreground mb-1">Quando usar</p>
              <p className="text-xs text-muted-foreground">Ao observar deformações, secamento ou alterações nas plantas de mandioca</p>
            </div>
            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <p className="font-medium text-sm text-foreground mb-1">O que você recebe</p>
              <p className="text-xs text-muted-foreground">Diagnóstico visual, nível de compatibilidade, medidas recomendadas e referências</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl">
        {/* Localização */}
        <Card>
          <CardHeader>
            <CardTitle>Localização da Lavoura</CardTitle>
            <CardDescription>Informe a região e o estado para contextualizar a análise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="regiao">Região / Município</Label>
                <Input
                  id="regiao"
                  placeholder="Ex: Macapá, Serra do Navio..."
                  value={regiao}
                  onChange={(e) => setRegiao(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="estado">Estado (UF)</Label>
                <Select value={estado} onValueChange={setEstado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {estados.map((uf) => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload de Imagens */}
        <Card>
          <CardHeader>
            <CardTitle>Imagens da Lavoura / Planta</CardTitle>
            <CardDescription>
              Envie até 5 fotos de ramos, folhas, hastes ou da planta inteira com sintomas
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
                  {images.length} de {MAX_IMAGES} imagens carregadas
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

        {/* Descrição dos Sintomas */}
        <Card>
          <CardHeader>
            <CardTitle>Descrição dos Sintomas Observados</CardTitle>
            <CardDescription>
              Descreva detalhadamente os sintomas observados na lavoura de mandioca
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Ex: Plantas com brotos finos e excessivos nos ramos superiores, aspecto de vassoura. Folhas amarelando e secando da ponta para a base. Observado em cerca de 30% da lavoura nos últimos 15 dias..."
              value={sintomas}
              onChange={(e) => setSintomas(e.target.value)}
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
              <Leaf className="mr-2 h-5 w-5" />
              Analisar Fitossanidade
            </>
          )}
        </Button>

        {/* Resultado */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Relatório Fitossanitário</CardTitle>
              <CardDescription>Diagnóstico técnico baseado nos dados fornecidos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MarkdownTableRenderer
                content={result}
                className="prose prose-sm max-w-none bg-muted p-4 rounded-lg text-sm leading-relaxed"
              />

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-3 italic">
                  Relatório gerado via VetAgro Sustentável AI — Diagnóstico Fitossanitário © 2025
                </p>

                <ResponseActionButtons
                  content={result}
                  title="Diagnóstico Fitossanitário da Mandioca"
                  toolName="Diagnóstico Fitossanitário da Mandioca"
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

export default DiagnosticoMandioca;
