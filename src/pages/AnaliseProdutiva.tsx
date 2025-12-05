import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TrendingUp, Loader2, ChevronDown, Target, DollarSign, AlertTriangle, Lightbulb, BarChart3, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { ReportExporter } from "@/components/ReportExporter";

const SISTEMAS_PRODUCAO = [
  { value: "recria", label: "Recria" },
  { value: "engorda", label: "Engorda" },
  { value: "confinamento", label: "Confinamento" },
  { value: "ilp", label: "ILP (Integração Lavoura-Pecuária)" },
  { value: "ilpf", label: "ILPF (Integração Lavoura-Pecuária-Floresta)" },
  { value: "leite", label: "Produção de Leite" },
  { value: "ovinos", label: "Ovinos" },
  { value: "caprinos", label: "Caprinos" },
  { value: "suinos", label: "Suínos" },
  { value: "aves", label: "Aves" },
];

const REFERENCIAS_ZOOTECNICAS = [
  "EMBRAPA - Empresa Brasileira de Pesquisa Agropecuária",
  "ABIEC - Associação Brasileira das Indústrias Exportadoras de Carnes",
  "FAO - Food and Agriculture Organization",
  "MAPA - Ministério da Agricultura, Pecuária e Abastecimento",
  "IPCC - Intergovernmental Panel on Climate Change",
  "CEPEA - Centro de Estudos Avançados em Economia Aplicada",
];

