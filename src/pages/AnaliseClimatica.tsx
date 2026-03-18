import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CloudRain, Loader2, HelpCircle, Sun, Thermometer, Droplets, Wind, Calendar, AlertTriangle, ExternalLink, MapPin, Lightbulb, Target, FileText, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { resilientInvoke, extractAnswer } from "@/lib/resilientInvoke";
import { supabase } from "@/integrations/supabase/client";
import { AuthDialog } from "@/components/AuthDialog";
import { ResponseActionButtons } from "@/components/ResponseActionButtons";
import { MarkdownTableRenderer } from "@/components/MarkdownTableRenderer";

const AnaliseClimatica = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [scenario, setScenario] = useState("");
  const [result, setResult] = useState("");
  const [riskLevel, setRiskLevel] = useState<string | null>(null);

  // Exemplo guiado de Roraima
  const exampleScenario = `Propriedade rural localizada no sul de Roraima, município de Cantá, com atividade principal de pecuária de corte em sistema extensivo. Área aproximada de 1.200 hectares, com 800 cabeças de gado. Preocupações principais: prolongamento do período seco, redução da disponibilidade de forragem, aumento do estresse térmico animal e riscos de queimadas no período de estiagem. Objetivo: planejar ações preventivas e estratégias de adaptação climática para os próximos 12 meses.`;

  const handleUseExample = () => {
    setScenario(exampleScenario);
    toast({
      title: "Exemplo carregado",
      description: "Cenário de Roraima preenchido. Edite conforme necessário ou clique em Analisar.",
    });
  };

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
      const dataAtual = new Date().toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });

      const res = await resilientInvoke("sustainability-handler", {
        question: `Você é um especialista em climatologia aplicada ao agronegócio brasileiro, com foco especial na região Norte (Amazônia e Roraima).

INSTRUÇÕES DE FORMATAÇÃO OBRIGATÓRIAS:
- NUNCA use hashtags (#), asteriscos (*), ou símbolos markdown
- Use APENAS bullets com • ou – para listas
- Títulos de seção devem usar formato "TÍTULO:" em maiúsculas
- Parágrafos curtos (máximo 4-5 linhas cada)
- Texto ESCANEÁVEL para leitura rápida
- Seções VISUALMENTE RECONHECÍVEIS

ESTRUTURA OBRIGATÓRIA DA RESPOSTA (seguir EXATAMENTE esta ordem):

────────────────────────────────────────
ANÁLISE CLIMÁTICA ESTRATÉGICA
VetAgro Sustentável AI — Relatório Técnico Orientativo
Data da Análise: ${dataAtual}
────────────────────────────────────────

1. SÍNTESE EXECUTIVA CLIMÁTICA

Resumo claro e direto dos principais riscos e impactos para a região analisada. Máximo 4-5 linhas destacando os pontos críticos.

────────────────────────────────────────

2. CARACTERIZAÇÃO CLIMÁTICA REGIONAL

• Regime de chuvas: [descrever padrão de precipitação]
• Temperatura média: [faixa de temperatura]
• Eventos extremos relevantes: [listar principais]
• Sazonalidade: [período seco vs chuvoso]
• Particularidades da região: [fatores locais relevantes]

────────────────────────────────────────

3. IMPACTOS NA ATIVIDADE AGROPECUÁRIA

RISCO: [BAIXO/MODERADO/ALTO/CRÍTICO]

Para cada item, explicar o impacto prático:
• Produção animal: [impactos específicos]
• Forragem e pastagem: [impactos específicos]
• Manejo e operações: [impactos específicos]
• Infraestrutura rural: [impactos específicos]
• Recursos hídricos: [impactos específicos]

────────────────────────────────────────

5. ESTRATÉGIAS DE ADAPTAÇÃO RECOMENDADAS

Medidas práticas e realistas:
• Ajustes de manejo: [recomendações]
• Planejamento forrageiro: [recomendações]
• Infraestrutura: [recomendações]
• Monitoramento climático: [recomendações]
• Seguro rural: [orientações quando aplicável]

────────────────────────────────────────

6. CRONOGRAMA SUGERIDO DE AÇÕES

CURTO PRAZO (30 dias):
• Ação 1 — justificativa
• Ação 2 — justificativa

MÉDIO PRAZO (90 dias):
• Ação 1 — justificativa
• Ação 2 — justificativa

LONGO PRAZO (180 dias):
• Ação 1 — justificativa
• Ação 2 — justificativa

────────────────────────────────────────

7. FONTES DE MONITORAMENTO CLIMÁTICO

• INMET — Instituto Nacional de Meteorologia. Monitoramento de condições climáticas e alertas. Disponível em: portal.inmet.gov.br
• CPTEC/INPE — Centro de Previsão de Tempo e Estudos Climáticos. Previsões e modelagem climática. Disponível em: cptec.inpe.br
• ANA — Agência Nacional de Águas. Monitoramento de recursos hídricos. Disponível em: gov.br/ana

────────────────────────────────────────

8. ALERTA LEGAL

Esta análise tem caráter orientativo e não substitui o acompanhamento técnico especializado por profissional habilitado ou consulta a órgãos oficiais de meteorologia.

────────────────────────────────────────

9. REFERÊNCIAS TÉCNICAS

• IPCC — Intergovernmental Panel on Climate Change. Climate Change Reports and Regional Assessments. Disponível em: ipcc.ch
• EMBRAPA — Empresa Brasileira de Pesquisa Agropecuária. Zoneamento Agroclimático e Adaptação às Mudanças Climáticas. Disponível em: embrapa.br
• INMET — Instituto Nacional de Meteorologia. Normais Climatológicas do Brasil (1991-2020). Disponível em: inmet.gov.br
• INPE — Instituto Nacional de Pesquisas Espaciais. Monitoramento Climático da Amazônia. Disponível em: inpe.br
• FAO — Food and Agriculture Organization. Climate-Smart Agriculture Guidelines. Disponível em: fao.org

────────────────────────────────────────

CENÁRIO A ANALISAR:
${scenario}`,
        
        context: "Análise climática para planejamento rural estratégico",
      });

      if (!res.ok) {
        toast({
          title: "Atenção",
          description: res.friendlyError || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      const answer = extractAnswer(res.data);
      setResult(answer);

      // Extract risk level
      const riskMatch = answer.match(/RISCO:\s*(BAIXO|MODERADO|ALTO|CRÍTICO)/i);
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
        title: "Atenção",
        description: "Ocorreu um problema temporário. Por favor, tente novamente.",
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

  const monitoringLinks = [
    { name: "INMET - Instituto Nacional de Meteorologia", url: "https://portal.inmet.gov.br" },
    { name: "CPTEC/INPE - Previsão de Tempo", url: "https://www.cptec.inpe.br" },
    { name: "ANA - Agência Nacional de Águas", url: "https://www.gov.br/ana" },
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
            <p className="text-muted-foreground">Análise estratégica de riscos climáticos regionais com recomendações de adaptação</p>
          </div>
        </div>

        {/* Badges informativos */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 border-blue-300">
            <Thermometer className="h-3 w-3 mr-1 text-blue-500" /> Riscos Climáticos
          </Badge>
          <Badge variant="outline" className="bg-cyan-50 dark:bg-cyan-950 border-cyan-300">
            <Droplets className="h-3 w-3 mr-1 text-cyan-500" /> Recursos Hídricos
          </Badge>
          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950 border-amber-300">
            <Sun className="h-3 w-3 mr-1 text-amber-500" /> Adaptação
          </Badge>
        </div>
      </div>

      {/* Bloco Explicativo Inicial */}
      <Card className="mb-6 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/30 dark:to-cyan-950/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5 text-blue-600" />
            O que esta ferramenta faz?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Esta ferramenta fornece uma <strong>análise estratégica de riscos climáticos regionais</strong>, impactos esperados sobre a produção agropecuária e recomendações práticas de adaptação e mitigação, com base em dados oficiais e projeções climáticas.
          </p>
          
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex items-start gap-2 p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Para quem é</p>
                <p className="text-xs text-muted-foreground">Produtores rurais, técnicos e gestores que precisam planejar ações preventivas</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <FileText className="h-5 w-5 text-cyan-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">O que você recebe</p>
                <p className="text-xs text-muted-foreground">Relatório com riscos, impactos, estratégias e cronograma de ações</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Foco regional</p>
                <p className="text-xs text-muted-foreground">Análise adaptada ao contexto climático brasileiro, incluindo Roraima e Amazônia</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
              {/* Botão de Exemplo Guiado */}
              <Button
                onClick={handleUseExample}
                variant="outline"
                className="w-full border-dashed border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-700 dark:text-blue-400"
              >
                <Lightbulb className="mr-2 h-4 w-4" />
                Usar exemplo de Roraima
              </Button>

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
                  placeholder="Descreva sua propriedade, localização, atividade produtiva e principais preocupações climáticas..."
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  className="min-h-[200px]"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Dica: Inclua localização, tipo de atividade, área, quantidade de animais e suas principais preocupações climáticas.
                </p>
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
                Fontes de Monitoramento Climático
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

              {/* Análise Completa - Texto em bloco contínuo */}
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
                  {/* Texto em bloco contínuo - sem scroll interno */}
                  <div className="prose prose-sm max-w-none bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/30 dark:to-cyan-950/30 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                    <MarkdownTableRenderer content={result} />
                  </div>
                  
                  {/* Botões Padrão - Copiar + Compartilhar */}
                  <ResponseActionButtons
                    content={result}
                    title="Análise Climática Estratégica"
                    toolName="analise-climatica"
                    className="pt-2"
                  />
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
                <p className="text-muted-foreground max-w-md mx-auto mb-4">
                  Descreva sua região e atividade para receber uma análise completa de riscos climáticos, impactos esperados e um cronograma de ações preventivas.
                </p>
                <div className="flex justify-center">
                  <Button
                    onClick={handleUseExample}
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                  >
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Ver exemplo com Roraima
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnaliseClimatica;
