import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Leaf, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AnaliseSustentabilidade = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [practices, setPractices] = useState("");
  const [result, setResult] = useState("");

  const handleAnalyze = async () => {
    if (!practices.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Descreva suas práticas atuais.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          question: `Analise as seguintes práticas de sustentabilidade na propriedade rural:

${practices}

Forneça:
1. Avaliação do impacto ambiental atual
2. Sugestões de melhorias práticas
3. Informações sobre certificações relevantes (orgânico, bioeconomia, carbono neutro)
4. Plano de ação para tornar a operação mais sustentável
5. Indicadores de sustentabilidade a serem monitorados`,
          isProfessional: true,
          context: "Análise de sustentabilidade na propriedade rural",
        },
      });

      if (error) throw error;

      setResult(data.answer);
      toast({
        title: "Análise concluída!",
        description: "Recomendações de sustentabilidade geradas.",
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
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center">
            <Leaf className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Análise de Sustentabilidade</h1>
            <p className="text-muted-foreground">Avalie e melhore práticas sustentáveis na propriedade rural</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Práticas Atuais</CardTitle>
            <CardDescription>
              Descreva as práticas sustentáveis e objetivos da sua propriedade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="practices">Descrição das Práticas *</Label>
              <Textarea
                id="practices"
                placeholder="Ex: Propriedade de 100 hectares com gado de corte, uso de rotação de pastagens, interesse em certificação orgânica..."
                value={practices}
                onChange={(e) => setPractices(e.target.value)}
                className="min-h-[150px]"
              />
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
              <Leaf className="mr-2 h-5 w-5" />
              Analisar Sustentabilidade
            </>
          )}
        </Button>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Análise e Recomendações</CardTitle>
              <CardDescription>
                Plano de ação para sustentabilidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
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

export default AnaliseSustentabilidade;
