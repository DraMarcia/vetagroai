import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Loader2, Image as ImageIcon, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { resilientInvoke, extractAnswer } from "@/lib/resilientInvoke";
import { fileToCompressedDataUrl } from "@/lib/imageDataUrl";
import { UFS } from "@/hooks/useCrmvValidation";
import { ResponseActionButtons } from "@/components/ResponseActionButtons";
import { MarkdownTableRenderer } from "@/components/MarkdownTableRenderer";

const ResenhaEquinos = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Professional identification (MANDATORY)
  const [vetName, setVetName] = useState("");
  const [crmv, setCrmv] = useState("");
  const [uf, setUf] = useState("");
  
  // Horse data
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [purpose, setPurpose] = useState("");
  const [horseName, setHorseName] = useState("");
  const [sex, setSex] = useState("");
  const [coat, setCoat] = useState("");
  
  const [images, setImages] = useState<{ url: string; name: string }[]>([]);
  const [resenha, setResenha] = useState("");

  const validateCrmv = (): boolean => {
    if (!crmv.trim()) {
      toast({
        title: "CRMV obrigatório",
        description: "Esta ferramenta é restrita a médicos veterinários. Informe seu CRMV para continuar.",
        variant: "destructive",
      });
      return false;
    }

    const crmvPattern = /^\d{3,6}$/;
    if (!crmvPattern.test(crmv.trim())) {
      toast({
        title: "CRMV inválido",
        description: "Informe um número de CRMV válido (3 a 6 dígitos).",
        variant: "destructive",
      });
      return false;
    }

    if (!uf) {
      toast({
        title: "UF obrigatório",
        description: "Selecione o estado (UF) do seu registro profissional.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    
    if (fileArray.length < 2) {
      toast({
        title: "Mínimo de imagens",
        description: "Por favor, selecione pelo menos 2 imagens do equino.",
        variant: "destructive",
      });
      return;
    }

    if (fileArray.length > 5) {
      toast({
        title: "Máximo de imagens",
        description: "Por favor, selecione no máximo 5 imagens.",
        variant: "destructive",
      });
      return;
    }

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

    const loadedImages = await Promise.all(imagePromises);
    setImages(loadedImages);
    
    toast({
      title: "Imagens carregadas",
      description: `${loadedImages.length} imagens prontas para análise.`,
    });
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const handleGenerate = async () => {
    // Prevent double-clicks
    if (loading) {
      // Debug log removido
      return;
    }

    // CRMV validation gatekeeper - MANDATORY
    if (!validateCrmv()) {
      return;
    }

    if (!breed.trim() || !age.trim() || !purpose.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha raça, idade e finalidade da resenha.",
        variant: "destructive",
      });
      return;
    }

    if (images.length < 2) {
      toast({
        title: "Imagens insuficientes",
        description: `Envie entre 2 e 5 imagens. Você enviou ${images.length}.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResenha(""); // Clear previous result
    // Debug log removido
    
    try {
      const res = await resilientInvoke("analyze-equine", {
        images: images.map(img => img.url), 
        breed, 
        age, 
        purpose,
        horseName,
        sex,
        coat,
        vetName,
        crmv: `${crmv}-${uf}`
      }, { hasImages: true, answerField: "resenha" });

      if (!res.ok) {
        toast({
          title: "Atenção",
          description: res.friendlyError || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      const data = res.data;

      if (!data?.resenha) {
        toast({
          title: "Atenção",
          description: "O servidor não retornou dados suficientes. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      // Check if response is rejection message
      if (data.resenha.includes("exclusiva para avaliação morfológica de equinos")) {
        toast({
          title: "Erro na análise",
          description: "O sistema não conseguiu processar as imagens. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      // Clean unwanted formatting
      let cleanResenha = data.resenha
        .replace(/\*\*/g, '')
        .replace(/##/g, '')
        .replace(/###/g, '')
        .replace(/\*/g, '•')
        .replace(/#+\s*/g, '');

      console.log('Resenha processada com sucesso');
      setResenha(cleanResenha);
      toast({
        title: "Resenha gerada",
        description: "A análise do equino foi concluída com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Atenção",
        description: "A análise automática não pôde ser concluída. Tente novamente com imagens mais nítidas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get full text for copy functionality
  const getFullReportText = () => {
    const footer = `\n\n────────────────────\nEmitido por VetAgro Sustentável AI — ${new Date().toLocaleDateString("pt-BR")}`;
    return resenha + footer;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Resenha Técnica de Equinos
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Ferramenta exclusiva para médicos veterinários — documento técnico oficial
            </p>
          </div>
        </div>

        {/* Bloco Explicativo Padronizado */}
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-foreground leading-relaxed mb-4">
            Ferramenta para geração de resenhas técnicas detalhadas de equinos a partir de imagens. Produz documento oficial com descrição morfológica completa, identificação de particularidades e marcas, pronto para uso em registro, transferência ou exposição.
          </p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <p className="font-medium text-sm text-foreground mb-1">O que faz</p>
              <p className="text-xs text-muted-foreground">Gera resenha técnica completa a partir de imagens do equino</p>
            </div>
            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <p className="font-medium text-sm text-foreground mb-1">Para quem é</p>
              <p className="text-xs text-muted-foreground">Médicos Veterinários especializados em equinos (CRMV obrigatório)</p>
            </div>
            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <p className="font-medium text-sm text-foreground mb-1">Quando usar</p>
              <p className="text-xs text-muted-foreground">Para registro, transferência, exposição ou documentação oficial de equinos</p>
            </div>
            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <p className="font-medium text-sm text-foreground mb-1">O que você recebe</p>
              <p className="text-xs text-muted-foreground">Documento técnico com descrição morfológica, particularidades e sinais identificadores</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl">
        {/* Legal Warning */}
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  Uso exclusivo por Médico Veterinário
                </p>
                <p className="text-muted-foreground mt-1">
                  Este documento só tem validade jurídica com CRMV válido e assinatura do veterinário responsável.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Veterinarian Data - MANDATORY */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Responsável Técnico</CardTitle>
            <CardDescription>
              Dados obrigatórios do médico veterinário
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vetName">Nome do Veterinário</Label>
              <Input
                id="vetName"
                placeholder="Ex: Dr(a). João Silva"
                value={vetName}
                onChange={(e) => setVetName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="crmv">Número do CRMV *</Label>
                <Input
                  id="crmv"
                  placeholder="Ex: 12345"
                  value={crmv}
                  onChange={(e) => setCrmv(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground">3 a 6 dígitos</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="uf">Estado (UF) *</Label>
                <Select value={uf} onValueChange={setUf}>
                  <SelectTrigger id="uf">
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
          </CardContent>
        </Card>

        {/* Horse Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do Equino</CardTitle>
            <CardDescription>
              Informações para identificação do animal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="horseName">Nome do Animal</Label>
                <Input
                  id="horseName"
                  placeholder="Ex: Trovão"
                  value={horseName}
                  onChange={(e) => setHorseName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sex">Sexo</Label>
                <Select value={sex} onValueChange={setSex}>
                  <SelectTrigger id="sex">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Macho">Macho</SelectItem>
                    <SelectItem value="Fêmea">Fêmea</SelectItem>
                    <SelectItem value="Castrado">Castrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="breed">Raça *</Label>
                <Input
                  id="breed"
                  placeholder="Ex: Mangalarga Marchador"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coat">Pelagem</Label>
                <Input
                  id="coat"
                  placeholder="Ex: Castanho, Alazão, Tordilho"
                  value={coat}
                  onChange={(e) => setCoat(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="purpose">Finalidade *</Label>
                <Input
                  id="purpose"
                  placeholder="Ex: Registro, venda, exposição"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Imagens do Equino
            </CardTitle>
            <CardDescription>
              Envie de 2 a 5 imagens para análise morfológica completa
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
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Clique para selecionar imagens</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Mínimo 2, máximo 5 imagens (JPG, PNG)
                </p>
              </label>
            </div>

            {images.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  {images.length} imagem(ns) carregada(s)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.url}
                        alt={`Imagem ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-border"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {img.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={handleGenerate}
          disabled={loading || images.length < 2}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analisando imagens...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-5 w-5" />
              Gerar Resenha Técnica ({images.length}/2 imagens mínimas)
            </>
          )}
        </Button>

        {resenha && (
          <div className="space-y-6">
            {/* Report Header */}
            <div className="border-b-2 border-primary pb-4">
              <h2 className="text-xl font-bold text-center text-foreground uppercase tracking-wide">
                Resenha Técnica — Equino
              </h2>
              <p className="text-center text-sm text-muted-foreground mt-1">
                Documento Técnico Oficial — VetAgro Sustentável AI
              </p>
            </div>

            {/* Continuous Report Content - No scroll box */}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <MarkdownTableRenderer content={resenha} />
            </div>

            {/* Footer with emission date */}
            <div className="border-t border-border pt-4 text-sm text-muted-foreground">
              <p className="text-center">
                Emitido por VetAgro Sustentável AI — {new Date().toLocaleDateString("pt-BR")}
              </p>
            </div>

            {/* Global App Buttons - Only Copiar and Compartilhar */}
            <ResponseActionButtons 
              content={getFullReportText()} 
              toolName="Resenha Técnica de Equinos"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ResenhaEquinos;