const AnaliseProdutiva = () => {
  const { toast } = useToast();
  const { plan } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [showOptional, setShowOptional] = useState(false);

  // Campos estruturados
  const [tipoSistema, setTipoSistema] = useState("");
  const [numeroAnimais, setNumeroAnimais] = useState("");
  const [gmd, setGmd] = useState("");
  const [conversaoAlimentar, setConversaoAlimentar] = useState("");
  const [custoPorKg, setCustoPorKg] = useState("");
  const [taxaLotacao, setTaxaLotacao] = useState("");
  const [areaTotal, setAreaTotal] = useState("");
  
  // Campos opcionais
  const [precoVenda, setPrecoVenda] = useState("");
  const [mortalidade, setMortalidade] = useState("");
  const [eficienciaReprodutiva, setEficienciaReprodutiva] = useState("");
  const [datasLote, setDatasLote] = useState("");
  const [observacoesAdicionais, setObservacoesAdicionais] = useState("");

  const preencherExemplo = (tipo: string) => {
    if (tipo === "engorda") {
      setTipoSistema("engorda");
      setNumeroAnimais("300");
      setGmd("0.8");
      setConversaoAlimentar("8");
      setCustoPorKg("12");
      setTaxaLotacao("2");
      setAreaTotal("150");
      setPrecoVenda("280");
      setMortalidade("1.5");
    } else if (tipo === "confinamento") {
      setTipoSistema("confinamento");
      setNumeroAnimais("500");
      setGmd("1.4");
      setConversaoAlimentar("6.5");
      setCustoPorKg("15");
      setTaxaLotacao("5");
      setAreaTotal("100");
      setPrecoVenda("290");
      setMortalidade("0.8");
    } else if (tipo === "ilp") {
      setTipoSistema("ilp");
      setNumeroAnimais("200");
      setGmd("0.6");
      setConversaoAlimentar("10");
      setCustoPorKg("9");
      setTaxaLotacao("1.5");
      setAreaTotal("300");
      setPrecoVenda("270");
      setMortalidade("2");
      setEficienciaReprodutiva("85");
    }
  };

  const handleAnalyze = async () => {
    if (!tipoSistema || !numeroAnimais) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha pelo menos o tipo de sistema e número de animais.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          tool: "analise-produtiva",
          plan: plan || "free",
          data: {
            tipoSistema,
            numeroAnimais: Number(numeroAnimais),
            gmd: gmd ? Number(gmd) : null,
            conversaoAlimentar: conversaoAlimentar ? Number(conversaoAlimentar) : null,
            custoPorKg: custoPorKg ? Number(custoPorKg) : null,
            taxaLotacao: taxaLotacao ? Number(taxaLotacao) : null,
            areaTotal: areaTotal ? Number(areaTotal) : null,
            precoVenda: precoVenda ? Number(precoVenda) : null,
            mortalidade: mortalidade ? Number(mortalidade) : null,
            eficienciaReprodutiva: eficienciaReprodutiva ? Number(eficienciaReprodutiva) : null,
            datasLote,
            observacoesAdicionais,
          },
        },
      });

      if (error) throw error;

      setResult(data.answer || data.response);
      toast({
        title: "Análise concluída!",
        description: "Planejamento produtivo gerado com sucesso.",
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

  const getUserInputs = () => ({
    "Tipo de Sistema": SISTEMAS_PRODUCAO.find(s => s.value === tipoSistema)?.label || tipoSistema,
    "Número de Animais": numeroAnimais,
    "GMD (kg/dia)": gmd || "Não informado",
    "Conversão Alimentar": conversaoAlimentar ? `${conversaoAlimentar}:1` : "Não informado",
    "Custo por kg (R$)": custoPorKg || "Não informado",
    "Taxa de Lotação (UA/ha)": taxaLotacao || "Não informado",
    "Área Total (ha)": areaTotal || "Não informado",
    "Preço de Venda (R$/@)": precoVenda || "Não informado",
    "Mortalidade (%)": mortalidade || "Não informado",
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <BarChart3 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Planejador Produtivo & Econômico
            </h1>
            <p className="text-muted-foreground">
              Avalie desempenho zootécnico, detecte gargalos e simule resultados econômicos
            </p>
          </div>
        </div>

        {/* O que a ferramenta faz */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-amber-600" />
                <span>Interpreta dados de rebanho</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span>Identifica pontos de otimização</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span>Calcula impacto financeiro</span>
              </div>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-600" />
                <span>Sugere estratégias de manejo</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Gera relatório PDF profissional</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Botões de Exemplo */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => preencherExemplo("engorda")}>
            Exemplo: Engorda 180 dias
          </Button>
          <Button variant="outline" size="sm" onClick={() => preencherExemplo("confinamento")}>
            Exemplo: Confinamento 90 dias
          </Button>
          <Button variant="outline" size="sm" onClick={() => preencherExemplo("ilp")}>
            Exemplo: Sistema ILP
          </Button>
        </div>

        {/* Card: Sistema Produtivo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              Sistema Produtivo
            </CardTitle>
            <CardDescription>Informações básicas do sistema de produção</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tipoSistema">Tipo do Sistema *</Label>
              <Select value={tipoSistema} onValueChange={setTipoSistema}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o sistema" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {SISTEMAS_PRODUCAO.map((sistema) => (
                    <SelectItem key={sistema.value} value={sistema.value}>
                      {sistema.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="numeroAnimais">Número de Animais *</Label>
              <Input
                id="numeroAnimais"
                type="number"
                placeholder="Ex: 300"
                value={numeroAnimais}
                onChange={(e) => setNumeroAnimais(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="areaTotal">Área Total (hectares)</Label>
              <Input
                id="areaTotal"
                type="number"
                placeholder="Ex: 150"
                value={areaTotal}
                onChange={(e) => setAreaTotal(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxaLotacao">Taxa de Lotação (UA/ha)</Label>
              <Input
                id="taxaLotacao"
                type="number"
                step="0.1"
                placeholder="Ex: 2.0"
                value={taxaLotacao}
                onChange={(e) => setTaxaLotacao(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card: Indicadores Zootécnicos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-blue-500" />
              Indicadores Zootécnicos
            </CardTitle>
            <CardDescription>Métricas de desempenho do rebanho</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gmd">GMD - Ganho Médio Diário (kg/dia)</Label>
              <Input
                id="gmd"
                type="number"
                step="0.01"
                placeholder="Ex: 0.8"
                value={gmd}
                onChange={(e) => setGmd(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conversaoAlimentar">Conversão Alimentar (kg MS/kg ganho)</Label>
              <Input
                id="conversaoAlimentar"
                type="number"
                step="0.1"
                placeholder="Ex: 8 (significa 8:1)"
                value={conversaoAlimentar}
                onChange={(e) => setConversaoAlimentar(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card: Indicadores Econômicos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-green-500" />
              Indicadores Econômicos
            </CardTitle>
            <CardDescription>Custos e valores de comercialização</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="custoPorKg">Custo por kg Produzido (R$)</Label>
              <Input
                id="custoPorKg"
                type="number"
                step="0.01"
                placeholder="Ex: 12.00"
                value={custoPorKg}
                onChange={(e) => setCustoPorKg(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precoVenda">Preço de Venda (R$/@)</Label>
              <Input
                id="precoVenda"
                type="number"
                step="0.01"
                placeholder="Ex: 280.00"
                value={precoVenda}
                onChange={(e) => setPrecoVenda(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card: Dados Opcionais */}
        <Collapsible open={showOptional} onOpenChange={setShowOptional}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    Dados Adicionais (Opcional)
                  </span>
                  <ChevronDown className={`h-5 w-5 transition-transform ${showOptional ? "rotate-180" : ""}`} />
                </CardTitle>
                <CardDescription>Informações complementares para análise mais detalhada</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mortalidade">Mortalidade (%)</Label>
                  <Input
                    id="mortalidade"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 1.5"
                    value={mortalidade}
                    onChange={(e) => setMortalidade(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eficienciaReprodutiva">Eficiência Reprodutiva (%)</Label>
                  <Input
                    id="eficienciaReprodutiva"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 85"
                    value={eficienciaReprodutiva}
                    onChange={(e) => setEficienciaReprodutiva(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="datasLote">Período/Datas do Lote</Label>
                  <Input
                    id="datasLote"
                    placeholder="Ex: Jan/2024 - Jun/2024"
                    value={datasLote}
                    onChange={(e) => setDatasLote(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="observacoesAdicionais">Observações Adicionais</Label>
                  <Textarea
                    id="observacoesAdicionais"
                    placeholder="Outras informações relevantes para a análise..."
                    value={observacoesAdicionais}
                    onChange={(e) => setObservacoesAdicionais(e.target.value)}
                  />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Botão de Análise */}
        <Button
          onClick={handleAnalyze}
          disabled={loading}
          size="lg"
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processando Análise...
            </>
          ) : (
            <>
              <BarChart3 className="mr-2 h-5 w-5" />
              Gerar Planejamento Produtivo
            </>
          )}
        </Button>

        {/* Resultado */}
        {result && (
          <div className="space-y-4">
            <Card className="border-2 border-amber-200 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-amber-500" />
                  Planejamento Produtivo & Econômico
                </CardTitle>
                <CardDescription>
                  Análise técnica com diagnóstico, indicadores e recomendações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap bg-muted/50 p-4 rounded-lg text-sm leading-relaxed">
                    {result}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exportador de Relatórios */}
            <ReportExporter
              title="Planejador Produtivo & Econômico VetAgro"
              content={result}
              toolName="Planejador Produtivo"
              references={REFERENCIAS_ZOOTECNICAS}
              userInputs={getUserInputs()}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AnaliseProdutiva;
