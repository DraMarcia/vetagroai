import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Leaf, Loader2, HelpCircle, TreePine, Droplets, Recycle, Award, TrendingUp, Lightbulb, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MarkdownTableRenderer } from "@/components/MarkdownTableRenderer";
import { ResponseActionButtons } from "@/components/ResponseActionButtons";

const AnaliseSustentabilidade = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [perfilUsuario, setPerfilUsuario] = useState("");
  const [tipoProducao, setTipoProducao] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [escalaProdutiva, setEscalaProdutiva] = useState("");
  const [objetivoPrincipal, setObjetivoPrincipal] = useState("");
  const [praticasAtuais, setPraticasAtuais] = useState("");
  
  // Results
  const [result, setResult] = useState("");
  const [sustainabilityScore, setSustainabilityScore] = useState<number | null>(null);
  const [maturidadeAmbiental, setMaturidadeAmbiental] = useState("");
  const [maturidadeProdutiva, setMaturidadeProdutiva] = useState("");
  const [maturidadeGestao, setMaturidadeGestao] = useState("");

  const perfilOptions = [
    { value: "produtor", label: "Produtor Rural" },
    { value: "tecnico", label: "Profissional Técnico (Vet, Zoo, Eng. Agrônomo)" },
    { value: "pesquisador", label: "Pesquisador / Acadêmico" },
    { value: "gestor", label: "Gestor / ESG" },
    { value: "estudante", label: "Estudante" },
  ];

  const tipoProducaoOptions = [
    { value: "pecuaria-corte", label: "Pecuária de Corte" },
    { value: "pecuaria-leite", label: "Pecuária Leiteira" },
    { value: "agricultura", label: "Agricultura" },
    { value: "ilpf", label: "ILPF - Integração Lavoura-Pecuária-Floresta" },
    { value: "silvicultura", label: "Silvicultura" },
    { value: "fruticultura", label: "Fruticultura" },
    { value: "olericultura", label: "Olericultura" },
    { value: "avicultura", label: "Avicultura" },
    { value: "suinocultura", label: "Suinocultura" },
    { value: "aquicultura", label: "Aquicultura" },
    { value: "misto", label: "Sistema Misto" },
  ];

  const escalaOptions = [
    { value: "pequena", label: "Pequena (até 100 ha)" },
    { value: "media", label: "Média (100-500 ha)" },
    { value: "grande", label: "Grande (500-2000 ha)" },
    { value: "muito-grande", label: "Muito Grande (acima de 2000 ha)" },
  ];

  const objetivoOptions = [
    { value: "diagnostico", label: "Diagnóstico geral de sustentabilidade" },
    { value: "certificacao", label: "Buscar certificações ambientais" },
    { value: "carbono", label: "Avaliar potencial de crédito de carbono" },
    { value: "esg", label: "Adequação ESG" },
    { value: "melhoria", label: "Identificar oportunidades de melhoria" },
    { value: "psa", label: "Avaliar PSA (Pagamento por Serviços Ambientais)" },
  ];

  const carregarExemplo = () => {
    setPerfilUsuario("produtor");
    setTipoProducao("pecuaria-corte");
    setLocalizacao("Cantá, Roraima");
    setEscalaProdutiva("media");
    setObjetivoPrincipal("carbono");
    setPraticasAtuais(`Propriedade de 450 hectares no Lavrado de Roraima com pecuária de corte extensiva.
    
Práticas atuais:
- Rotação de pastagens em 40% da área
- Reserva legal de 80 hectares preservada
- APP parcialmente degradada (15 hectares)
- Uso de sal mineral proteinado na seca
- Sem uso de queimadas há 3 anos
- Interesse em certificação de carbono e PSA
- Área com potencial para ILPF (100 hectares)
- Captação de água de chuva para bebedouros`);
  };

  const handleAnalyze = async () => {
    if (!perfilUsuario || !tipoProducao || !localizacao.trim() || !praticasAtuais.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o perfil, tipo de produção, localização e práticas atuais.",
        variant: "destructive",
      });
      return;
    }

    if (loading) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          tool: "analise-sustentabilidade",
          perfilUsuario,
          tipoProducao: tipoProducaoOptions.find(t => t.value === tipoProducao)?.label || tipoProducao,
          localizacao,
          escalaProdutiva: escalaOptions.find(e => e.value === escalaProdutiva)?.label || escalaProdutiva,
          objetivoPrincipal: objetivoOptions.find(o => o.value === objetivoPrincipal)?.label || objetivoPrincipal,
          praticasAtuais,
          question: `ANÁLISE DE SUSTENTABILIDADE SOLICITADA

PERFIL DO USUÁRIO: ${perfilOptions.find(p => p.value === perfilUsuario)?.label}
TIPO DE PRODUÇÃO: ${tipoProducaoOptions.find(t => t.value === tipoProducao)?.label}
LOCALIZAÇÃO: ${localizacao}
ESCALA PRODUTIVA: ${escalaOptions.find(e => e.value === escalaProdutiva)?.label || "Não informada"}
OBJETIVO PRINCIPAL: ${objetivoOptions.find(o => o.value === objetivoPrincipal)?.label || "Diagnóstico geral"}

PRÁTICAS ATUAIS E CONTEXTO:
${praticasAtuais}

Gere o relatório completo seguindo a estrutura fixa de 9 seções.`,
          isProfessional: perfilUsuario === "tecnico" || perfilUsuario === "pesquisador",
          context: "Análise de sustentabilidade rural",
        },
      });

      if (error) throw error;

      setResult(data.answer);

      // Extract sustainability score
      const scoreMatch = data.answer.match(/PONTUAÇÃO[:\s]*(\d+)%/i) || 
                        data.answer.match(/MATURIDADE[:\s]*(\d+)%/i) ||
                        data.answer.match(/(\d+)%\s*de\s*maturidade/i);
      if (scoreMatch) {
        setSustainabilityScore(parseInt(scoreMatch[1]));
      }

      // Extract maturity levels
      const ambientalMatch = data.answer.match(/Dimensão Ambiental[:\s]*(Baixa|Média|Alta)/i);
      const produtivaMatch = data.answer.match(/Dimensão Produtiva[:\s]*(Baixa|Média|Alta)/i);
      const gestaoMatch = data.answer.match(/Dimensão de Gestão[:\s]*(Baixa|Média|Alta)/i);
      
      if (ambientalMatch) setMaturidadeAmbiental(ambientalMatch[1]);
      if (produtivaMatch) setMaturidadeProdutiva(produtivaMatch[1]);
      if (gestaoMatch) setMaturidadeGestao(gestaoMatch[1]);

      toast({
        title: "Análise concluída!",
        description: "Relatório de sustentabilidade gerado com sucesso.",
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

  const handleCopyReport = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    toast({
      title: "Copiado!",
      description: "Relatório copiado para a área de transferência.",
    });
  };

  const handleShare = () => {
    if (!result) return;
    if (navigator.share) {
      navigator.share({
        title: "Relatório de Análise de Sustentabilidade - VetAgro IA",
        text: result.substring(0, 500) + "...",
      });
    } else {
      handleCopyReport();
      toast({
        title: "Link copiado!",
        description: "Compartilhe o relatório com sua equipe.",
      });
    }
  };

  const getMaturidadeColor = (nivel: string) => {
    switch (nivel.toLowerCase()) {
      case "alta": return "bg-green-500 text-white";
      case "média": return "bg-yellow-500 text-white";
      case "baixa": return "bg-red-500 text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-emerald-600";
    if (score >= 40) return "text-yellow-600";
    if (score >= 20) return "text-orange-600";
    return "text-red-600";
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
    "IPCC (2006 + Refinement 2019)",
    "FAO - Organização das Nações Unidas para Alimentação e Agricultura",
    "IBGE - Instituto Brasileiro de Geografia e Estatística",
    "MapBiomas",
    "Código Florestal Brasileiro (Lei 12.651/2012)"
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
            <p className="text-muted-foreground">Diagnóstico de maturidade sustentável e roteiro de evolução</p>
          </div>
        </div>
        
        {/* Commercial text */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800 mb-6">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">
              Avalie o nível de maturidade sustentável da sua propriedade integrando aspectos ambientais, 
              produtivos e de governança. Receba um roteiro claro de evolução adaptado ao seu perfil, 
              com oportunidades de certificação, PSA e crédito de carbono.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
              <CardTitle className="flex items-center gap-2">
                <TreePine className="h-5 w-5 text-green-600" />
                Dados da Propriedade
              </CardTitle>
              <CardDescription>
                Preencha as informações para análise completa
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Perfil do Usuário */}
              <div>
                <Label htmlFor="perfil">Perfil do Usuário *</Label>
                <Select value={perfilUsuario} onValueChange={setPerfilUsuario}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {perfilOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de Produção */}
              <div>
                <Label htmlFor="producao">Tipo de Produção *</Label>
                <Select value={tipoProducao} onValueChange={setTipoProducao}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoProducaoOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Localização */}
              <div>
                <Label htmlFor="localizacao">Localização (Município/Estado) *</Label>
                <Input
                  id="localizacao"
                  placeholder="Ex: Cantá, Roraima"
                  value={localizacao}
                  onChange={(e) => setLocalizacao(e.target.value)}
                />
              </div>

              {/* Escala Produtiva */}
              <div>
                <Label htmlFor="escala">Escala Produtiva</Label>
                <Select value={escalaProdutiva} onValueChange={setEscalaProdutiva}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a escala" />
                  </SelectTrigger>
                  <SelectContent>
                    {escalaOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Objetivo Principal */}
              <div>
                <Label htmlFor="objetivo">Objetivo Principal</Label>
                <Select value={objetivoPrincipal} onValueChange={setObjetivoPrincipal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {objetivoOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Práticas Atuais */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="praticas">Práticas Atuais e Contexto *</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Descreva: manejo atual, uso de insumos, gestão de pastagens, resíduos, reserva legal, APP, energia, interesse em certificações.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Textarea
                  id="praticas"
                  placeholder="Descreva detalhadamente as práticas atuais da propriedade..."
                  value={praticasAtuais}
                  onChange={(e) => setPraticasAtuais(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={carregarExemplo}
                  className="flex-1"
                >
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Exemplo
                </Button>
                <Button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Leaf className="mr-2 h-4 w-4" />
                      Analisar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Maturity Indicators */}
          {(maturidadeAmbiental || maturidadeProdutiva || maturidadeGestao) && (
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Diagnóstico de Maturidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Ambiental</p>
                    <Badge className={getMaturidadeColor(maturidadeAmbiental)}>
                      {maturidadeAmbiental || "—"}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Produtiva</p>
                    <Badge className={getMaturidadeColor(maturidadeProdutiva)}>
                      {maturidadeProdutiva || "—"}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Gestão</p>
                    <Badge className={getMaturidadeColor(maturidadeGestao)}>
                      {maturidadeGestao || "—"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Score */}
          {sustainabilityScore !== null && (
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Award className="h-5 w-5 text-amber-500" />
                  Índice Geral de Sustentabilidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pontuação</span>
                    <span className={`text-2xl font-bold ${getScoreColor(sustainabilityScore)}`}>
                      {sustainabilityScore}%
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={sustainabilityScore} className="h-3" />
                    <div 
                      className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getProgressColor(sustainabilityScore)}`}
                      style={{ width: `${sustainabilityScore}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Result */}
          {result && (
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Recycle className="h-5 w-5 text-green-600" />
                    Relatório de Análise de Sustentabilidade
                  </CardTitle>
                </div>
                <CardDescription>
                  VetAgro Sustentável AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <MarkdownTableRenderer 
                  content={result}
                  className="prose prose-sm max-w-none bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/30 dark:to-emerald-950/30 p-6 rounded-xl border border-green-200 dark:border-green-800"
                />
                
                {/* Action Buttons - Padrão Global */}
                <ResponseActionButtons
                  content={result}
                  title="Relatório de Análise de Sustentabilidade"
                  toolName="Análise de Sustentabilidade"
                />

                {/* Sharing encouragement */}
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-muted-foreground text-center">
                    Compartilhar este relatório contribui para a disseminação de práticas sustentáveis no agro.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!result && (
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <Droplets className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Avalie sua Propriedade
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-4">
                  Preencha os dados da sua propriedade para receber um diagnóstico completo 
                  de maturidade sustentável com roteiro de evolução personalizado.
                </p>
                <Button variant="outline" onClick={carregarExemplo}>
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Carregar Exemplo
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnaliseSustentabilidade;
