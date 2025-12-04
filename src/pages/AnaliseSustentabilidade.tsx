import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Leaf, Loader2, HelpCircle, TreePine, Droplets, Recycle, Award, TrendingUp, Lightbulb, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ReportExporter } from "@/components/ReportExporter";

const AnaliseSustentabilidade = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [practices, setPractices] = useState("");
  const [result, setResult] = useState("");
  const [sustainabilityScore, setSustainabilityScore] = useState<number | null>(null);
  const [certifications, setCertifications] = useState<string[]>([]);

  const handleAnalyze = async () => {
    if (!practices.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Descreva suas práticas atuais para análise.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          question: `Analise as seguintes práticas de sustentabilidade na propriedade rural e forneça uma avaliação completa:

PRÁTICAS DESCRITAS:
${practices}

FORNEÇA:

1. GRAU DE EFICIÊNCIA AMBIENTAL (0-100%)
Avalie e forneça uma pontuação numérica entre 0 e 100 para o nível atual de sustentabilidade. Inicie a resposta com "PONTUAÇÃO: XX%" onde XX é o número.

2. DIAGNÓSTICO ATUAL
- Pontos fortes identificados
- Pontos críticos que necessitam atenção
- Riscos ambientais potenciais

3. OPORTUNIDADES DE MELHORIA
Liste as principais oportunidades organizadas por impacto:
- Alto impacto
- Médio impacto  
- Baixo impacto

4. ROTEIRO DE ADOÇÃO PROGRESSIVA
- Curto prazo (0-6 meses): ações imediatas
- Médio prazo (6-18 meses): melhorias estruturais
- Longo prazo (18-36 meses): transformações sistêmicas

5. CERTIFICAÇÕES COMPATÍVEIS
Liste certificações que a propriedade pode buscar (ex: Orgânico, Rainforest Alliance, Carbono Neutro, Boi Verde, etc.)
Formato: CERTIFICAÇÕES: [lista separada por vírgula]

6. INDICADORES DE MONITORAMENTO
KPIs que devem ser acompanhados para medir progresso

7. REFERÊNCIAS TÉCNICAS
Normas, legislações e bases científicas consultadas`,
          isProfessional: true,
          context: "Análise de sustentabilidade na propriedade rural",
        },
      });

      if (error) throw error;

      setResult(data.answer);

      // Extract sustainability score
      const scoreMatch = data.answer.match(/PONTUAÇÃO:\s*(\d+)%/i);
      if (scoreMatch) {
        setSustainabilityScore(parseInt(scoreMatch[1]));
      }

      // Extract certifications
      const certMatch = data.answer.match(/CERTIFICAÇÕES:\s*\[([^\]]+)\]/i);
      if (certMatch) {
        const certs = certMatch[1].split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0);
        setCertifications(certs.slice(0, 5));
      }

      toast({
        title: "Análise concluída!",
        description: "Diagnóstico de sustentabilidade gerado com sucesso.",
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-emerald-600";
    if (score >= 40) return "text-yellow-600";
    if (score >= 20) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excelente";
    if (score >= 60) return "Bom";
    if (score >= 40) return "Regular";
    if (score >= 20) return "Precisa Melhorar";
    return "Crítico";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-emerald-500";
    if (score >= 40) return "bg-yellow-500";
    if (score >= 20) return "bg-orange-500";
    return "bg-red-500";
  };

  const sustainabilityReferences = [
    "EMBRAPA - Empresa Brasileira de Pesquisa Agropecuária",
    "MAPA - Ministério da Agricultura",
    "IBAMA - Instituto Brasileiro do Meio Ambiente",
    "ISO 14001 - Gestão Ambiental",
    "Rainforest Alliance Standards",
    "Protocolo de Gases de Efeito Estufa GHG"
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <Leaf className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Análise de Sustentabilidade</h1>
            <p className="text-muted-foreground">Diagnóstico ambiental e roteiro de melhoria para sua propriedade</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
              <CardTitle className="flex items-center gap-2">
                <TreePine className="h-5 w-5 text-green-600" />
                Descrever Práticas Atuais
              </CardTitle>
              <CardDescription>
                Informe detalhes sobre sua propriedade e práticas
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="practices">Práticas e Contexto</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Descreva: tipo de produção, uso de insumos, manejo de pastagens, gestão de resíduos, energia utilizada, certificações desejadas, área de reserva legal e APP.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Textarea
                  id="practices"
                  placeholder="Ex: Propriedade de 500 hectares com pecuária de corte. Uso de rotação de pastagens em 60% da área. Queimadas controladas anuais. Interesse em certificação de carbono. Reserva legal de 80 hectares..."
                  value={practices}
                  onChange={(e) => setPractices(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={loading}
                size="lg"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
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
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Dica Rápida
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Quanto mais detalhes você fornecer sobre insumos, energia, água e resíduos, mais precisa será a análise e as recomendações.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-4">
          {sustainabilityScore !== null && (
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Termômetro de Sustentabilidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Grau de Eficiência Ambiental</span>
                    <span className={`text-2xl font-bold ${getScoreColor(sustainabilityScore)}`}>
                      {sustainabilityScore}%
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={sustainabilityScore} className="h-4" />
                    <div 
                      className={`absolute top-0 left-0 h-4 rounded-full transition-all ${getProgressColor(sustainabilityScore)}`}
                      style={{ width: `${sustainabilityScore}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Crítico</span>
                    <span>Regular</span>
                    <span>Bom</span>
                    <span>Excelente</span>
                  </div>
                  <Badge className={`${getProgressColor(sustainabilityScore)} text-white`}>
                    {getScoreLabel(sustainabilityScore)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {certifications.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  Certificações Compatíveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {certifications.map((cert, idx) => (
                    <Badge key={idx} variant="outline" className="bg-amber-50 dark:bg-amber-950 border-amber-300">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-amber-600" />
                      {cert}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {result && (
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Recycle className="h-5 w-5 text-emerald-600" />
                    Diagnóstico e Roteiro de Ação
                  </CardTitle>
                </div>
                <CardDescription>
                  Análise completa com recomendações práticas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/30 dark:to-emerald-950/30 p-6 rounded-xl border border-green-200 dark:border-green-800">
                    {result}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ReportExporter
                    title="Análise de Sustentabilidade - VetAgro IA"
                    content={result}
                    toolName="Análise de Sustentabilidade VetAgro IA"
                    references={sustainabilityReferences}
                    userInputs={{ 
                      "Práticas Descritas": practices,
                      "Pontuação": sustainabilityScore ? `${sustainabilityScore}%` : "N/A"
                    }}
                    variant="default"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {!result && (
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <Droplets className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Avalie sua Propriedade
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Descreva as práticas atuais da sua propriedade para receber um diagnóstico completo de sustentabilidade com roteiro de melhorias e certificações compatíveis.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnaliseSustentabilidade;
