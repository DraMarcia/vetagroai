import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Cloud, Loader2, HelpCircle, Flame, Droplets, Wind, TreePine, RefreshCw, Award, TrendingDown, BarChart3, Leaf } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ReportExporter } from "@/components/ReportExporter";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from "recharts";

const CalculadoraGEE = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingRecalc, setLoadingRecalc] = useState(false);
  const [herdData, setHerdData] = useState("");
  const [result, setResult] = useState("");
  const [recalcResult, setRecalcResult] = useState("");
  const [emissionData, setEmissionData] = useState<{name: string, value: number, color: string}[]>([]);
  const [totalEmissions, setTotalEmissions] = useState<number | null>(null);

  const handleCalculate = async (withIntervention = false) => {
    if (!herdData.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Forneça os dados do rebanho para calcular as emissões.",
        variant: "destructive",
      });
      return;
    }

    if (withIntervention) {
      setLoadingRecalc(true);
    } else {
      setLoading(true);
    }

    try {
      const basePrompt = `Calcule as emissões de Gases de Efeito Estufa (GEE) com base nos seguintes dados:

DADOS DO REBANHO:
${herdData}

FORNEÇA:

1. EMISSÕES TOTAIS
Formato: TOTAL: XX.X tCO₂eq/ano

2. EMISSÕES POR GÁS
Detalhe as emissões separadas:
- CH₄ (Metano): XX.X tCO₂eq (fermentação entérica + dejetos)
- N₂O (Óxido Nitroso): XX.X tCO₂eq (manejo de dejetos + solo)
- CO₂ (Dióxido de Carbono): XX.X tCO₂eq (energia + transporte)

Formato JSON: GASES: {"CH4": XX.X, "N2O": XX.X, "CO2": XX.X}

3. EMISSÕES POR CATEGORIA ANIMAL
Distribua as emissões por categoria (matrizes, bezerros, novilhos, touros, etc.)

4. RANKING DOS MAIORES EMISSORES
Identifique os 5 principais fatores de emissão na propriedade

5. COMPARATIVO COM BENCHMARKS
Compare com sistemas semelhantes:
- Média do setor brasileiro
- Melhores práticas internacionais
- Potencial de redução

6. METODOLOGIA DE CÁLCULO
Explique brevemente os fatores de emissão utilizados (base IPCC)`;

      const interventionAddition = withIntervention ? `

7. RECÁLCULO COM INTERVENÇÕES
Considere a implementação das seguintes práticas mitigadoras:
- Aditivos alimentares (Tanino, 3-NOP, Óleos essenciais)
- Manejo rotacionado intensivo
- Integração Lavoura-Pecuária-Floresta (ILPF)
- Biodigestores
- Melhoramento genético
- Confinamento estratégico

Para cada prática, calcule:
- Redução estimada em tCO₂eq
- Custo-benefício aproximado
- Viabilidade de implementação

8. SIMULAÇÃO DE CRÉDITOS DE CARBONO
Com as intervenções sugeridas, estime:
- Créditos potenciais (tCO₂e)
- Valor estimado (US$ 5-15/tCO₂e)
- Elegibilidade para programas (Verra, Gold Standard, ABC)` : `

7. ESTRATÉGIAS DE MITIGAÇÃO
Sugira práticas específicas para redução:
- Aditivos alimentares
- Manejo de pastagem
- ILPF
- Biodigestores
- Genética
- Confinamento estratégico

8. REFERÊNCIAS TÉCNICAS
Base metodológica IPCC e fontes científicas`;

      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          question: basePrompt + interventionAddition,
          isProfessional: true,
          context: "Cálculo de emissões de GEE e pegada de carbono",
        },
      });

      if (error) throw error;

      if (withIntervention) {
        setRecalcResult(data.answer);
      } else {
        setResult(data.answer);

        // Parse emissions data for charts
        const gasMatch = data.answer.match(/GASES:\s*\{([^}]+)\}/);
        if (gasMatch) {
          try {
            const gasJson = JSON.parse(`{${gasMatch[1]}}`);
            const chartData = [
              { name: "CH₄ (Metano)", value: gasJson.CH4 || 0, color: "#f97316" },
              { name: "N₂O (Óxido Nitroso)", value: gasJson.N2O || 0, color: "#84cc16" },
              { name: "CO₂ (Dióxido)", value: gasJson.CO2 || 0, color: "#64748b" },
            ];
            setEmissionData(chartData);
          } catch (e) {
            console.log("Could not parse gas data");
          }
        }

        // Parse total emissions
        const totalMatch = data.answer.match(/TOTAL:\s*([\d.,]+)\s*tCO₂eq/i);
        if (totalMatch) {
          setTotalEmissions(parseFloat(totalMatch[1].replace(',', '.')));
        }
      }

      toast({
        title: withIntervention ? "Recálculo concluído!" : "Cálculo concluído!",
        description: withIntervention ? "Simulação com intervenções gerada." : "Emissões de GEE calculadas com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro ao calcular",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      if (withIntervention) {
        setLoadingRecalc(false);
      } else {
        setLoading(false);
      }
    }
  };

  const geeReferences = [
    "IPCC - Painel Intergovernamental sobre Mudanças Climáticas",
    "EMBRAPA - Empresa Brasileira de Pesquisa Agropecuária",
    "MAPA - Ministério da Agricultura, Pecuária e Abastecimento",
    "Programa ABC (Agricultura de Baixa Emissão de Carbono)",
    "SEEG - Sistema de Estimativas de Emissões de Gases",
    "GHG Protocol - Protocolo de Gases de Efeito Estufa"
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-green-600 flex items-center justify-center shadow-lg">
            <Cloud className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Calculadora Integrada de Emissões de GEE</h1>
            <p className="text-muted-foreground">Estime emissões totais (CO₂, CH₄, N₂O), identifique fontes e simule mitigação</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950 border-orange-300">
            <Flame className="h-3 w-3 mr-1 text-orange-500" /> Metano (CH₄)
          </Badge>
          <Badge variant="outline" className="bg-lime-50 dark:bg-lime-950 border-lime-300">
            <Wind className="h-3 w-3 mr-1 text-lime-500" /> Óxido Nitroso (N₂O)
          </Badge>
          <Badge variant="outline" className="bg-slate-50 dark:bg-slate-950 border-slate-300">
            <Cloud className="h-3 w-3 mr-1 text-slate-500" /> Dióxido de Carbono (CO₂)
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-2 border-teal-200 dark:border-teal-800">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-green-50 dark:from-teal-950 dark:to-green-950">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-teal-600" />
                Dados do Rebanho
              </CardTitle>
              <CardDescription>
                Informe detalhes sobre sua produção
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="herdData">Informações do Sistema</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Inclua: número de animais por categoria (matrizes, bezerros, novilhos, touros), peso médio, sistema de produção (extensivo, semi-intensivo, confinamento, ILP, ILPF), área de pastagem, e práticas já adotadas.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Textarea
                  id="herdData"
                  placeholder="Ex: 500 cabeças de gado de corte Nelore
- 200 matrizes (450kg)
- 150 bezerros (180kg)
- 100 novilhos (350kg)
- 50 touros (700kg)
Sistema semi-intensivo
800 hectares de pastagem rotacionada
Suplementação mineral + sal proteinado na seca..."
                  value={herdData}
                  onChange={(e) => setHerdData(e.target.value)}
                  className="min-h-[220px]"
                />
              </div>

              <Button
                onClick={() => handleCalculate(false)}
                disabled={loading || loadingRecalc}
                size="lg"
                className="w-full bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Calculando...
                  </>
                ) : (
                  <>
                    <Cloud className="mr-2 h-5 w-5" />
                    Calcular Emissões
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-teal-50 dark:bg-teal-950 border-teal-200 dark:border-teal-800">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Leaf className="h-5 w-5 text-teal-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-teal-800 dark:text-teal-200">Metodologia IPCC</p>
                  <p className="text-teal-700 dark:text-teal-300">Cálculos baseados em fatores de emissão do IPCC e adaptados para condições brasileiras.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-4">
          {totalEmissions !== null && (
            <Card className="border-l-4 border-l-teal-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-teal-600" />
                  Emissões Totais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-bold text-teal-600">{totalEmissions.toFixed(1)}</span>
                  <span className="text-xl text-muted-foreground">tCO₂eq/ano</span>
                </div>
                <Progress value={Math.min((totalEmissions / 1000) * 100, 100)} className="h-3" />
                <p className="text-xs text-muted-foreground mt-2">Escala referencial: 0 - 1000 tCO₂eq/ano</p>
              </CardContent>
            </Card>
          )}

          {emissionData.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Distribuição por Gás</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={emissionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {emissionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 justify-center">
                    {emissionData.map((entry, idx) => (
                      <Badge key={idx} style={{ backgroundColor: entry.color }} className="text-white text-xs">
                        {entry.name}: {entry.value.toFixed(1)}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Emissões por Fonte</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={emissionData} layout="vertical">
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} />
                        <RechartsTooltip />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {emissionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {result && (
            <>
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="flex items-center gap-2">
                      <Droplets className="h-5 w-5 text-green-600" />
                      Análise Completa de Emissões
                    </CardTitle>
                    <Button
                      onClick={() => handleCalculate(true)}
                      disabled={loadingRecalc || loading}
                      variant="outline"
                      size="sm"
                      className="border-green-300 hover:bg-green-50 dark:hover:bg-green-950"
                    >
                      {loadingRecalc ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Recalcular com Intervenção
                    </Button>
                  </div>
                  <CardDescription>
                    Detalhamento por gás, categoria e estratégias de mitigação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap bg-gradient-to-br from-teal-50/50 to-green-50/50 dark:from-teal-950/30 dark:to-green-950/30 p-6 rounded-xl border border-teal-200 dark:border-teal-800">
                      {result}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ReportExporter
                      title="Calculadora de Emissões de GEE - VetAgro IA"
                      content={result}
                      toolName="Calculadora de GEE VetAgro IA"
                      references={geeReferences}
                      userInputs={{ 
                        "Dados do Rebanho": herdData,
                        "Emissões Totais": totalEmissions ? `${totalEmissions.toFixed(1)} tCO₂eq/ano` : "N/A"
                      }}
                      variant="default"
                    />
                  </div>
                </CardContent>
              </Card>

              {recalcResult && (
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-purple-600" />
                      Simulação com Intervenções
                    </CardTitle>
                    <CardDescription>
                      Projeção de redução e potencial de créditos de carbono
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/30 dark:to-pink-950/30 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                        {recalcResult}
                      </div>
                    </div>
                    <ReportExporter
                      title="Simulação de Mitigação de GEE - VetAgro IA"
                      content={recalcResult}
                      toolName="Calculadora de GEE VetAgro IA"
                      references={geeReferences}
                      userInputs={{ 
                        "Dados do Rebanho": herdData,
                        "Tipo de Análise": "Simulação com Intervenções"
                      }}
                      variant="outline"
                    />
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!result && (
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <TreePine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Calcule sua Pegada de Carbono
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Informe os dados do seu rebanho para receber uma análise completa de emissões de GEE (CH₄, N₂O, CO₂), comparativos com benchmarks e estratégias de mitigação.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalculadoraGEE;
