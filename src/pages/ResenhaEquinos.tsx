import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";

const ResenhaEquinos = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [crmv, setCrmv] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [purpose, setPurpose] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [resenha, setResenha] = useState("");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (files.length < 3 || files.length > 5) {
      toast({
        title: "Erro",
        description: "Por favor, selecione entre 3 e 5 imagens.",
        variant: "destructive",
      });
      return;
    }

    const imagePromises = Array.from(files).map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    const imageDataUrls = await Promise.all(imagePromises);
    setImages(imageDataUrls);
    toast({
      title: "Imagens carregadas",
      description: `${files.length} imagens prontas para análise.`,
    });
  };

  const handleGenerate = async () => {
    if (!crmv || !breed || !age || !purpose || images.length < 3) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos e envie entre 3 e 5 imagens.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-equine", {
        body: { images, breed, age, purpose },
      });

      if (error) throw error;

      setResenha(data.resenha);
      toast({
        title: "Resenha gerada!",
        description: "A análise do equino foi concluída com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro ao gerar resenha",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!resenha) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;

    // Cabeçalho
    doc.setFontSize(18);
    doc.text("RESENHA DE EQUINO", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`CRMV: ${crmv}`, margin, 35);
    doc.text(`Raça: ${breed}`, margin, 42);
    doc.text(`Idade: ${age}`, margin, 49);
    doc.text(`Finalidade: ${purpose}`, margin, 56);
    
    doc.setLineWidth(0.5);
    doc.line(margin, 60, pageWidth - margin, 60);

    // Conteúdo da resenha
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(resenha, maxWidth);
    doc.text(lines, margin, 70);

    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Gerado em ${new Date().toLocaleDateString("pt-BR")} - Página ${i} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    doc.save(`resenha-equino-${Date.now()}.pdf`);
    toast({
      title: "PDF baixado",
      description: "A resenha foi salva com sucesso.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerador de Resenha de Equinos</h1>
            <p className="text-muted-foreground">Gere resenhas técnicas a partir de fotos com exportação para PDF</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Veterinário</CardTitle>
            <CardDescription>
              Esta ferramenta é exclusiva para veterinários registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="crmv">Número do CRMV *</Label>
                <Input
                  id="crmv"
                  placeholder="Ex: CRMV-SP 12345"
                  value={crmv}
                  onChange={(e) => setCrmv(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Equino</CardTitle>
            <CardDescription>
              Preencha as informações do animal para análise
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="breed">Raça *</Label>
                <Input
                  id="breed"
                  placeholder="Ex: Mangalarga Marchador"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                />
              </div>
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
                <Label htmlFor="purpose">Finalidade da Resenha *</Label>
                <Input
                  id="purpose"
                  placeholder="Ex: Registro, venda, documentação"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imagens do Equino</CardTitle>
            <CardDescription>
              Envie de 3 a 5 imagens do animal para análise completa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="flex-1"
                />
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              {images.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {images.length} imagem(ns) carregada(s)
                </p>
              )}
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
              Gerando resenha...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-5 w-5" />
              Gerar Resenha
            </>
          )}
        </Button>

        {resenha && (
          <Card>
            <CardHeader>
              <CardTitle>Resenha Gerada</CardTitle>
              <CardDescription>
                Revise a resenha e faça o download em PDF
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  value={resenha}
                  onChange={(e) => setResenha(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
                <Button onClick={handleDownloadPDF} className="w-full">
                  <Download className="mr-2 h-5 w-5" />
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

export default ResenhaEquinos;
