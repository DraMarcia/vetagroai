import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TrendingUp, Loader2, ChevronDown, Target, DollarSign, AlertTriangle, Lightbulb, BarChart3, FileText, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { resilientInvoke, extractAnswer } from "@/lib/resilientInvoke";
import { supabase } from "@/integrations/supabase/client";
import { AuthDialog } from "@/components/AuthDialog";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { ResponseActionButtons } from "@/components/ResponseActionButtons";
import DOMPurify from "dompurify";
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

const TIPOS_USUARIO = [
  { value: "produtor", label: "Produtor Rural" },
  { value: "tecnico", label: "Técnico Agropecuário" },
  { value: "veterinario", label: "Médico(a) Veterinário(a)" },
  { value: "zootecnista", label: "Zootecnista" },
  { value: "estudante", label: "Estudante" },
  { value: "publico", label: "Público Geral" },
];

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const REFERENCIAS_ZOOTECNICAS = [
  "EMBRAPA - Empresa Brasileira de Pesquisa Agropecuária",
  "NRC - National Research Council (Beef Cattle)",
  "CEPEA - Centro de Estudos Avançados em Economia Aplicada",
  "IPCC - Intergovernmental Panel on Climate Change",
  "ABIEC - Associação Brasileira das Indústrias Exportadoras de Carnes",
  "FAO - Food and Agriculture Organization",
];

