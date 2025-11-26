import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CloudRain, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AnaliseClimatica = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState("");
  const [result, setResult] = useState("");

  const handleAnalyze = async () => {
    if (!scenario.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Descreva sua situação e região.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          question: `Forneça uma análise climática para planejamento estratégico rural com base em:

${scenario}

Inclua:
1. Insights sobre previsões climáticas para a região
2. Estratégias de adaptação a eventos extremos (secas, enchentes)
3. Gestão de recursos hídricos
4. Planejamento sazonal de plantio e manejo
5. Recomendações práticas de mitigação de riscos climáticos`,
          isProfessional: true,
          context: "Análise climática para planejamento rural",
        },
      });

      if (error) throw error;

      setResult(data.answer);
      toast({
        title: "Análise concluída!",
        description: "Recomendações climáticas geradas.",
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
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <CloudRain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Análise Climática</h1>
            <p className="text-muted-foreground">Planejamento estratégico baseado em dados climáticos</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Cenário Climático</CardTitle>
            <CardDescription>
              Descreva sua região, atividade e preocupações climáticas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="scenario">Descrição do Cenário *</Label>
              <Textarea
                id="scenario"
                placeholder="Ex: Região Centro-Oeste, cultivo de soja, preocupação com seca prolongada nos próximos meses..."
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
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
              <CloudRain className="mr-2 h-5 w-5" />
              Analisar Clima
            </>
          )}
        </Button>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Análise Climática</CardTitle>
              <CardDescription>
                Insights e estratégias de adaptação
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

export default AnaliseClimatica;
