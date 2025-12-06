import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload, Download, Loader2, Image as ImageIcon, X, CheckCircle2 } from "lucide-react";
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
  const [horseName, setHorseName] = useState("");
  const [sex, setSex] = useState("");
  const [images, setImages] = useState<{ url: string; name: string }[]>([]);
  const [resenha, setResenha] = useState("");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    
    if (fileArray.length < 3) {
      toast({
        title: "Mínimo de imagens",
        description: "Por favor, selecione pelo menos 3 imagens do equino.",
        variant: "destructive",
      });
      return;
    }

    if (fileArray.length > 5) {
      toast({
        title: "Máximo de imagens",
        description: "Por favor, selecione no máximo 5 imagens.",
        variant: "destructive",
      });
      return;
    }

    const imagePromises = fileArray.map((file) => {
      return new Promise<{ url: string; name: string }>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve({ 
          url: reader.result as string, 
          name: file.name 
        });
        reader.readAsDataURL(file);
      });
    });

    const loadedImages = await Promise.all(imagePromises);
    setImages(loadedImages);
    
    toast({
      title: "Imagens carregadas",
      description: `${loadedImages.length} imagens prontas para análise.`,
    });
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const handleGenerate = async () => {
    if (!crmv.trim()) {
      toast({
        title: "CRMV obrigatório",
        description: "Informe seu número de registro no CRMV.",
        variant: "destructive",
      });
      return;
    }

    if (!breed.trim() || !age.trim() || !purpose.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha raça, idade e finalidade da resenha.",
        variant: "destructive",
      });
      return;
    }

    if (images.length < 3) {
      toast({
        title: "Imagens insuficientes",
        description: `Envie entre 3 e 5 imagens. Você enviou ${images.length}.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-equine", {
        body: { 
          images: images.map(img => img.url), 
          breed, 
          age, 
          purpose,
          horseName,
          sex
        },
      });

      if (error) throw error;

      // Limpar formatação indesejada
      let cleanResenha = data.resenha
        .replace(/\*\*/g, '')
        .replace(/##/g, '')
        .replace(/###/g, '')
        .replace(/\*/g, '•')
        .replace(/#+\s*/g, '');

      setResenha(cleanResenha);
      toast({
        title: "Resenha gerada",
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
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = 20;

    // Cabeçalho
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("RESENHA DE EQUINO", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Dados do documento
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO PROFISSIONAL", margin, yPosition);
    yPosition += 7;
    doc.setFont("helvetica", "normal");
    doc.text(`CRMV: ${crmv}`, margin, yPosition);
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, pageWidth - margin - 40, yPosition);
    yPosition += 12;

    // Dados do equino
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO EQUINO", margin, yPosition);
    yPosition += 7;
    doc.setFont("helvetica", "normal");
    if (horseName) {
      doc.text(`Nome: ${horseName}`, margin, yPosition);
      yPosition += 6;
    }
    doc.text(`Raça: ${breed}`, margin, yPosition);
    doc.text(`Idade: ${age}`, margin + 80, yPosition);
    if (sex) {
      doc.text(`Sexo: ${sex}`, margin + 130, yPosition);
    }
    yPosition += 6;
    doc.text(`Finalidade: ${purpose}`, margin, yPosition);
    yPosition += 10;

    // Linha separadora
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Conteúdo da resenha
    doc.setFont("helvetica", "bold");
    doc.text("DESCRIÇÃO TÉCNICA", margin, yPosition);
    yPosition += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    const lines = doc.splitTextToSize(resenha, maxWidth);
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });

    // Rodapé em todas as páginas
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Documento gerado pelo VetAgro IA - Página ${i} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }

    doc.save(`resenha-equino-${horseName || 'sem-nome'}-${Date.now()}.pdf`);
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
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Gerador de Resenha de Equinos
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Gere resenhas técnicas a partir de fotos com exportação para PDF
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do Veterinário</CardTitle>
            <CardDescription>
              Esta ferramenta é exclusiva para veterinários registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
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
            <CardTitle className="text-lg">Dados do Equino</CardTitle>
            <CardDescription>
              Preencha as informações do animal para análise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="horseName">Nome do Animal</Label>
                <Input
                  id="horseName"
                  placeholder="Ex: Trovão"
                  value={horseName}
                  onChange={(e) => setHorseName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sex">Sexo</Label>
                <Input
                  id="sex"
                  placeholder="Ex: Macho, Fêmea, Castrado"
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="breed">Raça *</Label>
              <Input
                id="breed"
                placeholder="Ex: Mangalarga Marchador"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Idade *</Label>
                <Input
                  id="age"
                  placeholder="Ex: 5 anos"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Finalidade *</Label>
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
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Imagens do Equino
            </CardTitle>
            <CardDescription>
              Envie de 3 a 5 imagens do animal para análise completa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Clique para selecionar imagens</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Mínimo 3, máximo 5 imagens (JPG, PNG)
                </p>
              </label>
            </div>

            {images.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  {images.length} imagem(ns) carregada(s)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.url}
                        alt={`Imagem ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-border"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {img.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          onClick={handleGenerate}
          disabled={loading || images.length < 3}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analisando imagens...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-5 w-5" />
              Gerar Resenha ({images.length}/3 imagens)
            </>
          )}
        </Button>

        {resenha && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resenha Gerada</CardTitle>
              <CardDescription>
                Revise a resenha e faça o download em PDF
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={resenha}
                onChange={(e) => setResenha(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
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

export default ResenhaEquinos;