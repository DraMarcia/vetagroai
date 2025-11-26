import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Calculator, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CalculadoraRacao = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isProfessional, setIsProfessional] = useState<string>("");
  const [formulation, setFormulation] = useState("");
  const [result, setResult] = useState("");

  const [species, setSpecies] = useState("");
  const [purpose, setPurpose] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [ingredients, setIngredients] = useState("");

  const handleCalculate = async () => {
    if (!isProfessional) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe se você é um profissional da área.",
        variant: "destructive",
      });
      return;
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
      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          question: `Calcule uma formulação de ração balanceada com base nos seguintes dados:

Espécie: ${species}
Finalidade: ${purpose}
Peso: ${weight}
Idade: ${age || 'Não informada'}
Ingredientes disponíveis: ${ingredients || 'Ingredientes comuns disponíveis no mercado'}

Forneça:
1. Cálculo detalhado das quantidades de cada ingrediente
2. Composição nutricional final
3. Instruções de preparo e fornecimento
4. Considerações importantes`,
          isProfessional: isProfessional === "sim",
          context: "Formulação de ração animal balanceada",
        },
      });

      if (error) throw error;

      setResult(data.answer);
      toast({
        title: "Formulação calculada!",
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
            <h1 className="text-3xl font-bold text-foreground">Calculadora de Ração Animal Inteligente</h1>
            <p className="text-muted-foreground">Formule rações balanceadas conforme espécie e objetivo produtivo</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Identificação</CardTitle>
            <CardDescription>
              Informe se você é um profissional da área
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={isProfessional} onValueChange={setIsProfessional}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="prof-sim" />
                <Label htmlFor="prof-sim">Sou profissional da área (veterinário, zootecnista)</Label>
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
            <CardTitle>Dados do Animal</CardTitle>
            <CardDescription>
              Informações básicas para formulação da ração
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="species">Espécie *</Label>
              <Input
                id="species"
                placeholder="Ex: Bovino, Suíno, Equino, Aves, Piscicultura"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="purpose">Finalidade *</Label>
              <Input
                id="purpose"
                placeholder="Ex: Crescimento, Manutenção, Engorda, Alevino, Poedeira, Corte"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">Peso *</Label>
                <Input
                  id="weight"
                  placeholder="Ex: 450kg"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="age">Idade</Label>
                <Input
                  id="age"
                  placeholder="Ex: 18 meses"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ingredientes Disponíveis</CardTitle>
            <CardDescription>
              Liste os ingredientes que você tem disponível (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="ingredients">Ingredientes</Label>
              <Textarea
                id="ingredients"
                placeholder="Ex: Farelo de soja, milho moído, sal mineral, ureia..."
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                className="min-h-[100px]"
              />
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
              Formulando...
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
              <CardTitle>Formulação Calculada</CardTitle>
              <CardDescription>
                Revise os ingredientes e proporções sugeridos
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

export default CalculadoraRacao;
