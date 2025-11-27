import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileText, Loader2, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";

const InterpretacaoExames = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isProfessional, setIsProfessional] = useState("");
  const [crmv, setCrmv] = useState("");
  const [species, setSpecies] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [examType, setExamType] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [clinicalData, setClinicalData] = useState("");
  const [result, setResult] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    const imagePromises = fileArray.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then((imageDataUrls) => {
      setImages(imageDataUrls);
      toast({
        title: "Imagens carregadas!",
        description: `${imageDataUrls.length} arquivo(s) carregado(s).`,
      });
    });
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = 20;

    doc.setFontSize(16);
    doc.text("Interpretação de Exames Veterinários", margin, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.text(`Tipo de usuário: ${isProfessional === "sim" ? `Profissional - CRMV: ${crmv}` : "Tutor"}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Espécie: ${species} | Idade: ${age} | Peso: ${weight}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Tipo de exame: ${examType}`, margin, yPosition);
    yPosition += 10;

    if (clinicalData) {
      doc.setFontSize(12);
      doc.text("Dados Clínicos:", margin, yPosition);
      yPosition += 7;
      doc.setFontSize(10);
      const clinicalLines = doc.splitTextToSize(clinicalData, maxWidth);
      doc.text(clinicalLines, margin, yPosition);
      yPosition += clinicalLines.length * 5 + 5;
    }

    doc.setFontSize(12);
    doc.text("Interpretação:", margin, yPosition);
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

    doc.save("interpretacao-exames.pdf");
    toast({
      title: "PDF gerado!",
      description: "A interpretação foi baixada com sucesso.",
    });
  };

  const handleAnalyze = async () => {
    if (!isProfessional) {
      toast({
        title: "Campo obrigatório",
        description: "Informe se você é profissional da área.",
        variant: "destructive",
      });
      return;
    }

    if (isProfessional === "sim" && !crmv.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Informe seu número de CRMV.",
        variant: "destructive",
      });
      return;
    }

    if (!species.trim() || !age.trim() || !weight.trim() || !examType.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha espécie, idade, peso e tipo de exame.",
        variant: "destructive",
      });
      return;
    }

    if (images.length === 0 && !clinicalData.trim()) {
      toast({
        title: "Dados insuficientes",
        description: "Anexe imagens dos exames ou descreva os valores.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-equine", {
        body: {
          images,
          breed: species,
          age,
          purpose: `Interpretação de ${examType}. ${clinicalData ? `Dados clínicos: ${clinicalData}` : ""}`,
        },
      });

      if (error) throw error;

      let interpretation = data.review;

      if (isProfessional === "sim") {
        interpretation += "\n\nRecomendações técnicas:\n- Correlacione sempre com o quadro clínico\n- Considere exames complementares se necessário\n- Avalie evolução temporal dos parâmetros\n\nReferências:\n- Merck Veterinary Manual\n- Laboratórios de referência veterinária";
      } else {
        interpretation += "\n\n⚠️ ATENÇÃO: Esta interpretação tem caráter educativo. Consulte um médico veterinário para análise completa e conduta terapêutica.";
      }

      setResult(interpretation);
      toast({
        title: "Análise concluída!",
        description: "Interpretação dos exames gerada.",
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
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Interpretação de Exames</h1>
            <p className="text-muted-foreground">Hemograma, bioquímica, imagem (RX, US) e outros</p>
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
                <Label htmlFor="prof-nao">Não sou profissional (tutor/produtor)</Label>
              </div>
            </RadioGroup>

            {isProfessional === "sim" && (
              <div className="mt-4">
                <Label htmlFor="crmv">CRMV *</Label>
                <Input
                  id="crmv"
                  placeholder="Ex: CRMV-SP 12345"
                  value={crmv}
                  onChange={(e) => setCrmv(e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Animal</CardTitle>
            <CardDescription>
              Informações básicas sobre o paciente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="species">Espécie *</Label>
                <Input
                  id="species"
                  placeholder="Ex: Canina, Felina, Bovina..."
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Idade *</Label>
                  <Input
                    id="age"
                    placeholder="Ex: 5 anos"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Peso *</Label>
                  <Input
                    id="weight"
                    placeholder="Ex: 25 kg"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="examType">Tipo de Exame *</Label>
                <Input
                  id="examType"
                  placeholder="Ex: Hemograma, Bioquímica, Raio-X, Ultrassom..."
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Exame</CardTitle>
            <CardDescription>
              Anexe imagens (PDF ou fotos) ou descreva os valores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="images">Imagens dos Exames (opcional)</Label>
                <Input
                  id="images"
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  onChange={handleImageUpload}
                  className="cursor-pointer"
                />
                {images.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {images.length} arquivo(s) selecionado(s)
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="clinicalData">Valores/Dados Clínicos (opcional)</Label>
                <Textarea
                  id="clinicalData"
                  placeholder="Ex: Hemácias 5.2 milhões, Leucócitos 18.000, ALT 120 U/L..."
                  value={clinicalData}
                  onChange={(e) => setClinicalData(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleAnalyze}
          disabled={loading || !isProfessional}
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
              <FileText className="mr-2 h-5 w-5" />
              Interpretar Exames
            </>
          )}
        </Button>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Interpretação dos Exames</CardTitle>
              <CardDescription>
                Análise baseada nos dados fornecidos
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

export default InterpretacaoExames;
