import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CloudRain, Loader2, HelpCircle, Sun, Thermometer, Droplets, Wind, Calendar, AlertTriangle, ExternalLink, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ReportExporter } from "@/components/ReportExporter";

const AnaliseClimatica = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState("");
  const [result, setResult] = useState("");
  const [riskLevel, setRiskLevel] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!scenario.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Descreva sua região, atividade e preocupações climáticas.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          question: `Forneça uma análise climática estratégica completa para planejamento rural:

CENÁRIO DESCRITO:
${scenario}

FORNEÇA:

1. NÍVEL DE RISCO CLIMÁTICO
Classifique como: BAIXO, MODERADO, ALTO ou CRÍTICO
Formato: RISCO: [nível]

2. PREVISÃO DE RISCOS DOMINANTES
- Principais ameaças climáticas para a região
- Probabilidade de ocorrência
- Períodos de maior vulnerabilidade

3. IMPACTOS ESPERADOS
Analise impactos em:
- Produção agrícola/pecuária
- Qualidade de pastagem
- Sanidade animal
- Recursos hídricos
- Balanço de carbono

4. MEDIDAS PREVENTIVAS RECOMENDADAS
- Infraestrutura necessária
- Ajustes no manejo
- Reservas estratégicas
- Seguro rural

5. LINHA DO TEMPO DE AÇÕES
📅 30 dias: Ações imediatas
📅 90 dias: Preparações de médio prazo
📅 180 dias: Estratégias de longo prazo

6. MONITORAMENTO CLIMÁTICO
Links e fontes recomendadas para acompanhamento:
- INMET
- CPTEC/INPE
- ANA - Agência Nacional de Águas
- Defesa Civil

7. REFERÊNCIAS TÉCNICAS
Bases científicas e normativas consultadas`,
          isProfessional: true,
          context: "Análise climática para planejamento rural estratégico",
        },
      });

      if (error) throw error;

      setResult(data.answer);

      // Extract risk level
      const riskMatch = data.answer.match(/RISCO:\s*(BAIXO|MODERADO|ALTO|CRÍTICO)/i);
      if (riskMatch) {
        setRiskLevel(riskMatch[1].toUpperCase());
      }

      toast({
        title: "Análise concluída!",
        description: "Estratégias climáticas geradas com sucesso.",
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

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "BAIXO": return "bg-green-500";
      case "MODERADO": return "bg-yellow-500";
      case "ALTO": return "bg-orange-500";
      case "CRÍTICO": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "BAIXO": return <Sun className="h-5 w-5" />;
      case "MODERADO": return <CloudRain className="h-5 w-5" />;
      case "ALTO": return <Wind className="h-5 w-5" />;
      case "CRÍTICO": return <AlertTriangle className="h-5 w-5" />;
      default: return <Thermometer className="h-5 w-5" />;
    }
  };

  const climateReferences = [
    "INMET - Instituto Nacional de Meteorologia",
    "CPTEC/INPE - Centro de Previsão de Tempo e Estudos Climáticos",
    "EMBRAPA - Empresa Brasileira de Pesquisa Agropecuária",
    "ANA - Agência Nacional de Águas",
    "IPCC - Painel Intergovernamental sobre Mudanças Climáticas",
    "FAO - Organização das Nações Unidas para Alimentação e Agricultura"
  ];

  const monitoringLinks = [
    { name: "INMET", url: "https://portal.inmet.gov.br" },
    { name: "CPTEC/INPE", url: "https://www.cptec.inpe.br" },
    { name: "ANA", url: "https://www.gov.br/ana" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
            <CloudRain className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Análise Climática Inteligente</h1>
            <p className="text-muted-foreground">Planejamento estratégico baseado em riscos climáticos regionais</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Descrever Cenário Climático
              </CardTitle>
              <CardDescription>
                Região, atividade e preocupações específicas
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="scenario">Cenário e Contexto</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Informe: região/estado, tipo de atividade (pecuária, lavoura, etc.), principais preocupações (seca, enchente, geada, calor extremo), e período de interesse.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Textarea
                  id="scenario"
                  placeholder="Ex: Propriedade no Mato Grosso do Sul, pecuária de corte extensiva. Preocupação com seca prolongada nos próximos meses e impacto na disponibilidade de forragem. Área de 1.200 hectares, 800 cabeças de gado..."
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={loading}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
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
            </CardContent>
          </Card>

          {/* Monitoring Links */}
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-blue-600" />
                Monitoramento Climático
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {monitoringLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {link.name}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-4">
          {riskLevel && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-blue-600" />
                  Nível de Risco Climático
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Badge className={`${getRiskColor(riskLevel)} text-white text-lg px-4 py-2`}>
                    {getRiskIcon(riskLevel)}
                    <span className="ml-2">{riskLevel}</span>
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {riskLevel === "BAIXO" && "Condições climáticas favoráveis. Mantenha monitoramento preventivo."}
                    {riskLevel === "MODERADO" && "Atenção recomendada. Implemente medidas de mitigação."}
                    {riskLevel === "ALTO" && "Risco significativo. Ações preventivas urgentes são necessárias."}
                    {riskLevel === "CRÍTICO" && "Situação de emergência. Medidas imediatas e plano de contingência."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {result && (
            <>
              {/* Timeline Preview */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    Linha do Tempo de Ações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <span className="text-green-600 font-bold text-sm">30d</span>
                      </div>
                      <span className="text-xs mt-1 text-muted-foreground">Imediato</span>
                    </div>
                    <div className="flex-1 h-1 bg-gradient-to-r from-green-500 via-yellow-500 to-orange-500 mx-2" />
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                        <span className="text-yellow-600 font-bold text-sm">90d</span>
                      </div>
                      <span className="text-xs mt-1 text-muted-foreground">Médio Prazo</span>
                    </div>
                    <div className="flex-1 h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-blue-500 mx-2" />
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">180d</span>
                      </div>
                      <span className="text-xs mt-1 text-muted-foreground">Longo Prazo</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-cyan-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Droplets className="h-5 w-5 text-cyan-600" />
                      Análise Climática Completa
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Previsões, impactos e estratégias de adaptação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/30 dark:to-cyan-950/30 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                      {result}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ReportExporter
                      title="Análise Climática Estratégica - VetAgro IA"
                      content={result}
                      toolName="Análise Climática VetAgro IA"
                      references={climateReferences}
                      userInputs={{ 
                        "Cenário Descrito": scenario,
                        "Nível de Risco": riskLevel || "N/A"
                      }}
                      variant="default"
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {!result && (
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <Wind className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Planeje com Inteligência Climática
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Descreva sua região e atividade para receber uma análise completa de riscos climáticos, impactos esperados e um cronograma de ações preventivas.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnaliseClimatica;
