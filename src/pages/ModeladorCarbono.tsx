import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Leaf, HelpCircle, TreePine, Factory, Coins, FileText, ChevronRight, ChevronLeft, Info, Crown, TrendingDown, TrendingUp, Target } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from "recharts";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";
import { UpgradeModal } from "@/components/UpgradeModal";
import { ResponseActionButtons } from "@/components/ResponseActionButtons";

type UserMode = "produtor" | "tecnico";
type Step = "welcome" | "education" | "form" | "diagnosis" | "simulation" | "credits" | "results";

interface FormData {
  tipoProducao: string;
  numeroAnimais: number;
  areaPasto: number;
  produtividade: number;
  tipoManejo: string;
  tecnologias: string[];
  areaArvores: number;
  areaAPP: number;
}

interface SimulationResults {
  emissoes: number;
  sequestro: number;
  balanco: number;
  reducaoPotencial: number;
  receitaPotencial: number;
}

const educationalContent = [
  {
    title: "O que são emissões?",
    icon: Factory,
    content: "Emissões são gases liberados para a atmosfera que contribuem para o aquecimento global. Na pecuária, a principal fonte é o metano (CH₄) produzido pela digestão dos animais. É como se cada boi fosse um pequeno 'escapamento' liberando gases o dia todo.",
    analogy: "Pense assim: se você deixa o carro ligado parado, ele continua soltando fumaça. O gado faz algo parecido naturalmente ao digerir o capim."
  },
  {
    title: "O que é sequestro de carbono?",
    icon: TreePine,
    content: "Sequestro é quando plantas e solo 'capturam' o CO₂ do ar e guardam nas raízes, troncos e no próprio solo. Árvores são campeãs nisso, mas pastagens bem manejadas também ajudam.",
    analogy: "É como uma esponja que absorve água. As árvores e o solo absorvem carbono do ar e guardam por muitos anos."
  },
  {
    title: "O que é crédito de carbono?",
    icon: Coins,
    content: "É um 'certificado' que prova que você evitou ou removeu 1 tonelada de CO₂ do ambiente. Empresas que poluem compram esses créditos para compensar suas emissões.",
    analogy: "Funciona como vender o 'ar limpo' que sua fazenda produz. Cada tonelada de carbono que você evita emitir ou captura pode virar dinheiro."
  },
  {
    title: "Como ganhar dinheiro com isso?",
    icon: TrendingUp,
    content: "Ao adotar práticas sustentáveis (plantar árvores, usar aditivos que reduzem metano, fazer ILPF), você reduz emissões e pode gerar créditos para vender no mercado de carbono.",
    analogy: "É como transformar boas práticas em uma nova fonte de renda. Quanto mais sustentável, mais você pode ganhar."
  }
];

const tiposProducao = [
  { value: "pecuaria_corte", label: "Pecuária de Corte" },
  { value: "pecuaria_leite", label: "Pecuária de Leite" },
  { value: "lavoura", label: "Lavoura" },
  { value: "agrofloresta", label: "Agrofloresta" },
  { value: "misto", label: "Sistema Misto" }
];

const tiposManejo = [
  { value: "extensivo", label: "Extensivo tradicional" },
  { value: "semi_intensivo", label: "Semi-intensivo" },
  { value: "intensivo", label: "Intensivo" },
  { value: "rotacionado", label: "Pastejo rotacionado" }
];

const tecnologiasDisponiveis = [
  { id: "ilpf", label: "ILPF (Integração Lavoura-Pecuária-Floresta)", reducao: 25 },
  { id: "confinamento", label: "Confinamento estratégico", reducao: 15 },
  { id: "biodigestor", label: "Biodigestor", reducao: 20 },
  { id: "reserva_legal", label: "Reserva legal preservada", reducao: 10 },
  { id: "aditivo", label: "Aditivo redutor de metano", reducao: 30 },
  { id: "rotacionado", label: "Pastejo rotacionado intensivo", reducao: 12 }
];

