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
import { ResponseActionButtons } from "@/components/ResponseActionButtons";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cleanTextForDisplay } from "@/lib/textUtils";
import { UFS } from "@/hooks/useCrmvValidation";

const CalculadoraRacao = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isProfessional, setIsProfessional] = useState<string>("");
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

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

      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          tool: "calculadora-racao",
          question: `Formule uma ração balanceada com base nos seguintes dados:
${professionalInfo}

DADOS DO ANIMAL:
• Espécie: ${species}
• Finalidade: ${purpose}
• Peso médio: ${weight}
• Idade: ${age || 'Não informada'}
• Número de animais: ${animalCount || '1'}
• Ingredientes disponíveis: ${ingredients || 'Ingredientes comuns disponíveis no mercado'}

INSTRUÇÕES DE FORMATAÇÃO:
1. Apresente a formulação em formato de TABELA com colunas: Ingrediente | Quantidade (kg) | Proporção (%)
2. Use apenas marcadores tradicionais (• ou -) nas listas
3. NÃO use asteriscos, hashtags ou símbolos estranhos
4. Organize a resposta em seções claras: Formulação, Composição Nutricional, Preparo, Observações
5. Inclua referências técnicas no final`,
          isProfessional: isProfessional === "sim",
          professionalName: professionalName,
          councilNumber: `${councilType} ${councilNumber}`,
          councilUF: professionalUF,
          context: "Formulação de ração animal balanceada",
        },
      });

      if (error) throw error;

      // Limpar formatação usando utilitário
      const cleanResult = cleanTextForDisplay(data.answer);
      
      setResult(cleanResult);
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

  const handleCopyReport = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast({
      title: "Copiado!",
      description: "Relatório copiado para a área de transferência.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Função para renderizar resultado com tabelas formatadas
  const renderResult = () => {
    if (!result) return null;

    // Detectar e formatar tabelas no texto
    const lines = result.split('\n');
    const elements: React.ReactNode[] = [];
    let tableLines: string[] = [];
    let inTable = false;

    lines.forEach((line, index) => {
      // Detectar linha de tabela (contém | e não é separador)
      const isTableLine = line.includes('|') && !line.match(/^\s*\|?[\s-|]+\|?\s*$/);
      const isSeparator = line.match(/^\s*\|?[\s-|]+\|?\s*$/);

      if (isTableLine || isSeparator) {
        if (!inTable) inTable = true;
        if (!isSeparator) tableLines.push(line);
      } else {
        // Se saímos de uma tabela, renderizar
        if (inTable && tableLines.length > 0) {
          elements.push(
            <div key={`table-${index}`} className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    {tableLines[0].split('|').filter(cell => cell.trim()).map((cell, i) => (
                      <th key={i} className="border border-border px-4 py-2 text-left font-semibold text-sm">
                        {cell.trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableLines.slice(1).map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                      {row.split('|').filter(cell => cell.trim()).map((cell, cellIndex) => (
                        <td key={cellIndex} className="border border-border px-4 py-2 text-sm">
                          {cell.trim()}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          tableLines = [];
          inTable = false;
        }

        // Renderizar linha normal
        if (line.trim()) {
          const isHeading = line.match(/^[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s]+:?\s*$/);
          if (isHeading) {
            elements.push(
              <h3 key={index} className="font-semibold text-primary mt-4 mb-2">
                {line.trim()}
              </h3>
            );
          } else {
            elements.push(
              <p key={index} className="text-sm text-foreground mb-1">
                {line}
              </p>
            );
          }
        }
      }
    });

    // Renderizar tabela restante se houver
    if (tableLines.length > 0) {
      elements.push(
        <div key="final-table" className="overflow-x-auto my-4">
          <table className="min-w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                {tableLines[0].split('|').filter(cell => cell.trim()).map((cell, i) => (
                  <th key={i} className="border border-border px-4 py-2 text-left font-semibold text-sm">
                    {cell.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableLines.slice(1).map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                  {row.split('|').filter(cell => cell.trim()).map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-border px-4 py-2 text-sm">
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return elements;
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
              Formule rações balanceadas conforme espécie e objetivo produtivo
            </p>
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
          disabled={loading || !isProfessional}
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
                Revise os ingredientes e proporções
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="prose prose-sm max-w-none"
                style={{ textAlign: 'justify', textJustify: 'inter-word' }}
              >
                {renderResult()}
              </div>
              
              {/* Action Buttons - Padrão Global */}
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