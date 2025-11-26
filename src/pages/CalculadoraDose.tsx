import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Calculator, Loader2, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ActiveIngredient {
  name: string;
  quantity: string;
}

const CalculadoraDose = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isProfessional, setIsProfessional] = useState<string>("");
  const [isManipulated, setIsManipulated] = useState(false);
  const [calculation, setCalculation] = useState("");
  const [activeIngredients, setActiveIngredients] = useState<ActiveIngredient[]>([
    { name: "", quantity: "" }
  ]);
  const [result, setResult] = useState("");

  const addIngredient = () => {
    setActiveIngredients([...activeIngredients, { name: "", quantity: "" }]);
  };

  const removeIngredient = (index: number) => {
    const newIngredients = activeIngredients.filter((_, i) => i !== index);
    setActiveIngredients(newIngredients);
  };

  const updateIngredient = (index: number, field: 'name' | 'quantity', value: string) => {
    const newIngredients = [...activeIngredients];
    newIngredients[index][field] = value;
    setActiveIngredients(newIngredients);
  };

  const handleCalculate = async () => {
    if (!isProfessional) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe se você é um profissional da área.",
        variant: "destructive",
      });
      return;
    }

    if (isManipulated) {
      const hasEmptyFields = activeIngredients.some(ing => !ing.name || !ing.quantity);
      if (hasEmptyFields) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os princípios ativos e quantidades.",
          variant: "destructive",
        });
        return;
      }
    } else if (!calculation.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Descreva o cálculo de dose necessário.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let questionText = calculation;
      
      if (isManipulated) {
        questionText = `Calcule a dosagem para um medicamento manipulado com os seguintes princípios ativos:\n\n`;
        activeIngredients.forEach((ing, index) => {
          questionText += `${index + 1}. ${ing.name}: ${ing.quantity}\n`;
        });
        questionText += `\n${calculation}`;
      }

      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          question: questionText,
          isProfessional: isProfessional === "sim",
          context: "Cálculo de dosagem veterinária (oral ou injetável)",
        },
      });

      if (error) throw error;

      setResult(data.answer);
      toast({
        title: "Cálculo realizado!",
        description: "A dosagem foi calculada com sucesso.",
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
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Calculator className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Calculadora de Dose Veterinária Inteligente</h1>
            <p className="text-muted-foreground">Calcule doses precisas de medicamentos (oral e injetável)</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Identificação</CardTitle>
            <CardDescription>
              Informe se você é um profissional da área veterinária
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={isProfessional} onValueChange={setIsProfessional}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="prof-sim" />
                <Label htmlFor="prof-sim">Sou profissional da área veterinária</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="prof-nao" />
                <Label htmlFor="prof-nao">Não sou profissional da área</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipo de Medicamento</CardTitle>
            <CardDescription>
              O medicamento é manipulado ou comercial?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="manipulated"
                checked={isManipulated}
                onChange={(e) => setIsManipulated(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="manipulated">Medicamento Manipulado (com múltiplos princípios ativos)</Label>
            </div>
          </CardContent>
        </Card>

        {isManipulated && (
          <Card>
            <CardHeader>
              <CardTitle>Princípios Ativos</CardTitle>
              <CardDescription>
                Liste os princípios ativos e suas quantidades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeIngredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`name-${index}`}>Princípio Ativo</Label>
                    <Input
                      id={`name-${index}`}
                      placeholder="Ex: Dipirona"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`quantity-${index}`}>Quantidade</Label>
                    <Input
                      id={`quantity-${index}`}
                      placeholder="Ex: 500mg"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                    />
                  </div>
                  {activeIngredients.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeIngredient(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addIngredient}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Princípio Ativo
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Dados para Cálculo</CardTitle>
            <CardDescription>
              Descreva o animal, peso e necessidade de dosagem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="calculation">Descrição do Cálculo *</Label>
                <Textarea
                  id="calculation"
                  placeholder="Ex: Preciso calcular a dose para um cão de 15kg, administração oral, BID..."
                  value={calculation}
                  onChange={(e) => setCalculation(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
            </div>
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
              Calculando...
            </>
          ) : (
            <>
              <Calculator className="mr-2 h-5 w-5" />
              Calcular Dose
            </>
          )}
        </Button>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado do Cálculo</CardTitle>
              <CardDescription>
                Revise cuidadosamente antes de aplicar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
                  {result}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CalculadoraDose;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Calculator className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Calculadora de Dose Veterinária Inteligente</h1>
            <p className="text-muted-foreground">Calcule doses precisas de medicamentos (oral e injetável)</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Identificação</CardTitle>
            <CardDescription>
              Informe se você é um profissional da área veterinária
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={isProfessional} onValueChange={setIsProfessional}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="prof-sim" />
                <Label htmlFor="prof-sim">Sou profissional da área veterinária</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="prof-nao" />
                <Label htmlFor="prof-nao">Não sou profissional da área</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados para Cálculo</CardTitle>
            <CardDescription>
              Descreva o animal, medicamento e necessidade de dosagem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="calculation">Descrição do Cálculo *</Label>
                <Textarea
                  id="calculation"
                  placeholder="Ex: Preciso calcular a dose de amoxicilina para um cão de 15kg, administração oral, concentração de 50mg/ml..."
                  value={calculation}
                  onChange={(e) => setCalculation(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
            </div>
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
              Calculando...
            </>
          ) : (
            <>
              <Calculator className="mr-2 h-5 w-5" />
              Calcular Dose
            </>
          )}
        </Button>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado do Cálculo</CardTitle>
              <CardDescription>
                Revise cuidadosamente antes de aplicar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
                  {result}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CalculadoraDose;
