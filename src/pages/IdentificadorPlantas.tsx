import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Leaf, Loader2, Upload, Copy, X, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UFS } from "@/hooks/useCrmvValidation";
import { ReportExporter } from "@/components/ReportExporter";

const COUNCIL_TYPES = [
  { value: "CREA", label: "CREA - Engenharia e Agronomia" },
  { value: "CRBio", label: "CRBio - Biologia" },
  { value: "CFTA", label: "CFTA - Técnicos Agrícolas" },
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

  const handleCopyResult = async () => {
    try {
      await navigator.clipboard.writeText(result);
      toast({
        title: "Copiado!",
        description: "Relatório copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto.",
        variant: "destructive",
      });
    }
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
        description: "Processando imagens e dados fornecidos.",
      });

      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          tool: "identificador-plantas",
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

      setResult(data.answer);
      toast({
        title: "Identificação concluída!",
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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center">
            <Leaf className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Identificador de Plantas e Toxicidade</h1>
            <p className="text-muted-foreground">Identificação botânica, fitossanidade, toxicidade e manejo de pastagens</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Identificação Profissional</CardTitle>
            <CardDescription>
              Informe se você é um profissional da área (agrônomo, engenheiro florestal, biólogo, etc.)
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

        <Card>
          <CardHeader>
            <CardTitle>Imagens da Planta/Pastagem</CardTitle>
            <CardDescription>
              Envie até 5 imagens claras (folhas, caule, flores, frutos, raízes ou pastagem)
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
                    ✓ Pronto para análise
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

        <Card>
          <CardHeader>
            <CardTitle>Descrição Adicional (Opcional)</CardTitle>
            <CardDescription>
              Descreva características da planta, local encontrado, bioma, sintomas observados em animais
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

        <Button
          onClick={handleIdentify}
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
              <Leaf className="mr-2 h-5 w-5" />
              Identificar e Analisar
            </>
          )}
        </Button>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Relatório de Identificação</CardTitle>
              <CardDescription>
                Identificação botânica, fitossanidade, toxicidade e recomendações de manejo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm leading-relaxed text-justify">
                  {result}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button variant="outline" size="sm" onClick={handleCopyResult}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar Relatório
                </Button>
                <ReportExporter
                  title="Identificador de Plantas e Toxicidade"
                  content={result}
                  variant="outline"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default IdentificadorPlantas;
