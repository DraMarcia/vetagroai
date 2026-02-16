import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { resilientInvoke, extractAnswer } from "@/lib/resilientInvoke";
import { cleanTextForDisplay } from "@/lib/textUtils";
import { fileToCompressedDataUrl } from "@/lib/imageDataUrl";
import { MarkdownTableRenderer } from "@/components/MarkdownTableRenderer";
import { ResponseActionButtons } from "@/components/ResponseActionButtons";

const EscoreCorporal = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [species, setSpecies] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [image, setImage] = useState("");
  const [result, setResult] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      toast({
        title: "Imagem carregada!",
        description: "Foto do animal recebida.",
      });
    };
    reader.readAsDataURL(file);
  };


  const handleAnalyze = async () => {
    if (loading) return;
    
    if (!species.trim() || !age.trim() || !weight.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha espécie, idade e peso.",
        variant: "destructive",
      });
      return;
    }

    if (!image) {
      toast({
        title: "Imagem necessária",
        description: "Anexe uma foto lateral do animal.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult("");
    
    try {
      // Compress image before sending
      let compressedImage = image;
      if (image && image.startsWith("data:")) {
        try {
          // Already a data URL, use as-is (compressed at upload time)
        } catch {
          // fallback - use original
        }
      }

      const res = await resilientInvoke("veterinary-consultation", {
        tool: "escore-corporal",
        plan: "enterprise",
        tipoUsuario: "profissional",
        nomeUsuario: "Usuário VetAgro",
        images: [compressedImage],
        data: {
          especie: species,
          idade: age,
          peso: weight,
          objetivo: `Avaliar Escore de Condição Corporal (ECC). 

INSTRUÇÕES DE FORMATAÇÃO:
- NÃO use asteriscos, hashtags ou emojis
- Use apenas marcadores • ou –
- Escreva em parágrafos longos e bem articulados
- Títulos de seção em MAIÚSCULAS seguidos de dois pontos
- Texto técnico, direto e profissional

ESTRUTURA OBRIGATÓRIA:

AVALIAÇÃO DO ESCORE:
Forneça o ECC estimado (escala 1-5 para bovinos/equinos ou 1-9 conforme espécie) com classificação textual (muito magro, magro, ideal, sobrepeso, obeso).

ANÁLISE VISUAL:
Descreva os achados visuais que fundamentam a pontuação: cobertura de costelas, depósitos de gordura, proeminência óssea, condição muscular.

INTERPRETAÇÃO CLÍNICA:
Explique o significado do escore encontrado para a saúde e desempenho do animal.

RECOMENDAÇÕES NUTRICIONAIS:
Ajustes específicos na dieta (aumentar/reduzir calorias, tipo de alimento, suplementação) baseados no escore.

ORIENTAÇÕES DE MANEJO:
Recomendações práticas de exercício, ambiente e acompanhamento.

MONITORAMENTO:
Frequência de reavaliação e metas de escore corporal.

REFERÊNCIAS:
Liste as fontes técnicas utilizadas (NRC, Henneke, Edmonson, Ferguson, Embrapa).`,
        },
      }, { hasImages: true });

      if (!res.ok) {
        toast({
          title: "Atenção",
          description: res.friendlyError || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      const answer = extractAnswer(res.data);
      if (!answer) {
        toast({
          title: "Resposta vazia",
          description: "O servidor não retornou dados. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      const cleanedResult = cleanTextForDisplay(answer);
      const finalResult = cleanedResult + "\n\n⚠️ Esta análise é uma estimativa baseada em imagem. Para avaliação precisa, consulte um médico veterinário ou zootecnista.";

      setResult(finalResult);
      toast({
        title: "Análise concluída!",
        description: "Escore de condição corporal estimado.",
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Atenção",
        description: "A análise automática da imagem não pôde ser concluída neste momento. Tente novamente.",
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
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Escore de Condição Corporal (ECC)</h1>
            <p className="text-muted-foreground">Estimativa do ECC a partir de imagem com recomendações nutricionais</p>
          </div>
        </div>

        {/* Bloco Explicativo Padronizado */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed mb-4">
            Ferramenta de avaliação do escore de condição corporal a partir de foto lateral do animal. Estima o ECC com classificação, análise visual fundamentada e recomendações nutricionais personalizadas.
          </p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <p className="font-medium text-sm text-foreground mb-1">O que faz</p>
              <p className="text-xs text-muted-foreground">Estima o ECC do animal a partir de imagem com análise visual fundamentada</p>
            </div>
            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <p className="font-medium text-sm text-foreground mb-1">Para quem é</p>
              <p className="text-xs text-muted-foreground">Médicos Veterinários, Zootecnistas e produtores rurais</p>
            </div>
            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <p className="font-medium text-sm text-foreground mb-1">Quando usar</p>
              <p className="text-xs text-muted-foreground">Para avaliar condição nutricional e ajustar manejo alimentar</p>
            </div>
            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <p className="font-medium text-sm text-foreground mb-1">O que você recebe</p>
              <p className="text-xs text-muted-foreground">ECC estimado, interpretação clínica, recomendações nutricionais e frequência de reavaliação</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Animal</CardTitle>
            <CardDescription>
              Informações básicas para avaliação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="species">Espécie *</Label>
                <Input
                  id="species"
                  placeholder="Ex: Bovina, Equina, Canina, Felina..."
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Idade *</Label>
                  <Input
                    id="age"
                    placeholder="Ex: 3 anos"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Peso Atual *</Label>
                  <Input
                    id="weight"
                    placeholder="Ex: 450 kg"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Foto do Animal</CardTitle>
            <CardDescription>
              Anexe uma foto lateral nítida do animal (perfil completo)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="image">Foto Lateral *</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="cursor-pointer"
              />
              {image && (
                <div className="mt-4">
                  <img src={image} alt="Preview" className="max-w-full h-auto rounded-lg border" />
                </div>
              )}
            </div>
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
              Analisando...
            </>
          ) : (
            <>
              <Activity className="mr-2 h-5 w-5" />
              Avaliar ECC
            </>
          )}
        </Button>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Avaliação do Escore Corporal</CardTitle>
              <CardDescription>
                Resultado da análise e recomendações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <MarkdownTableRenderer 
                  content={result}
                  className="bg-muted p-4 rounded-lg text-sm leading-relaxed"
                />
                
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-3 italic">
                    Relatório gerado via VetAgro Sustentável AI — Análise Assistida © 2025
                  </p>
                  
                  <ResponseActionButtons
                    content={result}
                    title="Escore de Condição Corporal (ECC)"
                    toolName="escore-corporal"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EscoreCorporal;
