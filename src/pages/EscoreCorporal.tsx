import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Loader2, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";

const EscoreCorporal = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [species, setSpecies] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [image, setImage] = useState("");
  const [result, setResult] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      toast({
        title: "Imagem carregada!",
        description: "Foto do animal recebida.",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = 20;

    doc.setFontSize(16);
    doc.text("Avaliação de Escore de Condição Corporal", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.text(`Espécie: ${species} | Idade: ${age} | Peso: ${weight}`, margin, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.text("Análise:", margin, yPosition);
    yPosition += 7;
    doc.setFontSize(10);
    const resultLines = doc.splitTextToSize(result, maxWidth);
    resultLines.forEach((line: string) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });

    doc.save("escore-corporal.pdf");
    toast({
      title: "PDF gerado!",
      description: "A avaliação foi baixada com sucesso.",
    });
  };

  const handleAnalyze = async () => {
    if (!species.trim() || !age.trim() || !weight.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha espécie, idade e peso.",
        variant: "destructive",
      });
      return;
    }

    if (!image) {
      toast({
        title: "Imagem necessária",
        description: "Anexe uma foto lateral do animal.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-equine", {
        body: {
          images: [image],
          breed: species,
          age,
          purpose: `Avaliar Escore de Condição Corporal (ECC). Peso atual: ${weight}. 
          
Forneça:
1. ECC estimado (escala 1-5 ou 1-9 conforme a espécie)
2. Classificação (muito magro, magro, ideal, sobrepeso, obeso)
3. Recomendações nutricionais específicas
4. Ajustes na dieta (aumentar/reduzir calorias, tipo de alimento)
5. Orientações de manejo e exercício

Inclua referências sobre ECC (literatura zootécnica e veterinária).`,
        },
      });

      if (error) throw error;

      const finalResult = data.review + "\n\n⚠️ Esta análise é uma estimativa baseada em imagem. Para avaliação precisa, consulte um médico veterinário ou zootecnista.";

      setResult(finalResult);
      toast({
        title: "Análise concluída!",
        description: "Escore de condição corporal estimado.",
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro ao analisar",
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
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Escore de Condição Corporal (ECC)</h1>
            <p className="text-muted-foreground">Avaliação visual com IA e recomendações nutricionais</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Dados do Animal</CardTitle>
            <CardDescription>
              Informações básicas para avaliação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="species">Espécie *</Label>
                <Input
                  id="species"
                  placeholder="Ex: Bovina, Equina, Canina, Felina..."
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Idade *</Label>
                  <Input
                    id="age"
                    placeholder="Ex: 3 anos"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Peso Atual *</Label>
                  <Input
                    id="weight"
                    placeholder="Ex: 450 kg"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Foto do Animal</CardTitle>
            <CardDescription>
              Anexe uma foto lateral nítida do animal (perfil completo)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="image">Foto Lateral *</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="cursor-pointer"
              />
              {image && (
                <div className="mt-4">
                  <img src={image} alt="Preview" className="max-w-full h-auto rounded-lg border" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleAnalyze}
          disabled={loading}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Activity className="mr-2 h-5 w-5" />
              Avaliar ECC
            </>
          )}
        </Button>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Avaliação do Escore Corporal</CardTitle>
              <CardDescription>
                Resultado da análise e recomendações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
                    {result}
                  </div>
                </div>
                <Button
                  onClick={handleDownloadPDF}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EscoreCorporal;
