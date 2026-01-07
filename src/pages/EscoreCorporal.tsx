import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cleanTextForDisplay } from "@/lib/textUtils";
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
      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          tool: "escore-corporal",
          plan: "enterprise",
          tipoUsuario: "profissional",
          nomeUsuario: "Usuário VetAgro",
          images: [image],
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
        },
      });

      if (error) throw error;

      if (!data?.answer) {
        throw new Error("Resposta vazia do servidor");
      }

      const cleanedResult = cleanTextForDisplay(data.answer);
      const finalResult = cleanedResult + "\n\n⚠️ Esta análise é uma estimativa baseada em imagem. Para avaliação precisa, consulte um médico veterinário ou zootecnista.";

      setResult(finalResult);
      toast({
        title: "Análise concluída!",
        description: "Escore de condição corporal estimado.",
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
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Escore de Condição Corporal (ECC)</h1>
            <p className="text-muted-foreground">Estimativa do ECC a partir de imagem com recomendações nutricionais</p>
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
