import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Download, Loader2, Image as ImageIcon, X, CheckCircle2, Copy, FileDown, AlertTriangle, FileType } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UFS } from "@/hooks/useCrmvValidation";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";

const ResenhaEquinos = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Professional identification (MANDATORY)
  const [vetName, setVetName] = useState("");
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

  const validateCrmv = (): boolean => {
    if (!crmv.trim()) {
      toast({
        title: "CRMV obrigatório",
        description: "Esta ferramenta é restrita a médicos veterinários. Informe seu CRMV para continuar.",
        variant: "destructive",
      });
      return false;
    }

    const crmvPattern = /^\d{3,6}$/;
    if (!crmvPattern.test(crmv.trim())) {
      toast({
        title: "CRMV inválido",
        description: "Informe um número de CRMV válido (3 a 6 dígitos).",
        variant: "destructive",
      });
      return false;
    }

    if (!uf) {
      toast({
        title: "UF obrigatório",
        description: "Selecione o estado (UF) do seu registro profissional.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    
    if (fileArray.length < 2) {
      toast({
        title: "Mínimo de imagens",
        description: "Por favor, selecione pelo menos 2 imagens do equino.",
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
    // CRMV validation gatekeeper - MANDATORY
    if (!validateCrmv()) {
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

    if (images.length < 2) {
      toast({
        title: "Imagens insuficientes",
        description: `Envie entre 2 e 5 imagens. Você enviou ${images.length}.`,
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
          vetName,
          crmv: `${crmv}-${uf}`
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

  const getFormattedSignature = () => {
    return vetName 
      ? `Responsável técnico: Méd. Vet. ${vetName} — CRMV-${uf} ${crmv}`
      : `Responsável técnico: CRMV-${uf} ${crmv}`;
  };

  const getLegalDisclaimer = () => {
    return `\n\n---\n${getFormattedSignature()}\n\nEste relatório foi gerado por inteligência artificial e não substitui exame presencial nem assinatura do médico veterinário responsável, sendo este obrigatório para validade oficial.\n\nEmitido por VetAgro Sustentável AI — ${new Date().toLocaleDateString("pt-BR")}`;
  };

  const handleCopyToClipboard = async () => {
    if (!resenha) return;
    
    const textToCopy = resenha + getLegalDisclaimer();
    
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
    
    const textContent = resenha + getLegalDisclaimer();
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

  // Remove seção IDENTIFICAÇÃO duplicada do conteúdo da resenha
  const getCleanResenhaContent = () => {
    // Remove seção IDENTIFICAÇÃO se existir no conteúdo da resenha para evitar duplicidade
    let cleaned = resenha
      .replace(/IDENTIFICAÇÃO[\s\S]*?(?=MORFOLOGIA|PELAGEM|CONDIÇÃO|$)/i, '')
      .replace(/^\s*\n+/gm, '\n')
      .trim();
    return cleaned;
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

    // IDENTIFICAÇÃO PADRONIZADA (única seção)
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("IDENTIFICAÇÃO", margin, yPosition);
    yPosition += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    // Padronizar nomenclatura de raça (PSI)
    const displayBreed = breed.toLowerCase().includes("puro sangue") || breed.toLowerCase().includes("psi") 
      ? "Puro Sangue Inglês (PSI)" 
      : breed;
    
    const identData = [
      horseName ? `• Nome: ${horseName}` : null,
      `• Raça: ${displayBreed}`,
      `• Idade: ${age}`,
      sex ? `• Sexo: ${sex}` : null,
      coat ? `• Pelagem: ${coat}` : null,
      `• Finalidade: ${purpose}`,
      `• ${getFormattedSignature()}`
    ].filter(Boolean);
    
    identData.forEach((line) => {
      doc.text(line as string, margin, yPosition);
      yPosition += 6;
    });
    yPosition += 5;

    // Separator
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Report content (sem seção IDENTIFICAÇÃO duplicada)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    const cleanContent = getCleanResenhaContent();
    const lines = doc.splitTextToSize(cleanContent, maxWidth);
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Destacar títulos de seções
      if (line.match(/^(MORFOLOGIA|PELAGEM|CONDIÇÃO|PONTOS|OBSERVAÇÕES|CONCLUSÃO)/i)) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        yPosition += 3;
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
      }
      
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });

    // Legal disclaimer
    if (yPosition > pageHeight - 55) {
      doc.addPage();
      yPosition = 20;
    }
    yPosition += 10;
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    const disclaimer = "Este relatório foi gerado por inteligência artificial e não substitui exame presencial nem assinatura do médico veterinário responsável, sendo este obrigatório para validade oficial.";
    const disclaimerLines = doc.splitTextToSize(disclaimer, maxWidth);
    disclaimerLines.forEach((line: string) => {
      doc.text(line, margin, yPosition);
      yPosition += 4;
    });

    // Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(
        `VetAgro Sustentável AI — ${new Date().toLocaleDateString("pt-BR")} — Página ${i} de ${pageCount}`,
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

  const handleDownloadDOCX = async () => {
    if (!resenha) return;

    const displayBreed = breed.toLowerCase().includes("puro sangue") || breed.toLowerCase().includes("psi") 
      ? "Puro Sangue Inglês (PSI)" 
      : breed;

    const cleanContent = getCleanResenhaContent();
    const contentLines = cleanContent.split('\n').filter(line => line.trim());

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Título
          new Paragraph({
            children: [new TextRun({ text: "RESENHA TÉCNICA — EQUINO", bold: true, size: 32 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          // Identificação
          new Paragraph({
            children: [new TextRun({ text: "IDENTIFICAÇÃO", bold: true, size: 24 })],
            spacing: { before: 200, after: 100 },
          }),
          ...[
            horseName ? `Nome: ${horseName}` : null,
            `Raça: ${displayBreed}`,
            `Idade: ${age}`,
            sex ? `Sexo: ${sex}` : null,
            coat ? `Pelagem: ${coat}` : null,
            `Finalidade: ${purpose}`,
            getFormattedSignature()
          ].filter(Boolean).map(text => new Paragraph({
            children: [new TextRun({ text: `• ${text}`, size: 22 })],
            spacing: { after: 60 },
          })),
          // Separador
          new Paragraph({ children: [], spacing: { after: 200 } }),
          // Conteúdo
          ...contentLines.map(line => {
            const isTitle = line.match(/^(MORFOLOGIA|PELAGEM|CONDIÇÃO|PONTOS|OBSERVAÇÕES|CONCLUSÃO)/i);
            return new Paragraph({
              children: [new TextRun({ 
                text: line, 
                bold: !!isTitle, 
                size: isTitle ? 24 : 22 
              })],
              spacing: { before: isTitle ? 200 : 60, after: 60 },
            });
          }),
          // Disclaimer
          new Paragraph({ children: [], spacing: { after: 300 } }),
          new Paragraph({
            children: [new TextRun({ 
              text: "Este relatório foi gerado por inteligência artificial e não substitui exame presencial nem assinatura do médico veterinário responsável, sendo este obrigatório para validade oficial.", 
              italics: true, 
              size: 18 
            })],
          }),
          new Paragraph({
            children: [new TextRun({ 
              text: `Emitido por VetAgro Sustentável AI — ${new Date().toLocaleDateString("pt-BR")}`, 
              italics: true, 
              size: 18 
            })],
            spacing: { before: 100 },
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `resenha-equino-${horseName || 'sem-nome'}-${Date.now()}.docx`);
    
    toast({
      title: "DOCX baixado",
      description: "A resenha foi salva em formato Word.",
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
              Resenha Técnica de Equinos
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Ferramenta exclusiva para médicos veterinários
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl">
        {/* Legal Warning */}
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  Uso exclusivo por Médico Veterinário
                </p>
                <p className="text-muted-foreground mt-1">
                  Este documento só tem validade jurídica com CRMV válido e assinatura do veterinário responsável.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Veterinarian Data - MANDATORY */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Responsável Técnico</CardTitle>
            <CardDescription>
              Dados obrigatórios do médico veterinário
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vetName">Nome do Veterinário</Label>
              <Input
                id="vetName"
                placeholder="Ex: Dr(a). João Silva"
                value={vetName}
                onChange={(e) => setVetName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </CardContent>
        </Card>

        {/* Horse Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do Equino</CardTitle>
            <CardDescription>
              Informações para identificação do animal
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
                  placeholder="Ex: Registro, venda, exposição"
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
              Envie de 2 a 5 imagens para análise morfológica completa
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
                  Mínimo 2, máximo 5 imagens (JPG, PNG)
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
          disabled={loading || images.length < 2}
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
              Gerar Resenha Técnica ({images.length}/2 imagens mínimas)
            </>
          )}
        </Button>

        {resenha && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resenha Técnica Gerada</CardTitle>
              <CardDescription>
                Revise a resenha e exporte no formato desejado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={resenha}
                onChange={(e) => setResenha(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
              />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button onClick={handleCopyToClipboard} variant="outline" className="w-full">
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar
                </Button>
                <Button onClick={handleDownloadPDF} variant="default" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button onClick={handleDownloadDOCX} variant="secondary" className="w-full">
                  <FileType className="mr-2 h-4 w-4" />
                  DOCX
                </Button>
                <Button onClick={handleDownloadTxt} variant="outline" className="w-full">
                  <FileDown className="mr-2 h-4 w-4" />
                  TXT
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p className="font-medium mb-1">Aviso Legal:</p>
                <p>Este relatório foi gerado por inteligência artificial e não substitui exame presencial nem assinatura do médico veterinário responsável, sendo este obrigatório para validade oficial.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResenhaEquinos;
