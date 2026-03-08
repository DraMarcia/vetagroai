import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  Cloud, Loader2, HelpCircle, Flame, Wind, TreePine, RefreshCw, 
  TrendingDown, BarChart3, Leaf, User, GraduationCap, FlaskConical,
  AlertTriangle, CheckCircle, BookOpen, FileText, Info, Calculator
} from "lucide-react";
import { ResponseActionButtons } from "@/components/ResponseActionButtons";
import { useToast } from "@/hooks/use-toast";
import { resilientInvoke, extractAnswer } from "@/lib/resilientInvoke";
import { logTerritorialMetric, anonymizeHerdSize } from "@/lib/territorialLogger";
import { MarkdownTableRenderer } from "@/components/MarkdownTableRenderer";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from "recharts";
import { ToolExplanatoryBlock } from "@/components/ToolExplanatoryBlock";

// MÓDULO 2 — LIMITES BIOLÓGICOS (IPCC 2019 Refinement)
const BIOLOGICAL_LIMITS = {
  VS: { min: 2, max: 8, unit: "kg/animal/dia", description: "Sólidos voláteis" },
  IMS_PERCENT: { min: 1.8, max: 3.2, unit: "% do PV", description: "Ingestão de matéria seca" },
  Nex: { min: 25, max: 50, unit: "kg N/animal/ano", description: "Nitrogênio excretado" },
  CH4_DEJETOS_RATIO: { max: 0.15, description: "CH₄ dejetos ≤ 15% do CH₄ entérico (pasto)" },
  EB: { min: 17.5, max: 19.5, unit: "MJ/kg MS", description: "Energia bruta" },
  DIVMS: { min: 45, max: 70, unit: "%", description: "Digestibilidade da matéria seca" },
  Ym_PASTO: { value: 6.5, unit: "%", description: "Ym pasto tropical" },
  Ym_CONFINAMENTO: { min: 3.0, max: 3.5, unit: "%", description: "Ym confinamento" },
};

// GWP-100 (IPCC AR6)
const GWP = {
  CH4: 27.2,
  N2O: 273,
  CO2: 1,
};

// Fatores de emissão padrão
const EMISSION_FACTORS = {
  B0_CORTE: 0.10,
  MCF_PASTO: 0.015,
  MCF_CONFINAMENTO: 0.02,
  EF_N2O_DIRETO: 0.02,
  EF_N2O_VOLATILIZACAO: 0.01,
  EF_N2O_LIXIVIACAO: 0.0075,
  FRAC_GAS: 0.20,
  FRAC_LEACH: 0.30,
};

// Categorias animais com pesos médios
const ANIMAL_CATEGORIES = [
  { id: "matrizes", name: "Matrizes", defaultWeight: 450 },
  { id: "bezerros", name: "Bezerros (até desmama)", defaultWeight: 180 },
  { id: "novilhos", name: "Novilhos/Novilhas", defaultWeight: 350 },
  { id: "touros", name: "Touros", defaultWeight: 700 },
  { id: "boi_engorda", name: "Boi de Engorda", defaultWeight: 450 },
];

const PRODUCTION_SYSTEMS = [
  { id: "extensivo", name: "Extensivo (pasto)", Ym: 6.5, MCF: 0.015 },
  { id: "semi_intensivo", name: "Semi-intensivo", Ym: 5.5, MCF: 0.018 },
  { id: "confinamento", name: "Confinamento", Ym: 3.0, MCF: 0.02 },
  { id: "ilpf", name: "ILPF", Ym: 5.0, MCF: 0.015 },
];

type UserLevel = "produtor" | "profissional" | "pesquisador";

interface AnimalInput {
  category: string;
  count: number;
  weight: number;
}

interface CalculationResult {
  totalCO2eq: number;
  ch4Enterico: number;
  ch4Dejetos: number;
  n2oDireto: number;
  n2oIndireto: number;
  warnings: string[];
  details: {
    IMS: number;
    EB: number;
    DE: number;
    ME: number;
    VS: number;
    Nex: number;
  };
  byCategory: { name: string; emissions: number }[];
}

