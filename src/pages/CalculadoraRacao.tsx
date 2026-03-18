import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, Loader2 } from "lucide-react";
import { resilientInvoke, extractAnswer } from "@/lib/resilientInvoke";
import { supabase } from "@/integrations/supabase/client";
import { AuthDialog } from "@/components/AuthDialog";
import { ResponseActionButtons } from "@/components/ResponseActionButtons";
import { MarkdownTableRenderer } from "@/components/MarkdownTableRenderer";
import { useToast } from "@/hooks/use-toast";

import { cleanTextForDisplay } from "@/lib/textUtils";
import { UFS } from "@/hooks/useCrmvValidation";
const CalculadoraRacao = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isProfessional, setIsProfessional] = useState<string>("");
  const [result, setResult] = useState("");

  // Campos profissionais
  const [professionalName, setProfessionalName] = useState("");
  const [councilNumber, setCouncilNumber] = useState("");
  const [councilType, setCouncilType] = useState("CRMV");
  const [professionalUF, setProfessionalUF] = useState("");

  const [species, setSpecies] = useState("");
  const [purpose, setPurpose] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [animalCount, setAnimalCount] = useState("");

  const councilTypes = ["CRMV", "CRZ", "CREA", "Outro"];

  const speciesOptions = [
    "Bovino de Corte",
    "Bovino de Leite",
    "Suíno",
    "Equino",
    "Aves de Corte",
    "Aves de Postura",
    "Ovino",
    "Caprino",
    "Piscicultura",
    "Outro"
  ];

  const purposeOptions = [
    "Crescimento",
    "Manutenção",
    "Engorda/Terminação",
    "Lactação",
    "Gestação",
    "Reprodução",
    "Alevino/Juvenil",
    "Postura"
  ];

  const handleCalculate = async () => {
    if (!isProfessional) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe se você é um profissional da área.",
        variant: "destructive",
      });
      return;
    }

    // Validação profissional
    if (isProfessional === "sim") {
      if (!professionalName.trim()) {
        toast({
          title: "Nome obrigatório",
          description: "Informe o nome do profissional responsável.",
          variant: "destructive",
        });
        return;
      }
      if (!councilNumber.trim() || !professionalUF) {
        toast({
          title: "Registro profissional obrigatório",
          description: "Informe o número do conselho e o estado (UF).",
          variant: "destructive",
        });
        return;
      }
    }

    if (!species || !purpose || !weight) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha espécie, finalidade e peso do animal.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const professionalInfo = isProfessional === "sim" 
        ? `\n\nPROFISSIONAL RESPONSÁVEL:\n• Nome: ${professionalName}\n• Registro: ${councilType} ${councilNumber} - ${professionalUF}`
        : "";

      const res = await resilientInvoke("nutrition-handler", {
        tool: "calculadora-racao",
        question: `DADOS PARA FORMULAÇÃO:
${professionalInfo}

ANIMAL:
• Espécie: ${species}
• Categoria/Finalidade: ${purpose}
• Peso corporal: ${weight}
• Idade: ${age || "Não informada"}
• Número de animais: ${animalCount || "1"}
• Ingredientes disponíveis: ${ingredients || "Não informados (considere ingredientes comuns do mercado)"}`,
        isProfessional: isProfessional === "sim",
        professionalName: professionalName,
        councilNumber: `${councilType} ${councilNumber}`,
        councilUF: professionalUF,
        context: "Formulação de ração animal balanceada",
      });

      if (!res.ok) {
        toast({
          title: "Atenção",
          description: res.friendlyError || "Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      const data = res.data;

      // Limpar formatação usando utilitário + normalização específica desta ferramenta
      const cleanResult = cleanTextForDisplay(data.answer);
      
      // CRITICAL: Normalização agressiva para corrigir problemas de formatação
      let normalized = cleanResult;

      // 0) Remover caracteres invisíveis que quebram palavras e normalizar separadores de linha
      normalized = normalized
        .replace(/[\u00ad\u200b\u200c\u200d\ufeff]/g, "") // soft hyphen / zero-width
        .replace(/[\u2028\u2029]/g, "\n")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");
      
      // 0.1) CRÍTICO: Separar seções que ficaram dentro da última célula da tabela
      // Padrão: "| Dieta total\t4) DISTRIBUIÇÃO" -> "| Dieta total |\n\n4) DISTRIBUIÇÃO"
      normalized = normalized.replace(/(\|\s*[^|]*?)\s*(\d+\)\s*[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, '$1 |\n\n$2');
      
      // 0.2) Garantir que a linha TOTAL termine corretamente
      normalized = normalized.replace(/(TOTAL[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|\n]*)\s*(\d+\))/gi, '$1 |\n\n$2');

      // 1) Corrigir TABELA em linha única: adicionar quebras de linha entre linhas da tabela
      normalized = normalized.replace(/\|\s*\|\s*(?=[A-Za-zÁÉÍÓÚÂÊÔÃÕÇ0-9])/g, '|\n| ');
      normalized = normalized.replace(/(\|[-:\s]+\|)\s*(?=\|)/g, '$1\n');
      
      // 2) Corrigir título da tabela colado: "TABELA...DIETA| Ing" -> quebra antes de |
      normalized = normalized.replace(/(TABELA DE FORMULAÇÃO DA DIETA)\s*\|/gi, '$1\n\n|');
      
      // 3) Corrigir cabeçalho quando o modelo omite o símbolo %
      normalized = normalized.replace(/\|\s*da dieta\s*\|/gi, '| % da dieta |');
      
      // 4) Corrigir palavras MAIÚSCULAS quebradas (DISTRIBUI\nÇÃO -> DISTRIBUIÇÃO, ANALIS\nEs -> ANÁLISES)
      // Executa múltiplas vezes para pegar casos consecutivos (inclui \r e separadores Unicode)
      for (let i = 0; i < 5; i++) {
        normalized = normalized.replace(
          /([A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,})\s*[\r\n\u2028\u2029]+\s*([A-ZÁÉÍÓÚÂÊÔÃÕÇa-záéíóúâêôãõç]{2,})/g,
          '$1$2'
        );
      }
      
      // 4.1) Corrigir caso específico "ANALIS\nEs" -> "Análises"
      normalized = normalized.replace(/ANALIS\s*[\r\n\u2028\u2029]?\s*Es/gi, 'Análises');
      
      // 5) Corrigir palavras minúsculas quebradas no meio (manejo e\nfornecimento)
      normalized = normalized.replace(/([a-záéíóúâêôãõç])\s*[\r\n\u2028\u2029]+\s*([a-záéíóúâêôãõç])/g, '$1 $2');
      
      // 6) Corrigir "4) DISTRIBUI\nÇÃO" -> "4) DISTRIBUIÇÃO"
      normalized = normalized.replace(
        /(\d+\)\s*)([A-ZÁÉÍÓÚÂÊÔÃÕÇ]+)\s*[\r\n\u2028\u2029]+\s*([A-ZÁÉÍÓÚÂÊÔÃÕÇ]+)/g,
        '$1$2$3'
      );
      
      // 7) Corrigir título seguido de texto sem quebra (ex: "ALIMENTAÇÃOA alimentação")
      normalized = normalized.replace(/([A-ZÁÉÍÓÚÂÊÔÃÕÇ]{4,})([A-Z][a-z])/g, '$1\n\n$2');
      
      // 8) Corrigir "5)\n\nJUSTIFICATIVA" -> "5) JUSTIFICATIVA" (inclui \r e separadores Unicode)
      normalized = normalized.replace(/(\d+\))\s*[\r\n\u2028\u2029]+\s*([A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, '$1 $2');
      
      // 9) Corrigir bullet sozinho em linha "•\n\nTEXTO" -> "• Texto" (mesmo se vier com quebra após o bullet)
      normalized = normalized.replace(/•\s*[\r\n\u2028\u2029]+\s*/g, '• ');

      // 10) Converter palavras MAIÚSCULAS no meio do texto para minúsculas (exceto após bullets)
      const uppercaseWordsInText = ['MONITORAMENTO', 'ANALISE', 'ANÁLISE', 'RESULTADOS', 'RELATORIO', 'RELATÓRIO', 'ANÁLISES'];
      uppercaseWordsInText.forEach(word => {
        const lowercase = word.charAt(0) + word.slice(1).toLowerCase();
        // Só converte se não estiver no início de linha ou após ")" ou após bullet
        normalized = normalized.replace(new RegExp(`(?<!^|\\n|\\d\\)\\s|•\\s)${word}`, 'g'), lowercase);
      });
      
      // 11) Remove travessões/hífens soltos no fim de linhas
      normalized = normalized.replace(/[–-]\s*$/gm, '');
      
      // 12) Remover travessão solto antes de "Data" e padronizar como bullet
      normalized = normalized.replace(/\s*-\s*(Data da an[aá]lise:)/gi, '\n• $1');
      
      // 13) Garantir espaço após bullets e quebra de linha antes
      normalized = normalized.replace(/([^\n])•\s*/g, '$1\n• ');
      normalized = normalized.replace(/\s+•\s*/g, '\n• ');
      
      // 14) Remover linhas com apenas hífen/travessão
      normalized = normalized.replace(/^\s*[–-]\s*$/gm, '');
      
      // 15) Garantir quebra de linha entre seções numeradas coladas
      // Ex: "...contaminação.5) JUSTIFICATIVA" -> "...contaminação.\n\n5) JUSTIFICATIVA"
      normalized = normalized.replace(/([.!?])\s*(\d+\)\s*[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, '$1\n\n$2');
      
      // 16) Limpar múltiplas quebras de linha
      normalized = normalized.replace(/\n{3,}/g, '\n\n').trim();

      setResult(normalized);
      toast({
        title: "Formulação calculada",
        description: "A ração foi balanceada com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro ao calcular",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Calculator className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Calculadora de Ração Inteligente
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Formule rações balanceadas conforme espécie, categoria e objetivo produtivo
            </p>
          </div>
        </div>

        {/* Bloco Explicativo Padronizado */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed mb-4">
            Ferramenta de formulação de rações balanceadas para diferentes espécies e objetivos produtivos. Calcula percentuais de inclusão, composição nutricional e orientações de fornecimento com base em ingredientes disponíveis.
          </p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <p className="font-medium text-sm text-foreground mb-1">O que faz</p>
              <p className="text-xs text-muted-foreground">Formula rações balanceadas com tabela de inclusão e composição nutricional</p>
            </div>
            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <p className="font-medium text-sm text-foreground mb-1">Para quem é</p>
              <p className="text-xs text-muted-foreground">Médicos Veterinários, Zootecnistas e produtores rurais</p>
            </div>
            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <p className="font-medium text-sm text-foreground mb-1">Quando usar</p>
              <p className="text-xs text-muted-foreground">Ao formular dietas para crescimento, engorda, lactação ou manutenção</p>
            </div>
            <div className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg">
              <p className="font-medium text-sm text-foreground mb-1">O que você recebe</p>
              <p className="text-xs text-muted-foreground">Tabela de formulação, composição nutricional e orientações de fornecimento</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Identificação Profissional</CardTitle>
            <CardDescription>
              Informe se você é um profissional da área
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={isProfessional} onValueChange={setIsProfessional}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="prof-sim" />
                <Label htmlFor="prof-sim">Sou profissional (Veterinário, Zootecnista)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="prof-nao" />
                <Label htmlFor="prof-nao">Não sou profissional da área</Label>
              </div>
            </RadioGroup>

            {isProfessional === "sim" && (
              <div className="mt-4 p-4 border border-border rounded-lg bg-muted/30 space-y-4">
                <p className="text-sm text-muted-foreground font-medium">
                  Dados do profissional responsável (obrigatórios)
                </p>
                <div className="space-y-2">
                  <Label htmlFor="professionalName">Nome completo *</Label>
                  <Input
                    id="professionalName"
                    placeholder="Ex: Dr. João da Silva"
                    value={professionalName}
                    onChange={(e) => setProfessionalName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="councilType">Conselho *</Label>
                    <Select value={councilType} onValueChange={setCouncilType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {councilTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="councilNumber">Número *</Label>
                    <Input
                      id="councilNumber"
                      placeholder="Ex: 12345"
                      value={councilNumber}
                      onChange={(e) => setCouncilNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="professionalUF">UF *</Label>
                    <Select value={professionalUF} onValueChange={setProfessionalUF}>
                      <SelectTrigger>
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {UFS.map((uf) => (
                          <SelectItem key={uf} value={uf}>
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do Animal</CardTitle>
            <CardDescription>
              Informações para formulação da ração
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="species">Espécie *</Label>
                <Select value={species} onValueChange={setSpecies}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a espécie" />
                  </SelectTrigger>
                  <SelectContent>
                    {speciesOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Finalidade *</Label>
                <Select value={purpose} onValueChange={setPurpose}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a finalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {purposeOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Peso Médio *</Label>
                <Input
                  id="weight"
                  placeholder="Ex: 450 kg"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Idade</Label>
                <Input
                  id="age"
                  placeholder="Ex: 18 meses"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="animalCount">Nº de Animais</Label>
                <Input
                  id="animalCount"
                  placeholder="Ex: 50"
                  value={animalCount}
                  onChange={(e) => setAnimalCount(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ingredientes Disponíveis</CardTitle>
            <CardDescription>
              Liste os ingredientes que você tem disponível (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="ingredients"
              placeholder="Ex: Farelo de soja, milho moído, sal mineral, ureia, farelo de trigo..."
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        <Button
          onClick={handleCalculate}
          disabled={loading}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Calculando formulação...
            </>
          ) : (
            <>
              <Calculator className="mr-2 h-5 w-5" />
              Calcular Formulação
            </>
          )}
        </Button>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Formulação Calculada</CardTitle>
              <CardDescription>
                Relatório técnico orientativo com tabela de formulação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bloco contínuo com rolagem da página - não usar scroll interno */}
              <div className="text-foreground leading-relaxed">
                <MarkdownTableRenderer content={result} preprocess={false} />
              </div>
              
              {/* Botões Padrão Global: Copiar + Compartilhar */}
              <div className="pt-4 border-t">
                <ResponseActionButtons
                  content={result}
                  title="Formulação de Ração"
                  toolName="Calculadora de Ração Inteligente"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CalculadoraRacao;