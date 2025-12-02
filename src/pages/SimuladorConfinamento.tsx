import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Warehouse, Sparkles, Loader2, FileText, Crown, Info } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { UpgradeModal } from "@/components/UpgradeModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";

const categoriasAnimal = [
  "Boi gordo (Nelore)",
  "Boi gordo (Angus)",
  "Boi gordo (Cruzamento industrial)",
  "Novilha",
  "Vaca de descarte",
  "Garrote"
];

const niveisSustentabilidade = [
  { value: "convencional", label: "Convencional", description: "Sistema tradicional sem práticas especiais" },
  { value: "melhorado", label: "Melhorado", description: "Com aditivos e manejo otimizado" },
  { value: "baixo_carbono", label: "Baixo Carbono", description: "Com ILPF e aditivos redutores de metano" },
  { value: "carbono_neutro", label: "Carbono Neutro", description: "Compensação total de emissões" }
];

const exemploSimulacoes = [
  {
    titulo: "Simulação boi China 120 dias — custo/arroba + emissões",
    categoria: "Boi gordo (Nelore)",
    pesoInicial: "380",
    pesoFinal: "540",
    diasConfinamento: "120",
    gmdEsperado: "1.33",
    custoDiario: "18.50",
    mortalidade: "1.5",
    nivelSustentabilidade: "convencional"
  },
  {
    titulo: "Convencional vs aditivo redutor de metano",
    categoria: "Boi gordo (Cruzamento industrial)",
    pesoInicial: "400",
    pesoFinal: "560",
    diasConfinamento: "100",
    gmdEsperado: "1.60",
    custoDiario: "20.00",
    mortalidade: "1.0",
    nivelSustentabilidade: "melhorado"
  },
  {
    titulo: "Quanto reduzo emissões com ILPF?",
    categoria: "Boi gordo (Angus)",
    pesoInicial: "420",
    pesoFinal: "580",
    diasConfinamento: "90",
    gmdEsperado: "1.78",
    custoDiario: "22.00",
    mortalidade: "0.8",
    nivelSustentabilidade: "baixo_carbono"
  }
];

const SimuladorConfinamento = () => {
  const { plan, useCredit, user, hasUnlimited, isLoading: subscriptionLoading } = useSubscription();
  const [categoria, setCategoria] = useState("");
  const [pesoInicial, setPesoInicial] = useState("");
  const [pesoFinal, setPesoFinal] = useState("");
  const [diasConfinamento, setDiasConfinamento] = useState("");
  const [gmdEsperado, setGmdEsperado] = useState("");
  const [custoDiario, setCustoDiario] = useState("");
  const [mortalidade, setMortalidade] = useState("1.5");
  const [nivelSustentabilidade, setNivelSustentabilidade] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resposta, setResposta] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const carregarExemplo = (exemplo: typeof exemploSimulacoes[0]) => {
    setCategoria(exemplo.categoria);
    setPesoInicial(exemplo.pesoInicial);
    setPesoFinal(exemplo.pesoFinal);
    setDiasConfinamento(exemplo.diasConfinamento);
    setGmdEsperado(exemplo.gmdEsperado);
    setCustoDiario(exemplo.custoDiario);
    setMortalidade(exemplo.mortalidade);
    setNivelSustentabilidade(exemplo.nivelSustentabilidade);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Faça login para usar esta ferramenta");
      return;
    }

    if (!categoria || !pesoInicial || !pesoFinal || !diasConfinamento || !gmdEsperado || !custoDiario || !nivelSustentabilidade) {
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

    try {
      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          tool: "simulador-confinamento",
          plan,
          data: {
            categoria,
            pesoInicial: parseFloat(pesoInicial),
            pesoFinal: parseFloat(pesoFinal),
            diasConfinamento: parseInt(diasConfinamento),
            gmdEsperado: parseFloat(gmdEsperado),
            custoDiario: parseFloat(custoDiario),
            mortalidade: parseFloat(mortalidade),
            nivelSustentabilidade
          }
        }
      });

      if (error) throw error;
      setResposta(data.response);
    } catch (error) {
      console.error("Erro na simulação:", error);
      toast.error("Erro ao processar simulação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Warehouse className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Simulador de Confinamento Sustentável</h1>
              <p className="text-muted-foreground">Projeção de GMD, emissões, custo/arroba e eficiência</p>
            </div>
          </div>

          {/* Texto comercial */}
          <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20 mb-6">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-indigo-600 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  <strong>Você está usando inteligência aplicada à sustentabilidade.</strong> Cada análise 
                  combina dados técnicos com recomendações práticas para operações mais eficientes, 
                  lucrativas e responsáveis ambientalmente.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Formulário */}
          <Card>
            <CardHeader>
              <CardTitle>Dados da Simulação</CardTitle>
              <CardDescription>Preencha os parâmetros do confinamento</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="categoria">Categoria Animal *</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Selecione a categoria do animal a ser confinado</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasAnimal.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="pesoInicial">Peso Inicial (kg) *</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Peso médio de entrada no confinamento</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="pesoInicial"
                      type="number"
                      value={pesoInicial}
                      onChange={(e) => setPesoInicial(e.target.value)}
                      placeholder="Ex: 380"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="pesoFinal">Peso Final (kg) *</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Peso desejado de saída do confinamento</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="pesoFinal"
                      type="number"
                      value={pesoFinal}
                      onChange={(e) => setPesoFinal(e.target.value)}
                      placeholder="Ex: 540"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="diasConfinamento">Dias de Confinamento *</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Período previsto de confinamento</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="diasConfinamento"
                      type="number"
                      value={diasConfinamento}
                      onChange={(e) => setDiasConfinamento(e.target.value)}
                      placeholder="Ex: 120"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="gmdEsperado">GMD Esperado (kg/dia) *</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ganho médio diário esperado</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="gmdEsperado"
                      type="number"
                      step="0.01"
                      value={gmdEsperado}
                      onChange={(e) => setGmdEsperado(e.target.value)}
                      placeholder="Ex: 1.33"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="custoDiario">Custo Diário (R$/cab) *</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Custo diário por cabeça (alimentação + manejo)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      id="custoDiario"
                      type="number"
                      step="0.01"
                      value={custoDiario}
                      onChange={(e) => setCustoDiario(e.target.value)}
                      placeholder="Ex: 18.50"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>Mortalidade Esperada (%)</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Taxa de mortalidade esperada no período</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
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
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Nível de Sustentabilidade *</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Selecione o nível de práticas sustentáveis do confinamento</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={nivelSustentabilidade} onValueChange={setNivelSustentabilidade}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nível" />
                    </SelectTrigger>
                    <SelectContent>
                      {niveisSustentabilidade.map((n) => (
                        <SelectItem key={n.value} value={n.value}>
                          <div>
                            <div className="font-medium">{n.label}</div>
                            <div className="text-xs text-muted-foreground">{n.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || subscriptionLoading}>
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

          {/* Exemplos e Resposta */}
          <div className="space-y-6">
            {/* Exemplos */}
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
                    <Warehouse className="h-4 w-4 mr-2 shrink-0 text-indigo-600" />
                    <span className="text-sm">{exemplo.titulo}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Resposta */}
            {resposta && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    Resultado da Simulação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap text-sm">{resposta}</div>
                  </div>
                  
                  {plan === "free" && (
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <Crown className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Para relatórios completos e recomendações avançadas, faça upgrade para Pro ou Enterprise.
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
      </div>
    </TooltipProvider>
  );
};

export default SimuladorConfinamento;
