import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ReportExporter } from "@/components/ReportExporter";

const Dicionario = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [medication, setMedication] = useState("");
  const [result, setResult] = useState("");

  const handleSearch = async () => {
    if (!medication.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite o nome do medicamento, princípio ativo ou nome comercial.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          question: `Forneça informações completas e técnicas sobre: ${medication}

Inclua:
1. Nome(s) comercial(is)
2. Princípio(s) ativo(s)
3. Concentrações disponíveis
4. Indicações terapêuticas
5. Posologia recomendada
6. Contraindicações
7. Interações medicamentosas
8. Efeitos adversos
9. Precauções de uso
10. Referências bibliográficas

Formate a resposta de forma técnica e estruturada.`,
          isProfessional: true,
          context: "Consulta de dicionário veterinário",
        },
      });

      if (error) throw error;

      setResult(data.answer);
      toast({
        title: "Consulta realizada!",
        description: "Informações encontradas com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro ao consultar",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const dicionarioReferences = [
    "Merck Veterinary Manual",
    "MAPA - Ministério da Agricultura, Pecuária e Abastecimento",
    "ANVISA - Agência Nacional de Vigilância Sanitária",
    "USP - Farmacopeia Americana",
    "PubMed - National Library of Medicine"
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dicionário Veterinário Rápido</h1>
            <p className="text-muted-foreground">Consulte princípios ativos, nomes comerciais e indicações</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Buscar Medicamento</CardTitle>
            <CardDescription>
              Digite o nome do medicamento, princípio ativo ou nome comercial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="medication">Nome do Medicamento *</Label>
              <Input
                id="medication"
                placeholder="Ex: Amoxicilina, Rimadyl, Ivermectina..."
                value={medication}
                onChange={(e) => setMedication(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSearch}
          disabled={loading}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Consultando...
            </>
          ) : (
            <>
              <BookOpen className="mr-2 h-5 w-5" />
              Consultar
            </>
          )}
        </Button>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Informações do Medicamento</CardTitle>
              <CardDescription>
                Dados técnicos e referências
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
                  {result}
                </div>
              </div>
              <ReportExporter
                title={`Dicionário Veterinário - ${medication}`}
                content={result}
                toolName="Dicionário Veterinário VetAgro IA"
                references={dicionarioReferences}
                userInputs={{ "Medicamento Consultado": medication }}
                className="w-full"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dicionario;
