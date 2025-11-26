import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TrendingUp, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AnaliseProdutiva = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [productionData, setProductionData] = useState("");
  const [result, setResult] = useState("");

  const handleAnalyze = async () => {
    if (!productionData.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Forneça os dados de produção.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          question: `Analise a eficiência econômica e zootécnica com base nos seguintes dados de produção:

${productionData}

Forneça:
1. Análise de KPIs (GMD, conversão alimentar, taxa de lotação, etc.)
2. Avaliação de custos de produção
3. Identificação de gargalos produtivos
4. Sugestões para otimização de custos
5. Estratégias para melhorar a produtividade geral do rebanho
6. Comparação com padrões do setor`,
          isProfessional: true,
          context: "Análise de eficiência produtiva e econômica",
        },
      });

      if (error) throw error;

      setResult(data.answer);
      toast({
        title: "Análise concluída!",
        description: "Insights produtivos gerados.",
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
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Análise Produtiva</h1>
            <p className="text-muted-foreground">Otimize eficiência econômica e zootécnica da propriedade</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Dados de Produção</CardTitle>
            <CardDescription>
              Forneça métricas de desempenho e dados econômicos da propriedade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="productionData">Dados de Produção *</Label>
              <Textarea
                id="productionData"
                placeholder="Ex: 300 animais em terminação, GMD de 0,8kg/dia, conversão alimentar 8:1, custo de produção R$ 12,00/kg, taxa de lotação 2 UA/ha..."
                value={productionData}
                onChange={(e) => setProductionData(e.target.value)}
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
              <TrendingUp className="mr-2 h-5 w-5" />
              Analisar Produção
            </>
          )}
        </Button>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Análise Produtiva</CardTitle>
              <CardDescription>
                Insights e recomendações de melhoria
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

export default AnaliseProdutiva;