const praticasMitigadoras = [
  { id: "recuperacao_pasto", label: "Recuperação de pastagem degradada", reducao: 20, custo: "médio" },
  { id: "suplementacao", label: "Suplementação com aditivos", reducao: 30, custo: "alto" },
  { id: "confinamento_estrategico", label: "Confinamento estratégico", reducao: 15, custo: "alto" },
  { id: "ilpf_implantacao", label: "Implantação de ILPF", reducao: 25, custo: "alto" },
  { id: "biodigestor_implantacao", label: "Instalação de biodigestor", reducao: 20, custo: "muito alto" },
  { id: "plantio_arvores", label: "Plantio de árvores nativas", reducao: 35, custo: "médio" }
];

// IPCC default emission factors (simplified)
const EMISSION_FACTORS = {
  pecuaria_corte: 56, // kg CH4/cabeça/ano
  pecuaria_leite: 68,
  lavoura: 2.5, // tCO2e/ha/ano
  agrofloresta: -5, // sequestro líquido
  misto: 35
};

const SEQUESTRATION_FACTORS = {
  arvores: 15, // tCO2e/ha/ano
  pasto_bem_manejado: 2,
  app: 20
};

const CARBON_CREDIT_VALUES = {
  conservador: 5, // USD/tCO2e
  realista: 10,
  otimista: 15
};