const CalculadoraGEE = () => {
  const { toast } = useToast();
  
  // Estados
  const [userLevel, setUserLevel] = useState<UserLevel>("profissional");
  const [loading, setLoading] = useState(false);
  const [animals, setAnimals] = useState<AnimalInput[]>([
    { category: "boi_engorda", count: 100, weight: 450 }
  ]);
  const [productionSystem, setProductionSystem] = useState("semi_intensivo");
  const [pastureArea, setPastureArea] = useState(100);
  const [divms, setDivms] = useState(55);
  const [location, setLocation] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [showMethodology, setShowMethodology] = useState(false);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [mitigationResult, setMitigationResult] = useState("");
  const [loadingMitigation, setLoadingMitigation] = useState(false);

  // Referências obrigatórias (MÓDULO 7)
  const references = [
    "IPCC 2006 Guidelines for National Greenhouse Gas Inventories — Volume 4: Agriculture, Forestry and Other Land Use",
    "IPCC 2019 Refinement to the 2006 Guidelines for National Greenhouse Gas Inventories",
    "NRC - Nutrient Requirements of Beef Cattle (8th Revised Edition)",
    "EMBRAPA Gado de Corte - Emissões de Gases de Efeito Estufa na Pecuária",
    "Gerber, P.J. et al. (2013) Tackling Climate Change Through Livestock — FAO",
    "CEPEA/ESALQ - Centro de Estudos Avançados em Economia Aplicada"
  ];

  // Função de validação com limites biológicos (MÓDULO 2)
  const validateAndAdjust = (value: number, limit: { min?: number; max?: number }, name: string): { value: number; warning: string | null } => {
    let adjusted = value;
    let warning: string | null = null;

    if (limit.min !== undefined && value < limit.min) {
      adjusted = limit.min;
      warning = `${name}: Valor ${value.toFixed(2)} ajustado para ${limit.min} (mínimo fisiológico)`;
    }
    if (limit.max !== undefined && value > limit.max) {
      adjusted = limit.max;
      warning = `${name}: Valor ${value.toFixed(2)} ajustado para ${limit.max} (máximo fisiológico)`;
    }
    
    return { value: adjusted, warning };
  };

  // MÓDULO 3 — CÁLCULOS TIER 2 IPCC
  const calculateEmissions = (): CalculationResult => {
    const warnings: string[] = [];
    const system = PRODUCTION_SYSTEMS.find(s => s.id === productionSystem) || PRODUCTION_SYSTEMS[0];
    
    let totalCH4Enterico = 0;
    let totalCH4Dejetos = 0;
    let totalN2ODireto = 0;
    let totalN2OIndireto = 0;
    let totalDetails = { IMS: 0, EB: 0, DE: 0, ME: 0, VS: 0, Nex: 0 };
    const byCategory: { name: string; emissions: number }[] = [];

    const totalAnimals = animals.reduce((sum, a) => sum + a.count, 0);

    animals.forEach(animal => {
      if (animal.count <= 0) return;

      const categoryInfo = ANIMAL_CATEGORIES.find(c => c.id === animal.category);
      const categoryName = categoryInfo?.name || animal.category;
      const weight = animal.weight || categoryInfo?.defaultWeight || 400;

      // 3.1 IMS
      let imsPercent = 2.3;
      const imsValidation = validateAndAdjust(imsPercent, BIOLOGICAL_LIMITS.IMS_PERCENT, "IMS %");
      imsPercent = imsValidation.value;
      if (imsValidation.warning) warnings.push(imsValidation.warning);
      
      const IMS = (imsPercent / 100) * weight;

      // 3.2 Energia Bruta
      const EB_factor = 18.45;
      const EB = IMS * EB_factor;

      // Validar DIVMS
      const divmsValidation = validateAndAdjust(divms, BIOLOGICAL_LIMITS.DIVMS, "DIVMS");
      const validatedDIVMS = divmsValidation.value / 100;
      if (divmsValidation.warning) warnings.push(divmsValidation.warning);

      // 3.3 Energia Digerida
      const DE = EB * validatedDIVMS;

      // 3.4 Energia Metabolizável
      const ME = DE * 0.82;

      // 3.5 Metano Entérico
      const Ym = system.Ym;
      const ch4EntericoAnimal = (Ym / 100) * EB * 365 / 55.65;
      const ch4EntericoTotal = ch4EntericoAnimal * animal.count;

      // 3.6 Sólidos Voláteis
      let VS = IMS * (1 - validatedDIVMS) * 0.92;
      const vsValidation = validateAndAdjust(VS, BIOLOGICAL_LIMITS.VS, "VS");
      VS = vsValidation.value;
      if (vsValidation.warning) warnings.push(vsValidation.warning);

      // 3.7 CH₄ de Dejetos
      const B0 = EMISSION_FACTORS.B0_CORTE;
      const MCF = system.MCF;
      const ch4DejetosAnimal = VS * B0 * MCF * 365;
      let ch4DejetosTotal = ch4DejetosAnimal * animal.count;

      // Validar limite CH₄ dejetos
      if (productionSystem === "extensivo" || productionSystem === "semi_intensivo") {
        const maxDejetos = ch4EntericoTotal * BIOLOGICAL_LIMITS.CH4_DEJETOS_RATIO.max;
        if (ch4DejetosTotal > maxDejetos) {
          warnings.push(`CH₄ dejetos ajustado: ${ch4DejetosTotal.toFixed(1)} → ${maxDejetos.toFixed(1)} kg (limite 15% do entérico)`);
          ch4DejetosTotal = maxDejetos;
        }
      }

      // 3.8 N excretado
      let Nex = 37.5 * animal.count;
      const nexValidation = validateAndAdjust(Nex / animal.count, BIOLOGICAL_LIMITS.Nex, "Nex");
      Nex = nexValidation.value * animal.count;
      if (nexValidation.warning) warnings.push(nexValidation.warning);

      // 3.9 N₂O Direto e Indireto
      const n2oDiretoKg = Nex * EMISSION_FACTORS.EF_N2O_DIRETO * (44/28);
      const nVolatilizado = Nex * EMISSION_FACTORS.FRAC_GAS;
      const nLixiviado = Nex * EMISSION_FACTORS.FRAC_LEACH;
      const n2oVolatilizacao = nVolatilizado * EMISSION_FACTORS.EF_N2O_VOLATILIZACAO * (44/28);
      const n2oLixiviacao = nLixiviado * EMISSION_FACTORS.EF_N2O_LIXIVIACAO * (44/28);
      const n2oIndiretoKg = n2oVolatilizacao + n2oLixiviacao;

      // Acumular totais
      totalCH4Enterico += ch4EntericoTotal;
      totalCH4Dejetos += ch4DejetosTotal;
      totalN2ODireto += n2oDiretoKg;
      totalN2OIndireto += n2oIndiretoKg;

      // Detalhes médios
      totalDetails.IMS += IMS * animal.count;
      totalDetails.EB += EB * animal.count;
      totalDetails.DE += DE * animal.count;
      totalDetails.ME += ME * animal.count;
      totalDetails.VS += VS * animal.count;
      totalDetails.Nex += Nex;

      // Emissões por categoria em CO₂eq
      const categoryCO2eq = (ch4EntericoTotal + ch4DejetosTotal) * GWP.CH4 + 
                           (n2oDiretoKg + n2oIndiretoKg) * GWP.N2O;
      byCategory.push({ name: categoryName, emissions: categoryCO2eq / 1000 });
    });

    // Normalizar detalhes
    if (totalAnimals > 0) {
      totalDetails.IMS /= totalAnimals;
      totalDetails.EB /= totalAnimals;
      totalDetails.DE /= totalAnimals;
      totalDetails.ME /= totalAnimals;
      totalDetails.VS /= totalAnimals;
    }

    // 3.10 Conversão para CO₂eq
    const ch4TotalCO2eq = (totalCH4Enterico + totalCH4Dejetos) * GWP.CH4 / 1000;
    const n2oTotalCO2eq = (totalN2ODireto + totalN2OIndireto) * GWP.N2O / 1000;
    const totalCO2eq = ch4TotalCO2eq + n2oTotalCO2eq;

    return {
      totalCO2eq,
      ch4Enterico: totalCH4Enterico * GWP.CH4 / 1000,
      ch4Dejetos: totalCH4Dejetos * GWP.CH4 / 1000,
      n2oDireto: totalN2ODireto * GWP.N2O / 1000,
      n2oIndireto: totalN2OIndireto * GWP.N2O / 1000,
      warnings,
      details: totalDetails,
      byCategory,
    };
  };

  // Gerar prompt com ARQUITETURA COMPLETA
  const generatePrompt = (result: CalculationResult): string => {
    const totalAnimals = animals.reduce((sum, a) => sum + a.count, 0);
    const system = PRODUCTION_SYSTEMS.find(s => s.id === productionSystem);
    const totalWeight = animals.reduce((sum, a) => sum + (a.count * a.weight), 0);
    const avgWeight = totalAnimals > 0 ? totalWeight / totalAnimals : 0;
    const lotacao = pastureArea > 0 ? (totalAnimals * avgWeight / 450 / pastureArea).toFixed(2) : "N/A";

    const baseData = `
DADOS DO SISTEMA PECUÁRIO:
- Localização: ${location || "Brasil"}
- Total de animais: ${totalAnimals} cabeças
- Peso médio: ${avgWeight.toFixed(0)} kg
- Sistema de produção: ${system?.name}
- Área de pastagem: ${pastureArea} hectares
- Taxa de lotação: ${lotacao} UA/ha
- Digestibilidade (DIVMS): ${divms}%
${additionalNotes ? `- Observações do usuário: ${additionalNotes}` : ""}

CATEGORIAS DO REBANHO:
${animals.map(a => {
  const cat = ANIMAL_CATEGORIES.find(c => c.id === a.category);
  return `- ${cat?.name || a.category}: ${a.count} animais (${a.weight} kg cada)`;
}).join("\n")}

RESULTADOS CALCULADOS (Metodologia IPCC Tier 2):
- Emissão TOTAL: ${result.totalCO2eq.toFixed(2)} tCO₂eq/ano
- CH₄ entérico: ${result.ch4Enterico.toFixed(2)} tCO₂eq (${((result.ch4Enterico / result.totalCO2eq) * 100).toFixed(1)}%)
- CH₄ dejetos: ${result.ch4Dejetos.toFixed(2)} tCO₂eq (${((result.ch4Dejetos / result.totalCO2eq) * 100).toFixed(1)}%)
- N₂O direto: ${result.n2oDireto.toFixed(2)} tCO₂eq (${((result.n2oDireto / result.totalCO2eq) * 100).toFixed(1)}%)
- N₂O indireto: ${result.n2oIndireto.toFixed(2)} tCO₂eq (${((result.n2oIndireto / result.totalCO2eq) * 100).toFixed(1)}%)

INDICADORES CALCULADOS:
- kg CO₂eq/cabeça/ano: ${(result.totalCO2eq * 1000 / totalAnimals).toFixed(1)}
- kg CO₂eq/ha/ano: ${(result.totalCO2eq * 1000 / pastureArea).toFixed(1)}
- IMS média: ${result.details.IMS.toFixed(2)} kg MS/dia
- Energia Bruta: ${result.details.EB.toFixed(1)} MJ/dia
- VS médio: ${result.details.VS.toFixed(2)} kg/dia
- Nex total: ${result.details.Nex.toFixed(1)} kg N/ano

FATORES UTILIZADOS (IPCC 2019):
- Ym: ${system?.Ym}%
- MCF: ${(system?.MCF || 0) * 100}%
- B₀: ${EMISSION_FACTORS.B0_CORTE} kg CH₄/kg VS
- GWP CH₄: ${GWP.CH4} | GWP N₂O: ${GWP.N2O}`;

    const commonInstructions = `

INSTRUÇÕES DE FORMATAÇÃO (OBRIGATÓRIO):
- NUNCA use hashtags (#), asteriscos (*), ou símbolos markdown
- Use apenas bullets com • ou - para listas
- Títulos de seção devem usar formato "TÍTULO DA SEÇÃO:" em maiúsculas
- Texto deve ser claro, organizado e sem redundâncias
- Tabelas devem usar formato simples com | para separadores
- Números devem ter no máximo 2 casas decimais
- Inclua SEMPRE a seção de REFERÊNCIAS TÉCNICAS ao final

AVISO LEGAL OBRIGATÓRIO (incluir ao final):
"Este relatório é gerado automaticamente pela suíte VetAgro Sustentável AI. Decisões de manejo devem ser confirmadas por profissional habilitado (Médico Veterinário, Zootecnista ou Engenheiro Agrônomo registrado no respectivo Conselho)."`;

    if (userLevel === "produtor") {
      return `${baseData}

GERE UM RELATÓRIO PARA PRODUTOR RURAL seguindo EXATAMENTE esta estrutura:

1) IDENTIFICAÇÃO DO CASO:
   - Sistema avaliado
   - Localização
   - Total de animais
   - Período de análise

2) SÍNTESE EXECUTIVA:
   - Frase simples sobre a emissão total
   - Principal fonte de emissão (em linguagem clara)
   - O que isso significa na prática
   - Potencial de redução estimado

3) ANÁLISE SIMPLIFICADA:
   - Comparação com média do setor (média Brasil: 2.000 kg CO₂eq/cabeça/ano)
   - Classificação: ABAIXO / NA MÉDIA / ACIMA da média nacional

4) RECOMENDAÇÕES PRÁTICAS:
   - 3 a 5 ações imediatas de baixo custo
   - 2 a 3 ações de médio prazo
   - Benefícios esperados de cada ação

5) COMPARATIVO VISUAL:
   - Seu rebanho vs média regional
   - Meta de redução sugerida (%)

6) MONITORAMENTO:
   - Frequência de reavaliação sugerida
   - Indicadores simples para acompanhar

7) REFERÊNCIAS TÉCNICAS:
   - IPCC 2019 Refinement
   - EMBRAPA Gado de Corte
   - NRC Beef Cattle

REGRAS: Linguagem SIMPLES, frases CURTAS, SEM fórmulas, SEM jargões técnicos. Máximo 1,5 páginas.
${commonInstructions}`;
    }

    if (userLevel === "profissional") {
      return `${baseData}

GERE UM RELATÓRIO TÉCNICO PARA PROFISSIONAL (Veterinário/Zootecnista/Agrônomo) seguindo EXATAMENTE esta estrutura:

1) IDENTIFICAÇÃO DO CASO:
   - Sistema produtivo avaliado
   - Localização e características regionais
   - Composição do rebanho por categoria
   - Período e escopo da análise

2) SÍNTESE EXECUTIVA:
   - Emissão total em tCO₂eq/ano
   - Distribuição percentual por fonte
   - Principais oportunidades de mitigação
   - Indicadores de eficiência (kg CO₂eq/kg carne, kg CO₂eq/ha)

3) ANÁLISE TÉCNICA DETALHADA:
   - Avaliação da IMS e eficiência de conversão
   - Análise dos sólidos voláteis (VS) e implicações
   - Balanço de nitrogênio e excreção (Nex)
   - Eficiência alimentar vs perfil de emissões
   - Fatores limitantes identificados

4) CÁLCULOS E INDICADORES:
   - Tabela com parâmetros calculados
   - Comparativo com benchmarks nacionais e internacionais
   - Análise de sensibilidade (variação de DIVMS e Ym)

5) RECOMENDAÇÕES TÉCNICAS DETALHADAS:
   - Manejo nutricional (aditivos, suplementação, dieta)
   - Genética e seleção para eficiência
   - Sistemas integrados (ILPF, rotacionado)
   - Alertas sanitários e ambientais

6) ESTRATÉGIAS DE MITIGAÇÃO:
   - Aditivos alimentares: taninos (-8%), 3-NOP (-25%), óleos essenciais (-5%)
   - Manejo de pastagem: rotacionado intensivo (-10%)
   - Integração: ILPF (-15 a -25%)
   - Biodigestores: captura até 70% CH₄ dejetos
   - Potencial de redução quantificado para cada estratégia

7) COMPARATIVO DE CENÁRIOS:
   - Cenário atual
   - Cenário otimizado (com práticas de mitigação)
   - Cenário intensificado
   - Delta de emissões e custo-benefício

8) MONITORAMENTO E METAS:
   - Indicadores-chave de desempenho (KPIs)
   - Frequência de reavaliação
   - Metas de curto, médio e longo prazo

9) REFERÊNCIAS TÉCNICAS:
   - IPCC 2006 Guidelines Vol. 4
   - IPCC 2019 Refinement
   - NRC Beef Cattle (8th Ed.)
   - EMBRAPA Gado de Corte
   - Gerber et al. 2013 (FAO)
   - CEPEA/ESALQ

REGRAS: Manter cálculos com explicação, indicadores técnicos, recomendações detalhadas. Máximo 3 páginas.
${commonInstructions}`;
    }

    // Pesquisador/Técnico Avançado
    return `${baseData}

GERE UM RELATÓRIO CIENTÍFICO COMPLETO (Nível Pesquisador/Técnico Avançado) seguindo EXATAMENTE esta estrutura:

1) IDENTIFICAÇÃO DO CASO:
   - Caracterização completa do sistema
   - Localização geográfica e climática
   - Composição detalhada do rebanho
   - Período de análise e metodologia aplicada

2) SÍNTESE EXECUTIVA:
   - Emissão total: ${result.totalCO2eq.toFixed(2)} tCO₂eq/ano
   - Distribuição por fonte com precisão
   - Indicadores de intensidade de emissão
   - Principais achados e recomendações

3) METODOLOGIA DETALHADA (IPCC Tier 2):
   EQUAÇÕES UTILIZADAS:
   - IMS = 2,3% × PV (modelo empírico IPCC)
   - EB = IMS × 18,45 MJ/kg MS
   - DE = EB × DIVMS
   - ME = DE × 0,82
   - CH₄ entérico = (Ym/100) × EB × 365 / 55,65 MJ/kg CH₄
   - VS = IMS × (1 - DIVMS) × 0,92
   - CH₄ dejetos = VS × B₀ × MCF × 365
   - N₂O direto = Nex × EF × (44/28)
   - N₂O indireto = (Nvol × EF_vol + Nlix × EF_lix) × (44/28)
   
   FATORES DE EMISSÃO APLICADOS:
   - Ym = ${system?.Ym}% (${system?.name})
   - B₀ = ${EMISSION_FACTORS.B0_CORTE} kg CH₄/kg VS
   - MCF = ${(system?.MCF || 0) * 100}%
   - EF N₂O direto = ${EMISSION_FACTORS.EF_N2O_DIRETO}
   - Frac_GAS = ${EMISSION_FACTORS.FRAC_GAS} | Frac_LEACH = ${EMISSION_FACTORS.FRAC_LEACH}
   - GWP-100 (AR6): CH₄ = ${GWP.CH4}, N₂O = ${GWP.N2O}

4) TABELAS DE PARÂMETROS:
   - Valores calculados vs limites fisiológicos
   - Incertezas associadas (±15-25% para Tier 2)
   - Comparativo com valores de referência IPCC

5) ANÁLISE DE SENSIBILIDADE:
   - Impacto da variação de DIVMS (±5%): estimativa de mudança em emissões
   - Impacto da variação de Ym (±0,5%): estimativa de mudança em CH₄
   - Impacto do sistema de manejo: comparativo extensivo vs confinamento

6) COMPARATIVO METODOLÓGICO:
   - Tier 1 vs Tier 2: diferenças estimadas (Tier 1 usa EF fixo de ~50-60 kg CH₄/cab/ano)
   - Limitações do modelo atual
   - Oportunidades para refinamento (Tier 3)

7) POTENCIAL DE MITIGAÇÃO QUANTIFICADO:
   | Prática | Redução CH₄ | Redução N₂O | Custo Relativo | Referência |
   - Aditivos (3-NOP): -20 a -30% | - | Médio | Hristov et al. 2015
   - ILPF: -15 a -25% | -10% | Alto inicial | EMBRAPA
   - Biodigestor: -70% dejetos | - | Alto | IPCC 2019
   - Rotacionado: -10% | -5% | Baixo | Oliveira et al. 2020

8) ANÁLISE CUSTO-BENEFÍCIO:
   - Investimento estimado por prática
   - Payback esperado
   - Elegibilidade para créditos de carbono (Verra, Gold Standard, ABC+)

9) COMPARATIVO DE CENÁRIOS:
   - Cenário base (atual)
   - Cenário com melhoramento genético (-5 a -10%)
   - Cenário com suplementação proteica na seca
   - Cenário com confinamento estratégico
   - Cenário com intensificação sustentável (ILPF + aditivos)
   - Projeção de redução total alcançável

10) REFERÊNCIAS CIENTÍFICAS COMPLETAS:
    - IPCC 2006 Guidelines Vol. 4 (Chapter 10 & 11)
    - IPCC 2019 Refinement to 2006 Guidelines
    - NRC Nutrient Requirements of Beef Cattle (8th Ed. 2016)
    - Gerber, P.J. et al. (2013) FAO - Tackling Climate Change Through Livestock
    - Hristov, A.N. et al. (2015) J. Dairy Sci.
    - EMBRAPA Gado de Corte - Documentos Técnicos
    - CEPEA/ESALQ - Indicadores Econômicos

REGRAS: Incluir TODAS as fórmulas, tabelas detalhadas, metodologia IPCC 2019 Refinement completa, análise de sensibilidade, referências científicas com citações. Máximo 6 páginas.
${commonInstructions}`;
  };

  // Handler principal de cálculo
  const handleCalculate = async () => {
    if (loading) return;
    
    if (animals.length === 0 || animals.every(a => a.count <= 0)) {
      toast({
        title: "Dados insuficientes",
        description: "Adicione pelo menos uma categoria de animais.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setMitigationResult("");

    try {
      const result = calculateEmissions();
      setCalculationResult(result);

      if (result.warnings.length > 0) {
        toast({
          title: "Ajustes fisiológicos aplicados",
          description: "Alguns valores foram ajustados conforme limites IPCC 2019.",
        });
      }

      const prompt = generatePrompt(result);

      const res = await resilientInvoke("sustainability-handler", {
        question: prompt,
        isProfessional: userLevel !== "produtor",
        context: "Calculadora de Emissões de GEE - Metodologia IPCC Tier 2",
      });

      if (!res.ok) {
        toast({
          title: "Atenção",
          description: res.friendlyError || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setAiAnalysis(extractAnswer(res.data));

      toast({
        title: "Cálculo concluído",
        description: "Emissões calculadas com metodologia IPCC Tier 2.",
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

  // Simulação de mitigação
  const handleMitigationSimulation = async () => {
    if (!calculationResult || loadingMitigation) return;

    setLoadingMitigation(true);
    try {
      const prompt = `
DADOS ATUAIS DO SISTEMA:
- Emissão total: ${calculationResult.totalCO2eq.toFixed(2)} tCO₂eq/ano
- CH₄ entérico: ${calculationResult.ch4Enterico.toFixed(2)} tCO₂eq
- CH₄ dejetos: ${calculationResult.ch4Dejetos.toFixed(2)} tCO₂eq
- N₂O total: ${(calculationResult.n2oDireto + calculationResult.n2oIndireto).toFixed(2)} tCO₂eq
- Sistema: ${PRODUCTION_SYSTEMS.find(s => s.id === productionSystem)?.name}
- Total de animais: ${animals.reduce((sum, a) => sum + a.count, 0)} cabeças

SIMULE A IMPLEMENTAÇÃO DAS SEGUINTES PRÁTICAS MITIGADORAS:

1. ADITIVOS ALIMENTARES:
   - Taninos condensados: -8% CH₄ entérico
   - 3-NOP (Bovaer): -25% CH₄ entérico
   - Óleos essenciais: -5% CH₄ entérico
   - Nitrato de cálcio: -10% CH₄ entérico

2. MANEJO DE PASTAGEM:
   - Rotacionado intensivo (Voisin): -10% emissões
   - Recuperação de pastagem degradada: -15% por área

3. SISTEMAS INTEGRADOS:
   - ILPF: -15 a -25% emissões totais
   - IPF (Integração Pecuária-Floresta): -20%

4. TRATAMENTO DE DEJETOS:
   - Biodigestores: captura 70% CH₄ de dejetos
   - Compostagem: redução de emissões fugitivas

5. MELHORAMENTO GENÉTICO:
   - Seleção para eficiência alimentar: -5 a -10% CH₄

6. INTENSIFICAÇÃO ESTRATÉGICA:
   - Confinamento parcial (seca): reduz Ym para 3-3,5%
   - Suplementação proteica na seca: melhora conversão

FORNEÇA UM RELATÓRIO ESTRUTURADO COM:

1) CENÁRIO COM INTERVENÇÕES:
   - Nova emissão total estimada (tCO₂eq/ano)
   - Redução absoluta e percentual
   - Ranking das práticas por impacto
   - Combinações sinérgicas recomendadas

2) SIMULAÇÃO DE CRÉDITOS DE CARBONO:
   - Créditos potenciais gerados (tCO₂e evitados)
   - Valor estimado: US$ 5-15/tCO₂e (mercado voluntário)
   - Receita anual potencial em R$
   - Elegibilidade para programas:
     • Verra/VCS
     • Gold Standard
     • ABC+ (Plano Brasileiro)
     • Renovabio (se aplicável)

3) ANÁLISE CUSTO-BENEFÍCIO:
   - Investimento estimado por prática (R$/animal ou R$/ha)
   - Payback esperado (anos)
   - Viabilidade de implementação (Alta/Média/Baixa)
   - Cobenefícios (produtividade, sanidade, solo)

4) COMPARATIVO DE CENÁRIOS:
   | Cenário | Emissão Total | Redução | Investimento | Payback |
   - Atual
   - Otimizado baixo custo
   - Otimizado alta performance
   - Máxima mitigação

5) PLANO DE AÇÃO PRIORITÁRIO:
   CURTO PRAZO (0-6 meses):
   - Ações imediatas e de baixo investimento
   
   MÉDIO PRAZO (6-24 meses):
   - Implementação de sistemas e aditivos
   
   LONGO PRAZO (>24 meses):
   - Transformações estruturais (ILPF, biodigestores)

6) MONITORAMENTO E VERIFICAÇÃO:
   - Indicadores de acompanhamento
   - Frequência de medição
   - Documentação necessária para certificação

INSTRUÇÕES:
- Nível de detalhe: ${userLevel === "pesquisador" ? "MÁXIMO com referências e metodologias" : userLevel === "profissional" ? "TÉCNICO com cálculos" : "SIMPLIFICADO e prático"}
- NUNCA use hashtags, asteriscos ou markdown
- Use bullets com • ou -
- Tabelas com formato simples usando |

REFERÊNCIAS OBRIGATÓRIAS:
- IPCC 2019 Refinement
- Gerber et al. 2013 (FAO)
- EMBRAPA - Carne Carbono Neutro
- ABC+ / MAPA`;

      const res = await resilientInvoke("sustainability-handler", {
        question: prompt,
        isProfessional: true,
        context: "Simulação de mitigação de GEE - Créditos de Carbono",
      });

      if (!res.ok) {
        toast({
          title: "Atenção",
          description: res.friendlyError || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      setMitigationResult(extractAnswer(res.data));

      toast({
        title: "Simulação concluída",
        description: "Cenário de mitigação e créditos de carbono calculados.",
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Atenção",
        description: "Ocorreu um problema temporário. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingMitigation(false);
    }
  };

  // Adicionar categoria animal
  const addAnimalCategory = () => {
    setAnimals([...animals, { category: "novilhos", count: 0, weight: 350 }]);
  };

  // Remover categoria animal
  const removeAnimalCategory = (index: number) => {
    setAnimals(animals.filter((_, i) => i !== index));
  };

  // Atualizar categoria animal
  const updateAnimal = (index: number, field: keyof AnimalInput, value: string | number) => {
    const updated = [...animals];
    if (field === "category") {
      const cat = ANIMAL_CATEGORIES.find(c => c.id === value);
      updated[index] = { ...updated[index], category: value as string, weight: cat?.defaultWeight || updated[index].weight };
    } else {
      updated[index] = { ...updated[index], [field]: Number(value) };
    }
    setAnimals(updated);
  };

  // Dados para gráficos
  const emissionChartData = useMemo(() => {
    if (!calculationResult) return [];
    return [
      { name: "CH₄ Entérico", value: calculationResult.ch4Enterico, color: "#f97316" },
      { name: "CH₄ Dejetos", value: calculationResult.ch4Dejetos, color: "#fb923c" },
      { name: "N₂O Direto", value: calculationResult.n2oDireto, color: "#84cc16" },
      { name: "N₂O Indireto", value: calculationResult.n2oIndireto, color: "#a3e635" },
    ];
  }, [calculationResult]);

  // Copiar relatório
  const copyReport = () => {
    const fullReport = generateFullReport();
    navigator.clipboard.writeText(fullReport);
    toast({ title: "Copiado", description: "Relatório copiado para a área de transferência." });
  };

  // Gerar relatório completo para exportação
  const generateFullReport = () => {
    const totalAnimals = animals.reduce((sum, a) => sum + a.count, 0);
    const system = PRODUCTION_SYSTEMS.find(s => s.id === productionSystem);
    
    let report = `RELATÓRIO DE EMISSÕES DE GASES DE EFEITO ESTUFA
VetAgro Sustentável AI - Metodologia IPCC Tier 2
Data: ${new Date().toLocaleDateString('pt-BR')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IDENTIFICAÇÃO DO CASO:
• Sistema: ${system?.name}
• Localização: ${location || "Brasil"}
• Total de animais: ${totalAnimals} cabeças
• Área de pastagem: ${pastureArea} hectares
• Digestibilidade (DIVMS): ${divms}%

COMPOSIÇÃO DO REBANHO:
${animals.map(a => {
  const cat = ANIMAL_CATEGORIES.find(c => c.id === a.category);
  return `• ${cat?.name || a.category}: ${a.count} animais (${a.weight} kg)`;
}).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESULTADOS CALCULADOS (Tier 2 IPCC):
• Emissão TOTAL: ${calculationResult?.totalCO2eq.toFixed(2) || "N/A"} tCO₂eq/ano
• CH₄ entérico: ${calculationResult?.ch4Enterico.toFixed(2) || "N/A"} tCO₂eq
• CH₄ dejetos: ${calculationResult?.ch4Dejetos.toFixed(2) || "N/A"} tCO₂eq
• N₂O direto: ${calculationResult?.n2oDireto.toFixed(2) || "N/A"} tCO₂eq
• N₂O indireto: ${calculationResult?.n2oIndireto.toFixed(2) || "N/A"} tCO₂eq

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANÁLISE DETALHADA:

${aiAnalysis}

${mitigationResult ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SIMULAÇÃO DE MITIGAÇÃO:

${mitigationResult}
` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REFERÊNCIAS TÉCNICAS:
${references.map(ref => `• ${ref}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AVISO LEGAL:
Este relatório é gerado automaticamente pela suíte VetAgro Sustentável AI. Decisões de manejo devem ser confirmadas por profissional habilitado (Médico Veterinário, Zootecnista ou Engenheiro Agrônomo registrado no respectivo Conselho).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Documento gerado pela suíte VetAgro Sustentável AI
© VetAgro 2025 — www.vetagroai.com.br
`;
    return report;
  };

  // Download TXT
  const downloadTXT = () => {
    const report = generateFullReport();
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-gee-vetagro-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Download concluído", description: "Arquivo TXT baixado com sucesso." });
  };

  // Compartilhar
  const shareReport = async () => {
    const report = generateFullReport();
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Relatório de Emissões GEE - VetAgro AI",
          text: report.substring(0, 500) + "...",
        });
      } catch (err) {
        copyReport();
      }
    } else {
      copyReport();
    }
  };

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
            <p className="text-muted-foreground">Cálculo de emissões de CH₄ e N₂O de sistemas pecuários utilizando metodologia IPCC Tier 2</p>
          </div>
        </div>

        <ToolExplanatoryBlock
          description="Ferramenta especializada para quantificação de emissões de gases de efeito estufa (CH₄ e N₂O) em sistemas pecuários, seguindo metodologia IPCC Tier 2 com parâmetros ajustados para condições brasileiras."
          whatItDoes="Calcula emissões de metano entérico e de dejetos, óxido nitroso direto e indireto, convertendo para CO₂ equivalente com GWP-100."
          forWhom="Produtores rurais, consultores ambientais, pesquisadores e profissionais que precisam de inventários de GEE precisos."
          whenToUse="Para inventários ambientais, certificações de pegada de carbono, projetos de crédito de carbono e planejamento de mitigação."
          whatYouGet="Relatório completo com balanço de emissões, gráficos por categoria, análise por IA e simulações de estratégias de mitigação."
          features={[
            { icon: Cloud, label: "IPCC Tier 2" },
            { icon: Flame, label: "CH₄ e N₂O" },
            { icon: TrendingDown, label: "Simulação de Mitigação" },
            { icon: BarChart3, label: "Gráficos Interativos" },
          ]}
          variant="emerald"
        />

        {/* Badges de gases */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950 border-orange-300">
            <Flame className="h-3 w-3 mr-1 text-orange-500" /> CH₄ (Metano)
          </Badge>
          <Badge variant="outline" className="bg-lime-50 dark:bg-lime-950 border-lime-300">
            <Wind className="h-3 w-3 mr-1 text-lime-500" /> N₂O (Óxido Nitroso)
          </Badge>
          <Badge variant="outline" className="bg-slate-50 dark:bg-slate-950 border-slate-300">
            <Cloud className="h-3 w-3 mr-1 text-slate-500" /> CO₂ (Dióxido de Carbono)
          </Badge>
        </div>

        {/* Seletor de nível de usuário */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={userLevel === "produtor" ? "default" : "outline"}
            size="sm"
            onClick={() => setUserLevel("produtor")}
            className={userLevel === "produtor" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <User className="h-4 w-4 mr-1" /> Produtor Rural
          </Button>
          <Button
            variant={userLevel === "profissional" ? "default" : "outline"}
            size="sm"
            onClick={() => setUserLevel("profissional")}
            className={userLevel === "profissional" ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            <GraduationCap className="h-4 w-4 mr-1" /> Profissional
          </Button>
          <Button
            variant={userLevel === "pesquisador" ? "default" : "outline"}
            size="sm"
            onClick={() => setUserLevel("pesquisador")}
            className={userLevel === "pesquisador" ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            <FlaskConical className="h-4 w-4 mr-1" /> Pesquisador
          </Button>

          {/* Botão metodologia */}
          <Dialog open={showMethodology} onOpenChange={setShowMethodology}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <BookOpen className="h-4 w-4 mr-1" /> Ver Metodologia IPCC
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" /> Metodologia IPCC Tier 2
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Equações Principais</h3>
                    <div className="bg-muted p-3 rounded-lg font-mono text-xs space-y-2">
                      <p><strong>IMS:</strong> IMS = 2,3% × PV (modelo empírico)</p>
                      <p><strong>Energia Bruta:</strong> EB = IMS × 18,45 MJ</p>
                      <p><strong>Energia Digerida:</strong> DE = EB × DIVMS</p>
                      <p><strong>Energia Metabolizável:</strong> ME = DE × 0,82</p>
                      <p><strong>CH₄ Entérico:</strong> CH₄ = (Ym/100) × EB × 365 / 55,65</p>
                      <p><strong>Sólidos Voláteis:</strong> VS = IMS × (1 - DIVMS) × 0,92</p>
                      <p><strong>CH₄ Dejetos:</strong> CH₄ = VS × B₀ × MCF × 365</p>
                      <p><strong>N₂O Direto:</strong> N₂O = Nex × EF × (44/28)</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">Fatores de Emissão</h3>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-muted">
                          <th className="border p-2 text-left">Parâmetro</th>
                          <th className="border p-2 text-left">Valor</th>
                          <th className="border p-2 text-left">Unidade</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td className="border p-2">Ym (pasto tropical)</td><td className="border p-2">6,5</td><td className="border p-2">%</td></tr>
                        <tr><td className="border p-2">Ym (confinamento)</td><td className="border p-2">3,0-3,5</td><td className="border p-2">%</td></tr>
                        <tr><td className="border p-2">B₀ (corte)</td><td className="border p-2">0,10</td><td className="border p-2">kg CH₄/kg VS</td></tr>
                        <tr><td className="border p-2">MCF (pasto)</td><td className="border p-2">1,5</td><td className="border p-2">%</td></tr>
                        <tr><td className="border p-2">EF N₂O direto</td><td className="border p-2">0,02</td><td className="border p-2">kg N₂O-N/kg N</td></tr>
                        <tr><td className="border p-2">GWP CH₄ (AR6)</td><td className="border p-2">27,2</td><td className="border p-2">-</td></tr>
                        <tr><td className="border p-2">GWP N₂O (AR6)</td><td className="border p-2">273</td><td className="border p-2">-</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">Limites Fisiológicos</h3>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-muted">
                          <th className="border p-2 text-left">Parâmetro</th>
                          <th className="border p-2 text-left">Mínimo</th>
                          <th className="border p-2 text-left">Máximo</th>
                          <th className="border p-2 text-left">Unidade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(BIOLOGICAL_LIMITS).map(([key, limit]) => (
                          <tr key={key}>
                            <td className="border p-2">{limit.description || key}</td>
                            <td className="border p-2">{'min' in limit ? (limit as any).min : '-'}</td>
                            <td className="border p-2">{'max' in limit ? (limit as any).max : ('value' in limit ? (limit as any).value : '-')}</td>
                            <td className="border p-2">{'unit' in limit ? (limit as any).unit : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">Referências</h3>
                    <ul className="list-disc pl-4 space-y-1">
                      {references.map((ref, i) => (
                        <li key={i}>{ref}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Painel de Entrada */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-2 border-teal-200 dark:border-teal-800">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-green-50 dark:from-teal-950 dark:to-green-950">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-teal-600" />
                Dados do Rebanho
              </CardTitle>
              <CardDescription>
                Configure os parâmetros do seu sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Localização */}
              <div>
                <Label>Localização (opcional)</Label>
                <Input
                  placeholder="Ex: Roraima, Brasil"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              {/* Sistema de produção */}
              <div>
                <Label>Sistema de Produção</Label>
                <Select value={productionSystem} onValueChange={setProductionSystem}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCTION_SYSTEMS.map(sys => (
                      <SelectItem key={sys.id} value={sys.id}>
                        {sys.name} (Ym={sys.Ym}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Área e DIVMS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="flex items-center gap-1">
                    Área (ha)
                    <Tooltip>
                      <TooltipTrigger><HelpCircle className="h-3 w-3" /></TooltipTrigger>
                      <TooltipContent>Área total de pastagem em hectares</TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    type="number"
                    value={pastureArea}
                    onChange={(e) => setPastureArea(Number(e.target.value))}
                    min={1}
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1">
                    DIVMS (%)
                    <Tooltip>
                      <TooltipTrigger><HelpCircle className="h-3 w-3" /></TooltipTrigger>
                      <TooltipContent>Digestibilidade da matéria seca (45-70%)</TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    type="number"
                    value={divms}
                    onChange={(e) => setDivms(Number(e.target.value))}
                    min={45}
                    max={70}
                  />
                </div>
              </div>

              {/* Categorias animais */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Categorias Animais</Label>
                  <Button variant="outline" size="sm" onClick={addAnimalCategory}>
                    + Adicionar
                  </Button>
                </div>
                <div className="space-y-3">
                  {animals.map((animal, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Select
                          value={animal.category}
                          onValueChange={(v) => updateAnimal(index, "category", v)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ANIMAL_CATEGORIES.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {animals.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAnimalCategory(index)}
                            className="text-destructive"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Quantidade</Label>
                          <Input
                            type="number"
                            value={animal.count}
                            onChange={(e) => updateAnimal(index, "count", e.target.value)}
                            min={0}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Peso (kg)</Label>
                          <Input
                            type="number"
                            value={animal.weight}
                            onChange={(e) => updateAnimal(index, "weight", e.target.value)}
                            min={100}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observações adicionais */}
              <div>
                <Label>Observações (opcional)</Label>
                <Textarea
                  placeholder="Informações adicionais sobre o sistema..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <Button
                onClick={handleCalculate}
                disabled={loading}
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
                    <Calculator className="mr-2 h-5 w-5" />
                    Calcular Emissões (Tier 2)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Card de limites fisiológicos */}
          <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">Limites Fisiológicos Ativos</p>
                  <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                    VS: 2-8 kg/dia • IMS: 1,8-3,2% PV • Nex: 25-50 kg N/ano • DIVMS: 45-70%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Painel de Resultados */}
        <div className="lg:col-span-2 space-y-4">
          {/* Emissões totais */}
          {calculationResult && (
            <>
              <Card className="border-l-4 border-l-teal-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-teal-600" />
                    Emissões Totais — Tier 2 IPCC
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl font-bold text-teal-600">{calculationResult.totalCO2eq.toFixed(2)}</span>
                    <span className="text-xl text-muted-foreground">tCO₂eq/ano</span>
                  </div>
                  <Progress value={Math.min((calculationResult.totalCO2eq / 500) * 100, 100)} className="h-3 mb-2" />
                  
                  {/* Indicadores rápidos */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                    <div className="text-center p-2 bg-orange-50 dark:bg-orange-950 rounded">
                      <Flame className="h-4 w-4 mx-auto text-orange-500 mb-1" />
                      <p className="text-xs text-muted-foreground">CH₄ Entérico</p>
                      <p className="font-semibold text-sm">{calculationResult.ch4Enterico.toFixed(1)} t</p>
                    </div>
                    <div className="text-center p-2 bg-orange-50/50 dark:bg-orange-950/50 rounded">
                      <Flame className="h-4 w-4 mx-auto text-orange-400 mb-1" />
                      <p className="text-xs text-muted-foreground">CH₄ Dejetos</p>
                      <p className="font-semibold text-sm">{calculationResult.ch4Dejetos.toFixed(1)} t</p>
                    </div>
                    <div className="text-center p-2 bg-lime-50 dark:bg-lime-950 rounded">
                      <Wind className="h-4 w-4 mx-auto text-lime-500 mb-1" />
                      <p className="text-xs text-muted-foreground">N₂O Direto</p>
                      <p className="font-semibold text-sm">{calculationResult.n2oDireto.toFixed(1)} t</p>
                    </div>
                    <div className="text-center p-2 bg-lime-50/50 dark:bg-lime-950/50 rounded">
                      <Wind className="h-4 w-4 mx-auto text-lime-400 mb-1" />
                      <p className="text-xs text-muted-foreground">N₂O Indireto</p>
                      <p className="font-semibold text-sm">{calculationResult.n2oIndireto.toFixed(1)} t</p>
                    </div>
                  </div>

                  {/* Avisos de ajustes */}
                  {calculationResult.warnings.length > 0 && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> Ajustes fisiológicos aplicados:
                      </p>
                      <ul className="text-xs text-amber-700 dark:text-amber-300 mt-1 space-y-1">
                        {calculationResult.warnings.slice(0, 3).map((w, i) => (
                          <li key={i}>• {w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Gráficos */}
              {emissionChartData.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Distribuição por Fonte</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={emissionChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={70}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {emissionChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <RechartsTooltip formatter={(value: number) => `${value.toFixed(2)} tCO₂eq`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2 justify-center">
                        {emissionChartData.map((entry, idx) => (
                          <Badge key={idx} style={{ backgroundColor: entry.color }} className="text-white text-xs">
                            {entry.name}: {entry.value.toFixed(1)}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Comparativo por Gás</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={emissionChartData} layout="vertical">
                            <XAxis type="number" tickFormatter={(v) => `${v.toFixed(0)}t`} />
                            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 9 }} />
                            <RechartsTooltip formatter={(value: number) => `${value.toFixed(2)} tCO₂eq`} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                              {emissionChartData.map((entry, index) => (
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

              {/* Detalhes técnicos (para profissional/pesquisador) */}
              {userLevel !== "produtor" && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Info className="h-4 w-4" /> Parâmetros Técnicos Calculados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs">
                      <div className="p-2 bg-muted rounded">
                        <p className="text-muted-foreground">IMS</p>
                        <p className="font-semibold">{calculationResult.details.IMS.toFixed(2)} kg/dia</p>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <p className="text-muted-foreground">EB</p>
                        <p className="font-semibold">{calculationResult.details.EB.toFixed(1)} MJ/dia</p>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <p className="text-muted-foreground">DE</p>
                        <p className="font-semibold">{calculationResult.details.DE.toFixed(1)} MJ/dia</p>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <p className="text-muted-foreground">ME</p>
                        <p className="font-semibold">{calculationResult.details.ME.toFixed(1)} MJ/dia</p>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <p className="text-muted-foreground">VS</p>
                        <p className="font-semibold">{calculationResult.details.VS.toFixed(2)} kg/dia</p>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <p className="text-muted-foreground">Nex total</p>
                        <p className="font-semibold">{calculationResult.details.Nex.toFixed(0)} kg N/ano</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Análise IA */}
          {aiAnalysis && (
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    Relatório — Nível {userLevel === "produtor" ? "Produtor" : userLevel === "profissional" ? "Profissional" : "Pesquisador"}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleMitigationSimulation}
                      disabled={loadingMitigation || loading}
                      variant="outline"
                      size="sm"
                      className="border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950"
                    >
                      {loadingMitigation ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Simular Mitigação
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <MarkdownTableRenderer 
                  content={aiAnalysis}
                  className="bg-gradient-to-br from-teal-50/50 to-green-50/50 dark:from-teal-950/30 dark:to-green-950/30 p-6 rounded-xl border border-teal-200 dark:border-teal-800 text-sm leading-relaxed"
                />
                
                {/* Action Buttons - Padrão Global */}
                <div className="pt-4 border-t">
                  <ResponseActionButtons
                    content={generateFullReport()}
                    title="Relatório de Emissões de GEE"
                    toolName="Calculadora Integrada de Emissões de GEE"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resultado de mitigação */}
          {mitigationResult && (
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TreePine className="h-5 w-5 text-purple-600" />
                  Simulação de Mitigação e Créditos de Carbono
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MarkdownTableRenderer 
                  content={mitigationResult}
                  className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/30 dark:to-pink-950/30 p-6 rounded-xl border border-purple-200 dark:border-purple-800 text-sm leading-relaxed"
                />
              </CardContent>
            </Card>
          )}

          {/* Estado vazio */}
          {!calculationResult && (
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <TreePine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Calcule sua Pegada de Carbono
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Configure os dados do rebanho para receber uma análise completa de emissões com metodologia IPCC Tier 2, limites fisiológicos validados e relatório adaptado ao seu perfil.
                </p>
                <div className="flex justify-center gap-2 mt-4">
                  <Badge variant="outline"><CheckCircle className="h-3 w-3 mr-1" /> Tier 2 IPCC</Badge>
                  <Badge variant="outline"><CheckCircle className="h-3 w-3 mr-1" /> Limites Fisiológicos</Badge>
                  <Badge variant="outline"><CheckCircle className="h-3 w-3 mr-1" /> GWP-100 AR6</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalculadoraGEE;
