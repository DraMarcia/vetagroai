import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pill, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";

const Receituario = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [vetName, setVetName] = useState("");
  const [crmv, setCrmv] = useState("");
  const [animalName, setAnimalName] = useState("");
  const [animalAge, setAnimalAge] = useState("");
  const [animalBreed, setAnimalBreed] = useState("");
  const [animalSpecies, setAnimalSpecies] = useState("");
  const [prescription, setPrescription] = useState("");
  const [result, setResult] = useState("");

  const handleGenerate = async () => {
    if (!vetName || !crmv || !animalName || !animalSpecies || !prescription) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          question: `Gere um receituário veterinário profissional com base nos seguintes dados:
          
Veterinário: ${vetName}
CRMV: ${crmv}
Animal: ${animalName}
Idade: ${animalAge}
Raça: ${animalBreed}
Espécie: ${animalSpecies}
Prescrição: ${prescription}

Formate o receituário de forma profissional, incluindo todos os dados acima, a prescrição detalhada com posologia, e local e data para assinatura.`,
          isProfessional: true,
          context: "Geração de receituário veterinário profissional",
        },
      });

      if (error) throw error;

      setResult(data.answer);
      toast({
        title: "Receituário gerado!",
        description: "O receituário está pronto para download.",
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro ao gerar receituário",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!result) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;

    doc.setFontSize(16);
    doc.text("RECEITUÁRIO VETERINÁRIO", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(10);
    const lines = doc.splitTextToSize(result, maxWidth);
    doc.text(lines, margin, 40);

    doc.save(`receituario_${animalName}_${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "PDF baixado!",
      description: "O receituário foi salvo com sucesso.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Pill className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerador de Receituário Veterinário</h1>
            <p className="text-muted-foreground">Emita prescrições padronizadas a partir dos dados do paciente</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Veterinário</CardTitle>
            <CardDescription>
              Informações profissionais do médico veterinário
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="vetName">Nome do Veterinário *</Label>
              <Input
                id="vetName"
                placeholder="Dr(a). Nome Completo"
                value={vetName}
                onChange={(e) => setVetName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="crmv">Número do CRMV *</Label>
              <Input
                id="crmv"
                placeholder="Ex: CRMV-SP 12345"
                value={crmv}
                onChange={(e) => setCrmv(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Animal</CardTitle>
            <CardDescription>
              Informações do paciente animal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="animalName">Nome do Animal *</Label>
              <Input
                id="animalName"
                placeholder="Nome do animal"
                value={animalName}
                onChange={(e) => setAnimalName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="animalAge">Idade</Label>
                <Input
                  id="animalAge"
                  placeholder="Ex: 5 anos"
                  value={animalAge}
                  onChange={(e) => setAnimalAge(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="animalSpecies">Espécie *</Label>
                <Input
                  id="animalSpecies"
                  placeholder="Ex: Canino, Felino, Equino"
                  value={animalSpecies}
                  onChange={(e) => setAnimalSpecies(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="animalBreed">Raça</Label>
              <Input
                id="animalBreed"
                placeholder="Ex: Labrador, SRD"
                value={animalBreed}
                onChange={(e) => setAnimalBreed(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prescrição</CardTitle>
            <CardDescription>
              Medicamentos e orientações de tratamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="prescription">Prescrição *</Label>
              <Textarea
                id="prescription"
                placeholder="Ex: Amoxicilina 500mg, 1 comprimido a cada 12 horas por 7 dias..."
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleGenerate}
          disabled={loading}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Pill className="mr-2 h-5 w-5" />
              Gerar Receituário
            </>
          )}
        </Button>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Receituário Gerado</CardTitle>
              <CardDescription>
                Revise o receituário antes de baixar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
                  {result}
                </div>
              </div>
              <Button onClick={handleDownloadPDF} className="w-full">
                <Download className="mr-2 h-5 w-5" />
                Baixar PDF
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Receituario;
