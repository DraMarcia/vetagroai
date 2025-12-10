import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Loader2, Download, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cleanTextForDisplay, cleanTextForPDF } from "@/lib/textUtils";
import { ReportExporter } from "@/components/ReportExporter";
import jsPDF from "jspdf";

const EscoreCorporal = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [species, setSpecies] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [image, setImage] = useState("");
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

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

  const handleCopyReport = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "Relatório copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = 20;
    const lineHeight = 5;
    let pageNumber = 1;

    // Função para adicionar rodapé em cada página
    const addFooter = () => {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        "Documento gerado pela suíte VetAgro Sustentável AI — inteligência aplicada à saúde, produção e bem-estar animal.",
        margin,
        pageHeight - 15
      );
      doc.text(
        `www.vetagroai.com.br — © 2025 VetAgro Sustentável AI | Página ${pageNumber}`,
        margin,
        pageHeight - 10
      );
      doc.setTextColor(0, 0, 0);
    };

    // Função para verificar quebra de página
    const checkPageBreak = (neededSpace: number = 30) => {
      if (yPosition > pageHeight - neededSpace) {
        addFooter();
        doc.addPage();
        pageNumber++;
        yPosition = 20;
      }
    };

    // Função para desenhar linha divisória verde
    const drawGreenLine = () => {
      doc.setDrawColor(13, 139, 68); // Verde VetAgro #0d8b44
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;
    };

    // Função para adicionar texto justificado
    const addJustifiedText = (text: string, fontSize: number = 10) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", "normal");
      const cleanedText = cleanTextForPDF(text);
      const lines = doc.splitTextToSize(cleanedText, maxWidth);
      
      lines.forEach((line: string) => {
        checkPageBreak();
        doc.text(line, margin, yPosition, { align: "left", maxWidth: maxWidth });
        yPosition += lineHeight;
      });
    };

    // Função para adicionar título de seção
    const addSectionTitle = (title: string) => {
      checkPageBreak(20);
      yPosition += 5;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(13, 139, 68); // Verde VetAgro
      doc.text(title.toUpperCase(), margin, yPosition);
      yPosition += 2;
      drawGreenLine();
      doc.setTextColor(0, 0, 0);
      yPosition += 3;
    };

    // ========== CABEÇALHO ==========
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 139, 68);
    doc.text("VetAgro Sustentável AI", margin, yPosition);
    yPosition += 6;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Inteligência aplicada à saúde, produção e bem-estar animal", margin, yPosition);
    yPosition += 8;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Escore de Condição Corporal (ECC) — Relatório Técnico", margin, yPosition);
    yPosition += 5;
    drawGreenLine();
    yPosition += 5;

    // ========== IDENTIFICAÇÃO DO CASO (TABELA) ==========
    addSectionTitle("Identificação do Caso");

    // Tabela de identificação
    const tableData = [
      ["Espécie", species || "Não informado"],
      ["Idade", age || "Não informada"],
      ["Peso Atual", weight || "Não informado"],
      ["Data da Análise", new Date().toLocaleDateString("pt-BR")]
    ];

    doc.setFontSize(10);
    const colWidth = maxWidth / 2;
    tableData.forEach(([label, value]) => {
      checkPageBreak();
      doc.setFont("helvetica", "bold");
      doc.text(label + ":", margin, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(value, margin + colWidth * 0.4, yPosition);
      yPosition += 6;
    });
    yPosition += 5;

    // ========== ANÁLISE TÉCNICA ==========
    addSectionTitle("Análise Técnica — Escore de Condição Corporal");
    
    // Limpar e processar o resultado
    const cleanedResult = cleanTextForPDF(result);
    
    // Dividir em parágrafos e processar
    const paragraphs = cleanedResult.split(/\n\n+/);
    paragraphs.forEach((paragraph) => {
      if (paragraph.trim()) {
        // Verificar se é um título de seção
        const sectionMatch = paragraph.match(/^([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]+):/);
        if (sectionMatch) {
          addSectionTitle(sectionMatch[1]);
          const content = paragraph.replace(sectionMatch[0], "").trim();
          if (content) {
            addJustifiedText(content);
          }
        } else {
          addJustifiedText(paragraph);
        }
        yPosition += 3;
      }
    });

    // ========== AVISO LEGAL ==========
    checkPageBreak(30);
    yPosition += 5;
    doc.setFillColor(255, 248, 220);
    doc.rect(margin, yPosition - 3, maxWidth, 20, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(139, 90, 0);
    doc.text("AVISO IMPORTANTE", margin + 2, yPosition + 2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const avisoText = "Esta análise é uma estimativa baseada em imagem e algoritmos de inteligência artificial. Para avaliação precisa do escore de condição corporal e decisões clínicas ou nutricionais, consulte um médico veterinário ou zootecnista qualificado.";
    const avisoLines = doc.splitTextToSize(avisoText, maxWidth - 4);
    avisoLines.forEach((line: string, index: number) => {
      doc.text(line, margin + 2, yPosition + 7 + (index * 4));
    });
    yPosition += 25;

    // ========== REFERÊNCIAS ==========
    addSectionTitle("Referências Técnicas");
    const referencias = [
      "NRC — Nutrient Requirements of Beef Cattle / Dairy Cattle / Horses",
      "Henneke et al. (1983) — Sistema de Escore Corporal para Equinos",
      "Edmonson et al. (1989) — Body Condition Scoring Chart for Holstein Dairy Cows",
      "Embrapa — Boletins Técnicos de Nutrição Animal",
      "Ferguson et al. (1994) — Principal Descriptors of Body Condition Score in Holstein Cows"
    ];
    doc.setFontSize(9);
    referencias.forEach((ref) => {
      checkPageBreak();
      doc.text("• " + ref, margin, yPosition);
      yPosition += 5;
    });

    // Adicionar rodapé na última página
    addFooter();

    doc.save("escore-corporal-vetagro.pdf");
    toast({
      title: "PDF gerado!",
      description: "Relatório técnico baixado com sucesso.",
    });
  };

  const handleAnalyze = async () => {
    if (loading) return;
    
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
    setResult("");
    
    try {
      const { data, error } = await supabase.functions.invoke("analyze-equine", {
        body: {
          images: [image],
          breed: species,
          age,
          purpose: `Avaliar Escore de Condição Corporal (ECC). Peso atual: ${weight}. 

INSTRUÇÕES DE FORMATAÇÃO:
- NÃO use asteriscos, hashtags ou emojis
- Use apenas marcadores • ou –
- Escreva em parágrafos longos e bem articulados
- Títulos de seção em MAIÚSCULAS seguidos de dois pontos
- Texto técnico, direto e profissional

ESTRUTURA OBRIGATÓRIA:

AVALIAÇÃO DO ESCORE:
Forneça o ECC estimado (escala 1-5 para bovinos/equinos ou 1-9 conforme espécie) com classificação textual (muito magro, magro, ideal, sobrepeso, obeso).

ANÁLISE VISUAL:
Descreva os achados visuais que fundamentam a pontuação: cobertura de costelas, depósitos de gordura, proeminência óssea, condição muscular.

INTERPRETAÇÃO CLÍNICA:
Explique o significado do escore encontrado para a saúde e desempenho do animal.

RECOMENDAÇÕES NUTRICIONAIS:
Ajustes específicos na dieta (aumentar/reduzir calorias, tipo de alimento, suplementação) baseados no escore.

ORIENTAÇÕES DE MANEJO:
Recomendações práticas de exercício, ambiente e acompanhamento.

MONITORAMENTO:
Frequência de reavaliação e metas de escore corporal.

REFERÊNCIAS:
Liste as fontes técnicas utilizadas (NRC, Henneke, Edmonson, Ferguson, Embrapa).`,
        },
      });

      if (error) throw error;

      if (!data?.review) {
        throw new Error("Resposta vazia do servidor");
      }

      const cleanedResult = cleanTextForDisplay(data.review);
      const finalResult = cleanedResult + "\n\n⚠️ Esta análise é uma estimativa baseada em imagem. Para avaliação precisa, consulte um médico veterinário ou zootecnista.";

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
                <div 
                  className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm leading-relaxed"
                  style={{ textAlign: "justify", textJustify: "inter-word" }}
                >
                  {result}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleCopyReport}
                    variant="outline"
                    className="flex-1"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar Relatório
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleDownloadPDF}
                    variant="default"
                    className="flex-1 bg-[#0d8b44] hover:bg-[#0a7038]"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar PDF
                  </Button>
                </div>
                
                <ReportExporter
                  title="Escore de Condição Corporal (ECC)"
                  content={result}
                  toolName="Escore de Condição Corporal"
                  userInputs={{
                    especie: species,
                    idade: age,
                    peso: weight,
                    dataAnalise: new Date().toLocaleDateString("pt-BR")
                  }}
                  className="w-full"
                  variant="outline"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EscoreCorporal;