const AnaliseProdutiva = () => {
  const { toast } = useToast();
  const { plan } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [result, setResult] = useState("");
  const [showOptional, setShowOptional] = useState(false);

  // Tipo de usuário e validação profissional
  const [tipoUsuario, setTipoUsuario] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [numeroConselho, setNumeroConselho] = useState("");
  const [ufConselho, setUfConselho] = useState("");

  // Campos estruturados
  const [tipoSistema, setTipoSistema] = useState("");
  const [numeroAnimais, setNumeroAnimais] = useState("");
  const [pesoInicial, setPesoInicial] = useState("");
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

  const requiresProfessionalValidation = tipoUsuario === "veterinario" || tipoUsuario === "zootecnista";

  const preencherExemplo = (tipo: string) => {
    if (tipo === "teste-ficticio") {
      // Modo de teste com produtor fictício - Roraima
      setTipoUsuario("produtor");
      setNomeUsuario("João Almeida");
      setTipoSistema("engorda");
      setNumeroAnimais("300");
      setPesoInicial("350");
      setGmd("0.8");
      setConversaoAlimentar("8");
      setCustoPorKg("12");
      setTaxaLotacao("2");
      setAreaTotal("150");
      setPrecoVenda("280");
      setMortalidade("0.8");
      setObservacoesAdicionais("Simular produtor fictício - Cantá/RR - Sistema de engorda a pasto com suplementação");
    } else if (tipo === "engorda") {
      setTipoSistema("engorda");
      setNumeroAnimais("300");
      setPesoInicial("350");
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
      setPesoInicial("380");
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
      setPesoInicial("300");
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
    // Validação básica
    if (!tipoSistema || !numeroAnimais) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha pelo menos o tipo de sistema e número de animais.",
        variant: "destructive",
      });
      return;
    }

    // Validação de tipo de usuário
    if (!tipoUsuario) {
      toast({
        title: "Identifique-se",
        description: "Por favor, selecione seu perfil de usuário.",
        variant: "destructive",
      });
      return;
    }

    // Validação profissional obrigatória
    if (requiresProfessionalValidation) {
      if (!numeroConselho || !ufConselho) {
        toast({
          title: "Registro profissional obrigatório",
          description: tipoUsuario === "veterinario" 
            ? "Informe seu número de CRMV e estado de registro."
            : "Informe seu número de CRZ e estado de registro.",
          variant: "destructive",
        });
        return;
      }
    }

    if (loading) return;
    setLoading(true);
    
    try {
      const res = await resilientInvoke("nutrition-handler", {
        tool: "analise-produtiva",
        plan: plan || "free",
        tipoUsuario,
        nomeUsuario: nomeUsuario || undefined,
        numeroConselho: requiresProfessionalValidation ? numeroConselho : undefined,
        ufConselho: requiresProfessionalValidation ? ufConselho : undefined,
        data: {
          tipoSistema,
          numeroAnimais: Number(numeroAnimais),
          pesoInicial: pesoInicial ? Number(pesoInicial) : null,
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
      });

      if (!res.ok) {
        toast({
          title: "Atenção",
          description: res.friendlyError || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      // Keep original HTML for display - cleaning only happens during PDF export
      setResult(extractAnswer(res.data));
      toast({
        title: "Análise concluída!",
        description: "Planejamento produtivo gerado com sucesso.",
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

  const getUserInputs = () => ({
    "Tipo de Usuário": TIPOS_USUARIO.find(t => t.value === tipoUsuario)?.label || tipoUsuario,
    ...(nomeUsuario && { "Nome": nomeUsuario }),
    ...(requiresProfessionalValidation && numeroConselho && { 
      "Registro Profissional": `${tipoUsuario === "veterinario" ? "CRMV" : "CRZ"} ${numeroConselho}-${ufConselho}` 
    }),
    "Tipo de Sistema": SISTEMAS_PRODUCAO.find(s => s.value === tipoSistema)?.label || tipoSistema,
    "Número de Animais": numeroAnimais,
    "Peso Inicial (kg)": pesoInicial || "Não informado",
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
      {/* Header Institucional */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <BarChart3 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Painel de Inteligência Produtiva
            </h1>
            <p className="text-muted-foreground">
              Ferramenta de inteligência para eficiência global e benchmarking produtivo
            </p>
          </div>
        </div>

        {/* Bloco Conceitual */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
          <CardContent className="py-5">
            <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
              <strong>Monitore, compare e evolua sua produção com inteligência.</strong> Esta ferramenta integra diagnóstico zootécnico, 
              análise econômica, identificação de riscos e cenários de otimização para tomada de decisão estratégica.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-amber-600" />
                <span>Diagnóstico</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span>Riscos</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span>Econômico</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Lightbulb className="h-4 w-4 text-yellow-600" />
                <span>Cenários</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span>Emissões</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-purple-600" />
                <span>Plano de Ação</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Botões de Exemplo */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => preencherExemplo("teste-ficticio")} className="border-amber-500 text-amber-700 hover:bg-amber-50">
            🧪 Teste: Produtor Fictício (RR)
          </Button>
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

        {/* Card: Identificação do Usuário */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Identificação do Usuário
            </CardTitle>
            <CardDescription>Informe seu perfil para personalizar a análise</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tipoUsuario">Tipo de Usuário *</Label>
              <Select value={tipoUsuario} onValueChange={setTipoUsuario}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione seu perfil" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {TIPOS_USUARIO.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomeUsuario">Nome (opcional)</Label>
              <Input
                id="nomeUsuario"
                placeholder="Seu nome completo"
                value={nomeUsuario}
                onChange={(e) => setNomeUsuario(e.target.value)}
              />
            </div>

            {/* Campos profissionais obrigatórios */}
            {requiresProfessionalValidation && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="numeroConselho">
                    {tipoUsuario === "veterinario" ? "Número do CRMV *" : "Número do CRZ *"}
                  </Label>
                  <Input
                    id="numeroConselho"
                    placeholder={tipoUsuario === "veterinario" ? "Ex: 12345" : "Ex: 54321"}
                    value={numeroConselho}
                    onChange={(e) => setNumeroConselho(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ufConselho">Estado de Registro *</Label>
                  <Select value={ufConselho} onValueChange={setUfConselho}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {UFS.map((uf) => (
                        <SelectItem key={uf} value={uf}>
                          {uf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

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
              <Label htmlFor="pesoInicial">Peso Inicial (kg)</Label>
              <Input
                id="pesoInicial"
                type="number"
                placeholder="Ex: 350"
                value={pesoInicial}
                onChange={(e) => setPesoInicial(e.target.value)}
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
              Processando Análise Completa...
            </>
          ) : (
            <>
              <BarChart3 className="mr-2 h-5 w-5" />
              Gerar Planejamento Produtivo & Econômico
            </>
          )}
        </Button>

        {/* Resultado - Relatório Executivo */}
        {result && (
          <div className="space-y-4">
            <Card className="border-2 border-amber-200 dark:border-amber-800">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-amber-500" />
                  Relatório Executivo — Inteligência Produtiva
                </CardTitle>
                <CardDescription>
                  Diagnóstico técnico integrado com análise econômica, cenários e plano de ação
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div 
                    className="bg-muted/50 p-4 rounded-lg text-sm leading-relaxed [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-amber-700 [&_h2]:dark:text-amber-400 [&_table]:my-4 [&_th]:bg-gray-200 [&_th]:dark:bg-gray-700 [&_td]:align-top [&_strong]:font-semibold"
                    style={{ textAlign: 'justify', textJustify: 'inter-word' }}
                    dangerouslySetInnerHTML={{ 
                      __html: DOMPurify.sanitize(result, {
                        ALLOWED_TAGS: ['h2', 'h3', 'h4', 'div', 'p', 'strong', 'em', 'br', 'table', 'tr', 'th', 'td', 'thead', 'tbody', 'ul', 'ol', 'li', 'span', 'b', 'i'],
                        ALLOWED_ATTR: ['style', 'class'],
                        ALLOW_DATA_ATTR: false
                      })
                    }}
                  />
                </div>
                
                {/* Mensagem Final */}
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-6 mb-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                    📈 Monitore, compare e evolua sua produção com inteligência.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Botões Padrão Global: Copiar + Compartilhar */}
            <ResponseActionButtons
              content={result}
              title="Relatório de Inteligência Produtiva"
              toolName="Painel de Inteligência Produtiva"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AnaliseProdutiva;
