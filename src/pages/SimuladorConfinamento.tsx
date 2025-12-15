import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Warehouse, Sparkles, Loader2, FileText, Crown, Info, TrendingUp, DollarSign, Leaf } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { UpgradeModal } from "@/components/UpgradeModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cleanTextForDisplay } from "@/lib/textUtils";
import { MarkdownTableRenderer } from "@/components/MarkdownTableRenderer";
import { ResponseActionButtons } from "@/components/ResponseActionButtons";

const categoriasAnimal = [
  "Boi gordo (Nelore)",
  "Boi gordo (Angus)",
  "Boi gordo (Cruzamento industrial)",
  "Bovinos machos – Nelore, 24 meses",
  "Novilha",
  "Vaca de descarte",
  "Garrote"
];

const estadosBrasil = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", 
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", 
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const niveisSustentabilidade = [
  { value: "convencional", label: "Convencional", description: "Sistema tradicional sem práticas especiais" },
  { value: "melhorado", label: "Melhorado", description: "Com aditivos e manejo otimizado" },
  { value: "baixo_carbono", label: "Baixo Carbono", description: "Com ILPF e aditivos redutores de metano" },
  { value: "carbono_neutro", label: "Carbono Neutro", description: "Compensação total de emissões" }
];

const exemploSimulacoes = [
  {
    titulo: "Teste Produtor Roraima — 420 bois engorda",
    nomeProdutor: "João Batista da Silva",
    estado: "RR",
    municipio: "Cantá",
    finalidade: "Engorda intensiva em confinamento",
    numeroAnimais: "420",
    categoria: "Bovinos machos – Nelore, 24 meses",
    pesoInicial: "380",
    pesoFinal: "520",
    diasConfinamento: "85",
    gmdEsperado: "1.65",
    mortalidade: "0.25",
    nivelSustentabilidade: "convencional",
    precoBoiMagro: "260",
    custoKgMS: "2.05",
    consumoMSPercentual: "2.4",
    custoMaoObraDia: "0.42",
    custoSanidade: "18",
    custoImplantacao: "12",
    custoDespesasGeraisDia: "0.38",
    precoArrobaVenda: "255",
    bonificacaoCarcaca: "3",
    rendimentoCarcaca: "53",
    conversaoAlimentar: "7.0"
  },
  {
    titulo: "Simulação boi China 120 dias — custo/arroba + emissões",
    nomeProdutor: "",
    estado: "MT",
    municipio: "",
    finalidade: "Engorda para exportação China",
    numeroAnimais: "500",
    categoria: "Boi gordo (Nelore)",
    pesoInicial: "380",
    pesoFinal: "540",
    diasConfinamento: "120",
    gmdEsperado: "1.33",
    mortalidade: "1.5",
    nivelSustentabilidade: "convencional",
    precoBoiMagro: "265",
    custoKgMS: "2.10",
    consumoMSPercentual: "2.5",
    custoMaoObraDia: "0.45",
    custoSanidade: "20",
    custoImplantacao: "15",
    custoDespesasGeraisDia: "0.40",
    precoArrobaVenda: "260",
    bonificacaoCarcaca: "5",
    rendimentoCarcaca: "52",
    conversaoAlimentar: "7.5"
  },
  {
    titulo: "Convencional vs aditivo redutor de metano",
    nomeProdutor: "",
    estado: "GO",
    municipio: "",
    finalidade: "Engorda com baixo carbono",
    numeroAnimais: "300",
    categoria: "Boi gordo (Cruzamento industrial)",
    pesoInicial: "400",
    pesoFinal: "560",
    diasConfinamento: "100",
    gmdEsperado: "1.60",
    mortalidade: "1.0",
    nivelSustentabilidade: "melhorado",
    precoBoiMagro: "270",
    custoKgMS: "2.15",
    consumoMSPercentual: "2.4",
    custoMaoObraDia: "0.50",
    custoSanidade: "22",
    custoImplantacao: "18",
    custoDespesasGeraisDia: "0.42",
    precoArrobaVenda: "265",
    bonificacaoCarcaca: "8",
    rendimentoCarcaca: "54",
    conversaoAlimentar: "6.8"
  }
];