const ModeladorCarbono = () => {
  const { plan, user, useCredit } = useSubscription();
  const [mode, setMode] = useState<UserMode | null>(null);
  const [step, setStep] = useState<Step>("welcome");
  const [educationIndex, setEducationIndex] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    tipoProducao: "",
    numeroAnimais: 0,
    areaPasto: 0,
    produtividade: 0,
    tipoManejo: "",
    tecnologias: [],
    areaArvores: 0,
    areaAPP: 0
  });
  
  const [selectedPraticas, setSelectedPraticas] = useState<string[]>([]);
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [customCreditValue, setCustomCreditValue] = useState(10);

  const isPremium = plan === "pro" || plan === "enterprise";

  const calculateEmissions = (): SimulationResults => {
    const { tipoProducao, numeroAnimais, areaPasto, areaArvores, areaAPP, tecnologias } = formData;
    
    // Base emissions calculation
    let baseEmissions = 0;
    if (tipoProducao === "pecuaria_corte" || tipoProducao === "pecuaria_leite") {
      const factor = EMISSION_FACTORS[tipoProducao as keyof typeof EMISSION_FACTORS];
      baseEmissions = (numeroAnimais * factor * 28) / 1000; // Convert CH4 to CO2e (GWP=28)
    } else {
      baseEmissions = areaPasto * (EMISSION_FACTORS[tipoProducao as keyof typeof EMISSION_FACTORS] || 10);
    }
    
    // Apply technology reductions
    let techReduction = 0;
    tecnologias.forEach(tech => {
      const techData = tecnologiasDisponiveis.find(t => t.id === tech);
      if (techData) techReduction += techData.reducao;
    });
    techReduction = Math.min(techReduction, 60); // Cap at 60%
    
    const emissoes = baseEmissions * (1 - techReduction / 100);
    
    // Sequestration calculation
    const sequestroPasto = areaPasto * SEQUESTRATION_FACTORS.pasto_bem_manejado * 0.3;
    const sequestroArvores = areaArvores * SEQUESTRATION_FACTORS.arvores;
    const sequestroAPP = areaAPP * SEQUESTRATION_FACTORS.app;
    const sequestro = sequestroPasto + sequestroArvores + sequestroAPP;
    
    // Calculate potential reduction from selected practices
    let reducaoPotencial = 0;
    selectedPraticas.forEach(pratica => {
      const praticaData = praticasMitigadoras.find(p => p.id === pratica);
      if (praticaData) reducaoPotencial += praticaData.reducao;
    });
    reducaoPotencial = Math.min(reducaoPotencial, 70);
    
    const balanco = emissoes - sequestro;
    const emissaoReduzida = emissoes * (reducaoPotencial / 100);
    const receitaPotencial = emissaoReduzida * customCreditValue * 5.5; // Convert to BRL
    
    return {
      emissoes: Math.round(emissoes * 10) / 10,
      sequestro: Math.round(sequestro * 10) / 10,
      balanco: Math.round(balanco * 10) / 10,
      reducaoPotencial,
      receitaPotencial: Math.round(receitaPotencial)
    };
  };

  const handleCalculate = async () => {
    if (!user) {
      toast.error("Faça login para usar esta ferramenta");
      return;
    }
    
    const hasCredit = await useCredit();
    if (!hasCredit) {
      setShowUpgradeModal(true);
      return;
    }
    
    const calculatedResults = calculateEmissions();
    setResults(calculatedResults);
    setStep("diagnosis");
  };

  const handleSimulate = () => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }
    const calculatedResults = calculateEmissions();
    setResults(calculatedResults);
  };

  const generateReportContent = (): string => {
    if (!results) return "";
    
    const selectedPraticasDetails = selectedPraticas.map(id => {
      const pratica = praticasMitigadoras.find(p => p.id === id);
      return pratica ? `• ${pratica.label} (-${pratica.reducao}%)` : "";
    }).filter(Boolean).join("\n");
    
    const docs = [
      "CAR (Cadastro Ambiental Rural) atualizado",
      "Georreferenciamento da propriedade",
      "Histórico de manejo (últimos 5 anos)",
      "Inventário de rebanho",
      "Comprovantes de tecnologias adotadas"
    ];
    
    return `RESUMO DA SITUAÇÃO

Tipo de Produção: ${tiposProducao.find(t => t.value === formData.tipoProducao)?.label || "-"}
Número de Animais: ${formData.numeroAnimais}
Área de Pasto: ${formData.areaPasto} ha
Área de Árvores: ${formData.areaArvores} ha
Área de APP: ${formData.areaAPP} ha
Tipo de Manejo: ${tiposManejo.find(m => m.value === formData.tipoManejo)?.label || "-"}

DIAGNÓSTICO DE EMISSÕES

• Emissões Totais: ${results.emissoes.toFixed(1)} tCO₂e/ano
• Sequestro de Carbono: ${results.sequestro.toFixed(1)} tCO₂e/ano
• Balanço de Carbono: ${results.balanco.toFixed(1)} tCO₂e/ano

POTENCIAL DE REDUÇÃO

• Redução Potencial: ${results.reducaoPotencial}%
• Receita Estimada: R$ ${results.receitaPotencial.toLocaleString("pt-BR")}/ano

${selectedPraticas.length > 0 ? `PRÁTICAS MITIGADORAS SELECIONADAS

${selectedPraticasDetails}` : ""}

CENÁRIOS DE CRÉDITOS DE CARBONO

Com base nas reduções simuladas:
• Cenário Conservador (US$ 5/tCO₂e): R$ ${Math.round(results.reducaoPotencial * results.emissoes / 100 * 5 * 5.5).toLocaleString("pt-BR")}/ano
• Cenário Realista (US$ 10/tCO₂e): R$ ${Math.round(results.reducaoPotencial * results.emissoes / 100 * 10 * 5.5).toLocaleString("pt-BR")}/ano
• Cenário Otimista (US$ 15/tCO₂e): R$ ${Math.round(results.reducaoPotencial * results.emissoes / 100 * 15 * 5.5).toLocaleString("pt-BR")}/ano

DOCUMENTAÇÃO NECESSÁRIA

${docs.map(d => `• ${d}`).join("\n")}

RECOMENDAÇÕES

Para maximizar seu potencial de créditos de carbono:
• Mantenha registros detalhados de todas as práticas sustentáveis implementadas
• Realize inventário anual de emissões e sequestro
• Considere certificações como ILPF, orgânico ou ABC+
• Consulte um técnico especializado para validação dos cálculos
• Monitore o mercado de carbono para melhores oportunidades de venda`;
  };

  const carbonReferences = [
    "IPCC - Intergovernmental Panel on Climate Change (2019)",
    "EMBRAPA - Empresa Brasileira de Pesquisa Agropecuária",
    "MAPA - Plano ABC+ (Agricultura de Baixa Emissão de Carbono)",
    "FAO - Food and Agriculture Organization",
    "GHG Protocol Agricultural Guidance"
  ];

  const emissionChartData = results ? [
    { name: "Fermentação entérica", value: results.emissoes * 0.55, color: "#ef4444" },
    { name: "Manejo de dejetos", value: results.emissoes * 0.25, color: "#f97316" },
    { name: "Uso de energia", value: results.emissoes * 0.12, color: "#eab308" },
    { name: "Outros", value: results.emissoes * 0.08, color: "#a3a3a3" }
  ] : [];

  const sequestrationChartData = results ? [
    { name: "Árvores", value: formData.areaArvores * SEQUESTRATION_FACTORS.arvores },
    { name: "APP", value: formData.areaAPP * SEQUESTRATION_FACTORS.app },
    { name: "Solo/Pasto", value: formData.areaPasto * SEQUESTRATION_FACTORS.pasto_bem_manejado * 0.3 }
  ] : [];

  const renderWelcome = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
        <Leaf className="h-10 w-10 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-foreground">Modelador de Carbono VetAgro IA</h1>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        Descubra onde sua fazenda emite, onde captura e quanto pode ganhar reduzindo emissões ou gerando créditos de carbono.
      </p>
      
      <div className="grid md:grid-cols-2 gap-4 max-w-xl mx-auto mt-8">
        <Button 
          variant="outline" 
          size="lg" 
          className="h-auto py-4 flex-col gap-2"
          onClick={() => setStep("education")}
        >
          <HelpCircle className="h-6 w-6" />
          <span>Como funciona?</span>
        </Button>
        <Button 
          size="lg" 
          className="h-auto py-4 flex-col gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          onClick={() => setMode(null)}
        >
          <ChevronRight className="h-6 w-6" />
          <span>Começar simulação</span>
        </Button>
      </div>

      {mode === null && step === "welcome" && (
        <Card className="max-w-xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Escolha seu modo de uso</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-auto py-6 flex-col gap-2"
              onClick={() => { setMode("produtor"); setStep("education"); }}
            >
              <TreePine className="h-8 w-8 text-green-600" />
              <span className="font-semibold">Modo Produtor</span>
              <span className="text-xs text-muted-foreground">Explicativo e simplificado</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-6 flex-col gap-2"
              onClick={() => { setMode("tecnico"); setStep("form"); }}
            >
              <Target className="h-8 w-8 text-blue-600" />
              <span className="font-semibold">Modo Técnico</span>
              <span className="text-xs text-muted-foreground">Fórmulas e customização</span>
              {!isPremium && (
                <span className="text-xs text-amber-600 flex items-center gap-1">
                  <Crown className="h-3 w-3" /> Requer Pro/Expert
                </span>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderEducation = () => {
    const content = educationalContent[educationIndex];
    const IconComponent = content.icon;
    
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4">
            <IconComponent className="h-8 w-8 text-white" />
          </div>
          <CardTitle>{content.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{content.content}</p>
          <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-green-500">
            <p className="text-sm italic">💡 {content.analogy}</p>
          </div>
          
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => educationIndex > 0 ? setEducationIndex(educationIndex - 1) : setStep("welcome")}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex gap-1">
              {educationalContent.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i === educationIndex ? "bg-green-500" : "bg-muted"}`} />
              ))}
            </div>
            <Button
              onClick={() => {
                if (educationIndex < educationalContent.length - 1) {
                  setEducationIndex(educationIndex + 1);
                } else {
                  setStep("form");
                }
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-600"
            >
              {educationIndex < educationalContent.length - 1 ? "Entendi, continuar" : "Começar simulação"}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderForm = () => (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Dados da Propriedade
        </CardTitle>
        <CardDescription>
          Preencha as informações abaixo para calcular as emissões e o potencial de captura de carbono da sua fazenda.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Tipo de Produção</Label>
              <Tooltip>
                <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent>Selecione o principal tipo de atividade da sua propriedade</TooltipContent>
              </Tooltip>
            </div>
            <Select value={formData.tipoProducao} onValueChange={(v) => setFormData({...formData, tipoProducao: v})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {tiposProducao.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Número de Animais</Label>
              <Tooltip>
                <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent>Total de cabeças no rebanho (bovinos, ovinos, etc.)</TooltipContent>
              </Tooltip>
            </div>
            <Input
              type="number"
              value={formData.numeroAnimais || ""}
              onChange={(e) => setFormData({...formData, numeroAnimais: Number(e.target.value)})}
              placeholder="Ex: 500"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Área de Pasto (ha)</Label>
              <Tooltip>
                <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent>Área total de pastagem em hectares</TooltipContent>
              </Tooltip>
            </div>
            <Input
              type="number"
              value={formData.areaPasto || ""}
              onChange={(e) => setFormData({...formData, areaPasto: Number(e.target.value)})}
              placeholder="Ex: 200"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Produtividade (@/ha/ano)</Label>
              <Tooltip>
                <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent>Arrobas produzidas por hectare por ano</TooltipContent>
              </Tooltip>
            </div>
            <Input
              type="number"
              value={formData.produtividade || ""}
              onChange={(e) => setFormData({...formData, produtividade: Number(e.target.value)})}
              placeholder="Ex: 8"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Tipo de Manejo</Label>
              <Tooltip>
                <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent>Sistema de manejo utilizado na propriedade</TooltipContent>
              </Tooltip>
            </div>
            <Select value={formData.tipoManejo} onValueChange={(v) => setFormData({...formData, tipoManejo: v})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {tiposManejo.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Área de Árvores (ha)</Label>
              <Tooltip>
                <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent>Área com plantio de árvores, reflorestamento ou silvipastoril</TooltipContent>
              </Tooltip>
            </div>
            <Input
              type="number"
              value={formData.areaArvores || ""}
              onChange={(e) => setFormData({...formData, areaArvores: Number(e.target.value)})}
              placeholder="Ex: 20"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Área de APP (ha)</Label>
              <Tooltip>
                <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent>Área de Preservação Permanente (matas ciliares, topos de morro, etc.)</TooltipContent>
              </Tooltip>
            </div>
            <Input
              type="number"
              value={formData.areaAPP || ""}
              onChange={(e) => setFormData({...formData, areaAPP: Number(e.target.value)})}
              placeholder="Ex: 15"
            />
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label>Tecnologias Adotadas</Label>
            <Tooltip>
              <TooltipTrigger><HelpCircle className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
              <TooltipContent>Marque as tecnologias já implementadas na propriedade</TooltipContent>
            </Tooltip>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {tecnologiasDisponiveis.map(tech => (
              <div key={tech.id} className="flex items-center space-x-2">
                <Checkbox
                  id={tech.id}
                  checked={formData.tecnologias.includes(tech.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData({...formData, tecnologias: [...formData.tecnologias, tech.id]});
                    } else {
                      setFormData({...formData, tecnologias: formData.tecnologias.filter(t => t !== tech.id)});
                    }
                  }}
                />
                <label htmlFor={tech.id} className="text-sm cursor-pointer">
                  {tech.label}
                  <span className="text-green-600 ml-1">(-{tech.reducao}%)</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {mode === "tecnico" && isPremium && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              Parâmetros Técnicos (Modo Pesquisador)
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor do Crédito (USD/tCO₂e)</Label>
                <Input
                  type="number"
                  value={customCreditValue}
                  onChange={(e) => setCustomCreditValue(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => setStep(mode === "produtor" ? "education" : "welcome")}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button
            onClick={handleCalculate}
            disabled={!formData.tipoProducao || !formData.areaPasto}
            className="bg-gradient-to-r from-green-500 to-emerald-600"
          >
            Calcular Emissões
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderDiagnosis = () => (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5 text-red-500" />
            Diagnóstico de Emissões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-4">Principais Fontes de Emissão</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={emissionChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {emissionChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Fontes de Sequestro</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sequestrationChartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-lg">
              <strong>Sua fazenda emite</strong> principalmente através de <span className="text-red-600 font-semibold">fermentação entérica</span> e 
              <strong> captura carbono</strong> principalmente através de <span className="text-green-600 font-semibold">árvores e APP</span>.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4 text-center">
                <TrendingUp className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Emissões Totais</p>
                <p className="text-2xl font-bold text-red-600">{results?.emissoes} tCO₂e/ano</p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4 text-center">
                <TrendingDown className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Sequestro Total</p>
                <p className="text-2xl font-bold text-green-600">{results?.sequestro} tCO₂e/ano</p>
              </CardContent>
            </Card>
            <Card className={`border-${results && results.balanco > 0 ? "amber" : "green"}-200 bg-${results && results.balanco > 0 ? "amber" : "green"}-50`}>
              <CardContent className="pt-4 text-center">
                <Target className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Balanço de Carbono</p>
                <p className={`text-2xl font-bold ${results && results.balanco > 0 ? "text-amber-600" : "text-green-600"}`}>
                  {results?.balanco} tCO₂e/ano
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep("form")}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={() => setStep("simulation")} className="bg-gradient-to-r from-green-500 to-emerald-600">
          Simular Reduções
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderSimulation = () => (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-500" />
            Simulação de Práticas Mitigadoras
            {!isPremium && <Crown className="h-4 w-4 text-amber-500" />}
          </CardTitle>
          <CardDescription>
            Selecione as práticas que você gostaria de implementar e veja o impacto potencial.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isPremium && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <p className="text-sm text-amber-800">
                <Crown className="h-4 w-4 inline mr-2" />
                Para simulações avançadas e relatórios completos, faça upgrade para Pro ou Expert.
              </p>
            </div>
          )}
          
          <div className="grid md:grid-cols-2 gap-3">
            {praticasMitigadoras.map(pratica => (
              <div 
                key={pratica.id} 
                className={`p-3 rounded-lg border ${selectedPraticas.includes(pratica.id) ? "border-green-500 bg-green-50" : "border-muted"}`}
              >
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id={pratica.id}
                    checked={selectedPraticas.includes(pratica.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPraticas([...selectedPraticas, pratica.id]);
                      } else {
                        setSelectedPraticas(selectedPraticas.filter(p => p !== pratica.id));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <label htmlFor={pratica.id} className="text-sm font-medium cursor-pointer">
                      {pratica.label}
                    </label>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                        -{pratica.reducao}% emissões
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded">
                        Custo: {pratica.custo}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <Button onClick={handleSimulate} className="w-full bg-gradient-to-r from-green-500 to-emerald-600">
            Calcular Impacto
          </Button>
          
          {results && results.reducaoPotencial > 0 && (
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-lg mb-4 text-green-800">Resultado da Simulação</h4>
              <p className="text-lg">
                Com essas práticas, sua fazenda pode <strong className="text-green-700">reduzir {results.reducaoPotencial}% das emissões</strong> e 
                gerar até <strong className="text-green-700">R$ {results.receitaPotencial.toLocaleString("pt-BR")}</strong> por ano em créditos de carbono.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep("diagnosis")}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={() => setStep("credits")} className="bg-gradient-to-r from-green-500 to-emerald-600">
          Ver Estimativa de Créditos
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderCredits = () => {
    const emissaoReduzida = results ? results.emissoes * (results.reducaoPotencial / 100) : 0;
    
    const scenarios = [
      { name: "Conservador", value: CARBON_CREDIT_VALUES.conservador, color: "text-amber-600", bg: "bg-amber-50" },
      { name: "Realista", value: CARBON_CREDIT_VALUES.realista, color: "text-green-600", bg: "bg-green-50" },
      { name: "Otimista", value: CARBON_CREDIT_VALUES.otimista, color: "text-emerald-600", bg: "bg-emerald-50" }
    ];
    
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-500" />
              Estimativa de Créditos de Carbono
            </CardTitle>
            <CardDescription>
              Potencial de receita anual com base nas reduções simuladas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Redução estimada de emissões:</p>
              <p className="text-3xl font-bold text-green-600">{emissaoReduzida.toFixed(1)} tCO₂e/ano</p>
            </div>
            
            <h4 className="font-semibold">Cenários de Receita</h4>
            <div className="grid md:grid-cols-3 gap-4">
              {scenarios.map(scenario => {
                const receita = emissaoReduzida * scenario.value * 5.5;
                return (
                  <Card key={scenario.name} className={`${scenario.bg} border-0`}>
                    <CardContent className="pt-4 text-center">
                      <p className="text-sm text-muted-foreground">{scenario.name}</p>
                      <p className="text-xs text-muted-foreground">(US$ {scenario.value}/tCO₂e)</p>
                      <p className={`text-2xl font-bold ${scenario.color} mt-2`}>
                        R$ {Math.round(receita).toLocaleString("pt-BR")}
                      </p>
                      <p className="text-xs text-muted-foreground">por ano</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {isPremium ? (
              <ResponseActionButtons
                content={generateReportContent()}
                title="Relatório de Carbono e Créditos Ambientais"
                toolName="Modelador de Carbono"
                className="w-full"
              />
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Para relatórios completos e recomendações avançadas, faça upgrade para Pro ou Expert.
                </p>
                <Button className="mt-3" onClick={() => setShowUpgradeModal(true)}>
                  Ver Planos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Veja como implementar as mudanças sugeridas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              Nossas recomendações são baseadas nas práticas que você selecionou. Para cada uma, sugerimos:
            </p>
            <ul className="space-y-2">
              {selectedPraticas.slice(0, 3).map(praticaId => {
                const pratica = praticasMitigadoras.find(p => p.id === praticaId);
                return pratica ? (
                  <li key={praticaId} className="flex items-start gap-2">
                    <Leaf className="h-4 w-4 text-green-500 mt-1" />
                    <span>{pratica.label}: Implementação gradual com monitoramento mensal</span>
                  </li>
                ) : null;
              })}
            </ul>
          </CardContent>
        </Card>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep("simulation")}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button variant="outline" onClick={() => { setStep("welcome"); setResults(null); setSelectedPraticas([]); }}>
            Nova Simulação
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Leaf className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Modelador de Carbono e Créditos Ambientais</h1>
            <p className="text-muted-foreground text-sm md:text-base">Elegibilidade em mercados de carbono e projeção de receita</p>
          </div>
        </div>
        
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 mb-6">
          <p className="text-sm text-green-800">
            <Info className="h-4 w-4 inline mr-2" />
            Você está usando inteligência aplicada à sustentabilidade. Cada análise combina dados técnicos com recomendações práticas para operações mais eficientes, lucrativas e responsáveis ambientalmente.
          </p>
        </div>
      </div>
      
      {step === "welcome" && renderWelcome()}
      {step === "education" && renderEducation()}
      {step === "form" && renderForm()}
      {step === "diagnosis" && renderDiagnosis()}
      {step === "simulation" && renderSimulation()}
      {step === "credits" && renderCredits()}
      
      <UpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal}
        reason="Para acessar simulações avançadas e relatórios completos"
      />
    </div>
  );
};

export default ModeladorCarbono;
