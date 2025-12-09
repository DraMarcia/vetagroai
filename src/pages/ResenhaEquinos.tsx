import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Download, Loader2, Image as ImageIcon, X, CheckCircle2, Copy, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCrmvValidation, UFS } from "@/hooks/useCrmvValidation";
import jsPDF from "jspdf";

const ResenhaEquinos = () => {
  const { toast } = useToast();
  const { validateAndNotify } = useCrmvValidation();
  const [loading, setLoading] = useState(false);
  
  // Professional identification
  const [isProfessional, setIsProfessional] = useState(true);
  const [crmv, setCrmv] = useState("");
  const [uf, setUf] = useState("");
  
  // Horse data
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [purpose, setPurpose] = useState("");
  const [horseName, setHorseName] = useState("");
  const [sex, setSex] = useState("");
  const [coat, setCoat] = useState("");
  
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
    // CRMV validation gatekeeper for professionals
    if (isProfessional) {
      const validation = validateAndNotify(isProfessional, crmv, uf);
      if (!validation.isValid) {
        return;
      }
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
          sex,
          coat,
          isProfessional,
          crmv: isProfessional ? `${crmv}-${uf}` : null
        },
      });

      if (error) throw error;

      // Clean unwanted formatting
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
      
      if (error.message?.includes("429") || error.status === 429) {
        toast({
          title: "Limite de requisições",
          description: "Aguarde alguns instantes e tente novamente.",
          variant: "destructive",
        });
        return;
      }
      
      if (error.message?.includes("402") || error.status === 402) {
        toast({
          title: "Créditos insuficientes",
          description: "Adicione créditos para continuar usando a ferramenta.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Erro ao gerar resenha",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getReportFooter = () => {
    const date = new Date().toLocaleDateString("pt-BR");
    return `\n\n---\nEmitido por VetAgro Sustentável AI — ${date}`;
  };

  const handleCopyToClipboard = async () => {
    if (!resenha) return;
    
    const textToCopy = resenha + getReportFooter();
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast({
        title: "Copiado!",
        description: "Resenha copiada para a área de transferência.",
      });
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadTxt = () => {
    if (!resenha) return;
    
    const textContent = resenha + getReportFooter();
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `resenha-equino-${horseName || 'sem-nome'}-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "TXT baixado",
      description: "Arquivo de texto salvo com sucesso.",
    });
  };

  const handleDownloadPDF = () => {
    if (!resenha) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = 20;

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("RESENHA TÉCNICA — EQUINO", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 12;

    // Separator line
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Professional data
    if (isProfessional && crmv && uf) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("DADOS DO PROFISSIONAL", margin, yPosition);
      yPosition += 6;
      doc.setFont("helvetica", "normal");
      doc.text(`CRMV: ${crmv}-${uf}`, margin, yPosition);
      doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, pageWidth - margin - 40, yPosition);
      yPosition += 10;
    }

    // Equine data
    doc.setFont("helvetica", "bold");
    doc.text("IDENTIFICAÇÃO", margin, yPosition);
    yPosition += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    
    const identData = [
      horseName ? `• Nome: ${horseName}` : null,
      `• Raça: ${breed}`,
      `• Idade: ${age}`,
      sex ? `• Sexo: ${sex}` : null,
      coat ? `• Pelagem: ${coat}` : null,
      `• Finalidade: ${purpose}`
    ].filter(Boolean);
    
    identData.forEach((line) => {
      doc.text(line as string, margin, yPosition);
      yPosition += 5;
    });
    yPosition += 5;

    // Separator
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Report content
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

    // Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Emitido por VetAgro Sustentável AI — ${new Date().toLocaleDateString("pt-BR")} — Página ${i} de ${pageCount}`,
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
              Gere resenhas técnicas oficiais a partir de fotos com exportação em múltiplos formatos
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl">
        {/* User Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Identificação do Usuário</CardTitle>
            <CardDescription>
              Selecione seu perfil para personalizar a análise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={isProfessional ? "professional" : "layperson"}
              onValueChange={(value) => setIsProfessional(value === "professional")}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="professional" id="professional" />
                <Label htmlFor="professional" className="cursor-pointer">
                  Médico(a) Veterinário(a)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="layperson" id="layperson" />
                <Label htmlFor="layperson" className="cursor-pointer">
                  Proprietário / Criador (não profissional)
                </Label>
              </div>
            </RadioGroup>

            {isProfessional && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="crmv">Número do CRMV *</Label>
                  <Input
                    id="crmv"
                    placeholder="Ex: 12345"
                    value={crmv}
                    onChange={(e) => setCrmv(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground">3 a 6 dígitos</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uf">Estado (UF) *</Label>
                  <Select value={uf} onValueChange={setUf}>
                    <SelectTrigger id="uf">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {UFS.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Horse Data */}
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
                <Select value={sex} onValueChange={setSex}>
                  <SelectTrigger id="sex">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Macho">Macho</SelectItem>
                    <SelectItem value="Fêmea">Fêmea</SelectItem>
                    <SelectItem value="Castrado">Castrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="breed">Raça *</Label>
                <Input
                  id="breed"
                  placeholder="Ex: Mangalarga Marchador"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coat">Pelagem</Label>
                <Input
                  id="coat"
                  placeholder="Ex: Castanho, Alazão, Tordilho"
                  value={coat}
                  onChange={(e) => setCoat(e.target.value)}
                />
              </div>
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

        {/* Image Upload */}
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
                Revise a resenha e exporte no formato desejado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={resenha}
                onChange={(e) => setResenha(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button onClick={handleCopyToClipboard} variant="outline" className="w-full">
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar
                </Button>
                <Button onClick={handleDownloadTxt} variant="outline" className="w-full">
                  <FileDown className="mr-2 h-4 w-4" />
                  TXT
                </Button>
                <Button onClick={handleDownloadPDF} variant="default" className="w-full col-span-2">
                  <Download className="mr-2 h-4 w-4" />
                  Baixar PDF
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                Esta ferramenta é exclusiva para avaliação morfológica de equinos.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResenhaEquinos;