const SimuladorConfinamento = () => {
  const { plan, useCredit, user, hasUnlimited, isLoading: subscriptionLoading } = useSubscription();
  
  // Dados do produtor
  const [nomeProdutor, setNomeProdutor] = useState("");
  const [estado, setEstado] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [finalidade, setFinalidade] = useState("");
  
  // Dados zootécnicos
  const [numeroAnimais, setNumeroAnimais] = useState("");
  const [categoria, setCategoria] = useState("");
  const [pesoInicial, setPesoInicial] = useState("");
  const [pesoFinal, setPesoFinal] = useState("");
  const [diasConfinamento, setDiasConfinamento] = useState("");
  const [gmdEsperado, setGmdEsperado] = useState("");
  const [mortalidade, setMortalidade] = useState("1.5");
  const [nivelSustentabilidade, setNivelSustentabilidade] = useState("");
  const [conversaoAlimentar, setConversaoAlimentar] = useState("");
  const [rendimentoCarcaca, setRendimentoCarcaca] = useState("53");
  
  // Custos
  const [precoBoiMagro, setPrecoBoiMagro] = useState("");
  const [custoKgMS, setCustoKgMS] = useState("");
  const [consumoMSPercentual, setConsumoMSPercentual] = useState("2.4");
  const [custoMaoObraDia, setCustoMaoObraDia] = useState("");
  const [custoSanidade, setCustoSanidade] = useState("");
  const [custoImplantacao, setCustoImplantacao] = useState("");
  const [custoDespesasGeraisDia, setCustoDespesasGeraisDia] = useState("");
  const [precoArrobaVenda, setPrecoArrobaVenda] = useState("");
  const [bonificacaoCarcaca, setBonificacaoCarcaca] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [resposta, setResposta] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const carregarExemplo = (exemplo: typeof exemploSimulacoes[0]) => {
    setNomeProdutor(exemplo.nomeProdutor);
    setEstado(exemplo.estado);
    setMunicipio(exemplo.municipio);
    setFinalidade(exemplo.finalidade);
    setNumeroAnimais(exemplo.numeroAnimais);
    setCategoria(exemplo.categoria);
    setPesoInicial(exemplo.pesoInicial);
    setPesoFinal(exemplo.pesoFinal);
    setDiasConfinamento(exemplo.diasConfinamento);
    setGmdEsperado(exemplo.gmdEsperado);
    setMortalidade(exemplo.mortalidade);
    setNivelSustentabilidade(exemplo.nivelSustentabilidade);
    setPrecoBoiMagro(exemplo.precoBoiMagro);
    setCustoKgMS(exemplo.custoKgMS);
    setConsumoMSPercentual(exemplo.consumoMSPercentual);
    setCustoMaoObraDia(exemplo.custoMaoObraDia);
    setCustoSanidade(exemplo.custoSanidade);
    setCustoImplantacao(exemplo.custoImplantacao);
    setCustoDespesasGeraisDia(exemplo.custoDespesasGeraisDia);
    setPrecoArrobaVenda(exemplo.precoArrobaVenda);
    setBonificacaoCarcaca(exemplo.bonificacaoCarcaca);
    setRendimentoCarcaca(exemplo.rendimentoCarcaca);
    setConversaoAlimentar(exemplo.conversaoAlimentar);
    toast.success("Exemplo carregado! Clique em Simular para executar.");
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;

    if (!user) {
      toast.error("Faça login para usar esta ferramenta");
      return;
    }

    if (!categoria || !pesoInicial || !pesoFinal || !diasConfinamento || !gmdEsperado || !nivelSustentabilidade) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Check credits for free plan
    if (!hasUnlimited) {
      const canUse = await useCredit();
      if (!canUse) {
        setShowUpgradeModal(true);
        return;
      }
    }

    setIsLoading(true);
    setResposta("");
    toast.info("Processando simulação completa...");

    try {
      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          tool: "simulador-confinamento",
          plan,
          data: {
            nomeProdutor,
            estado,
            municipio,
            finalidade,
            numeroAnimais: parseInt(numeroAnimais) || 1,
            categoria,
            pesoInicial: parseFloat(pesoInicial),
            pesoFinal: parseFloat(pesoFinal),
            diasConfinamento: parseInt(diasConfinamento),
            gmdEsperado: parseFloat(gmdEsperado),
            mortalidade: parseFloat(mortalidade),
            nivelSustentabilidade,
            conversaoAlimentar: parseFloat(conversaoAlimentar) || 7.0,
            rendimentoCarcaca: parseFloat(rendimentoCarcaca) || 53,
            precoBoiMagro: parseFloat(precoBoiMagro) || 260,
            custoKgMS: parseFloat(custoKgMS) || 2.05,
            consumoMSPercentual: parseFloat(consumoMSPercentual) || 2.4,
            custoMaoObraDia: parseFloat(custoMaoObraDia) || 0.42,
            custoSanidade: parseFloat(custoSanidade) || 18,
            custoImplantacao: parseFloat(custoImplantacao) || 12,
            custoDespesasGeraisDia: parseFloat(custoDespesasGeraisDia) || 0.38,
            precoArrobaVenda: parseFloat(precoArrobaVenda) || 255,
            bonificacaoCarcaca: parseFloat(bonificacaoCarcaca) || 3
          }
        }
      });

      if (error) throw error;
      
      const cleanedResponse = cleanTextForDisplay(data.response);
      setResposta(cleanedResponse);
      toast.success("Simulação concluída!");
    } catch (error) {
      console.error("Erro na simulação:", error);
      toast.error("Erro ao processar simulação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Institucional */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
              <Warehouse className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Simulador de Confinamento Sustentável</h1>
              <p className="text-muted-foreground">Ferramenta de inteligência para decisão estratégica em confinamento</p>
            </div>
          </div>

          {/* Bloco Conceitual */}
          <Card className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800 mb-6">
            <CardContent className="py-5">
              <p className="text-sm text-emerald-800 dark:text-emerald-200 mb-4">
                <strong>Planeje o confinamento com base em dados e resultados.</strong> Esta ferramenta combina análise econômica, 
                zootécnica e ambiental para projetar rentabilidade, custos por arroba, emissões de metano e viabilidade operacional.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span>Análise econômica</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span>Projeção zootécnica</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Leaf className="h-4 w-4 text-emerald-600" />
                  <span>Impacto ambiental</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span>Cenários de sensibilidade</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Formulário - 2 colunas */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Simulação</CardTitle>
                <CardDescription>Preencha os parâmetros do confinamento</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Tabs defaultValue="produtor" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="produtor" className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        Produtor
                      </TabsTrigger>
                      <TabsTrigger value="zootecnico" className="flex items-center gap-1">
                        <Warehouse className="h-4 w-4" />
                        Zootécnico
                      </TabsTrigger>
                      <TabsTrigger value="custos" className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        Custos
                      </TabsTrigger>
                    </TabsList>

                    {/* Aba Produtor */}
                    <TabsContent value="produtor" className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nome do Produtor</Label>
                          <Input
                            value={nomeProdutor}
                            onChange={(e) => setNomeProdutor(e.target.value)}
                            placeholder="Ex: João da Silva"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Finalidade</Label>
                          <Input
                            value={finalidade}
                            onChange={(e) => setFinalidade(e.target.value)}
                            placeholder="Ex: Engorda intensiva"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Estado</Label>
                          <Select value={estado} onValueChange={setEstado}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {estadosBrasil.map((uf) => (
                                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Município</Label>
                          <Input
                            value={municipio}
                            onChange={(e) => setMunicipio(e.target.value)}
                            placeholder="Ex: Cantá"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* Aba Zootécnico */}
                    <TabsContent value="zootecnico" className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Número de Animais *</Label>
                          <Input
                            type="number"
                            value={numeroAnimais}
                            onChange={(e) => setNumeroAnimais(e.target.value)}
                            placeholder="Ex: 420"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Categoria Animal *</Label>
                          <Select value={categoria} onValueChange={setCategoria}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {categoriasAnimal.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Peso Inicial (kg) *</Label>
                          <Input
                            type="number"
                            value={pesoInicial}
                            onChange={(e) => setPesoInicial(e.target.value)}
                            placeholder="Ex: 380"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Peso Final (kg) *</Label>
                          <Input
                            type="number"
                            value={pesoFinal}
                            onChange={(e) => setPesoFinal(e.target.value)}
                            placeholder="Ex: 520"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Dias de Confinamento *</Label>
                          <Input
                            type="number"
                            value={diasConfinamento}
                            onChange={(e) => setDiasConfinamento(e.target.value)}
                            placeholder="Ex: 85"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>GMD Esperado (kg/dia) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={gmdEsperado}
                            onChange={(e) => setGmdEsperado(e.target.value)}
                            placeholder="Ex: 1.65"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Conversão Alimentar</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={conversaoAlimentar}
                            onChange={(e) => setConversaoAlimentar(e.target.value)}
                            placeholder="Ex: 7.0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Rendimento Carcaça (%)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={rendimentoCarcaca}
                            onChange={(e) => setRendimentoCarcaca(e.target.value)}
                            placeholder="Ex: 53"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Mortalidade Esperada (%)</Label>
                          <div className="flex items-center gap-3">
                            <Slider
                              value={[parseFloat(mortalidade) || 0]}
                              onValueChange={(value) => setMortalidade(value[0].toString())}
                              min={0}
                              max={5}
                              step={0.1}
                              className="flex-1"
                            />
                            <span className="text-sm font-medium w-12">{mortalidade}%</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Nível de Sustentabilidade *</Label>
                          <Select value={nivelSustentabilidade} onValueChange={setNivelSustentabilidade}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {niveisSustentabilidade.map((n) => (
                                <SelectItem key={n.value} value={n.value}>
                                  <div className="flex items-center gap-2">
                                    <Leaf className="h-4 w-4 text-emerald-600" />
                                    <span>{n.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Aba Custos */}
                    <TabsContent value="custos" className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Preço Boi Magro (R$/@)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={precoBoiMagro}
                            onChange={(e) => setPrecoBoiMagro(e.target.value)}
                            placeholder="Ex: 260.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Preço Arroba Venda (R$/@)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={precoArrobaVenda}
                            onChange={(e) => setPrecoArrobaVenda(e.target.value)}
                            placeholder="Ex: 255.00"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Custo kg MS (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={custoKgMS}
                            onChange={(e) => setCustoKgMS(e.target.value)}
                            placeholder="Ex: 2.05"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Consumo MS (%PV/dia)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={consumoMSPercentual}
                            onChange={(e) => setConsumoMSPercentual(e.target.value)}
                            placeholder="Ex: 2.4"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Mão de Obra (R$/cab/dia)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={custoMaoObraDia}
                            onChange={(e) => setCustoMaoObraDia(e.target.value)}
                            placeholder="Ex: 0.42"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Despesas Gerais (R$/cab/dia)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={custoDespesasGeraisDia}
                            onChange={(e) => setCustoDespesasGeraisDia(e.target.value)}
                            placeholder="Ex: 0.38"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Sanidade (R$/cab/período)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={custoSanidade}
                            onChange={(e) => setCustoSanidade(e.target.value)}
                            placeholder="Ex: 18.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Implantação (R$/cab)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={custoImplantacao}
                            onChange={(e) => setCustoImplantacao(e.target.value)}
                            placeholder="Ex: 12.00"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Bonificação Carcaça (R$/@)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={bonificacaoCarcaca}
                          onChange={(e) => setBonificacaoCarcaca(e.target.value)}
                          placeholder="Ex: 3.00"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading || subscriptionLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Simulando...
                      </>
                    ) : (
                      <>
                        <Warehouse className="mr-2 h-4 w-4" />
                        Simular Confinamento
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Exemplos - 1 coluna */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Exemplos de Simulação</CardTitle>
                <CardDescription>Clique para preencher automaticamente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {exemploSimulacoes.map((exemplo, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => carregarExemplo(exemplo)}
                  >
                    <Warehouse className="h-4 w-4 mr-2 shrink-0 text-emerald-600" />
                    <span className="text-sm">{exemplo.titulo}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-emerald-700 dark:text-emerald-400 mb-1">Dica</p>
                    <p>Clique no primeiro exemplo para executar o teste completo do produtor fictício de Roraima.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Resposta - Relatório Executivo */}
        {resposta && (
          <Card className="mt-6 border-2 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                Relatório Executivo — Simulação de Confinamento
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Análise integrada: econômica, zootécnica e ambiental
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <MarkdownTableRenderer 
                content={resposta}
                className="prose prose-sm max-w-none dark:prose-invert mb-6 text-sm leading-relaxed"
              />
              
              {/* Mensagem Final */}
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">
                  📊 Planeje o confinamento com base em dados e resultados.
                </p>
              </div>
              
              <ResponseActionButtons
                content={resposta}
                title="Simulação de Confinamento Sustentável"
                toolName="Simulador de Confinamento"
                className="pt-4 border-t"
              />
              
              {plan === "free" && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <Crown className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Análises completas com cenários de sensibilidade disponíveis nos planos Pro/Enterprise
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
      </div>
    </TooltipProvider>
  );
};

export default SimuladorConfinamento;
