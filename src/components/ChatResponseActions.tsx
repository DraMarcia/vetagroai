import { useState } from "react";
import { FileText, Download, Share2, Check, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { exportToPDF } from "@/lib/reportExport";
import { cleanTextForDisplay } from "@/lib/textUtils";

interface ChatResponseActionsProps {
  content: string;
  profileTitle: string;
}

/**
 * Parse AI response into structured report sections.
 * Tries to identify common patterns and organize into the required structure.
 */
function buildStructuredReport(content: string, profileTitle: string): { section: string; body: string }[] {
  const cleaned = cleanTextForDisplay(content);
  const lines = cleaned.split("\n").filter(l => l.trim());

  // Try to extract sections from the AI response
  const sections: { section: string; body: string }[] = [];
  let currentBody: string[] = [];
  let currentTitle = "";

  const sectionKeywords: Record<string, string[]> = {
    "RESUMO EXECUTIVO": ["resumo", "sintese", "overview", "sumario"],
    "DIAGNOSTICO TECNICO": ["diagnostico", "analise clinica", "avaliacao", "analise tecnica"],
    "CONDUTA RECOMENDADA": ["conduta", "tratamento", "terapia", "manejo recomendado", "recomendacoes"],
    "PROTOCOLO DE ACAO": ["protocolo", "passo a passo", "procedimento", "plano de acao", "acoes"],
    "PONTOS CRITICOS E RISCOS": ["riscos", "pontos criticos", "atencao", "alertas", "cuidados"],
    "CONSIDERACOES DE SUSTENTABILIDADE": ["sustentabilidade", "ambiental", "impacto ambiental", "emissoes"],
    "PERGUNTAS PARA CONTINUIDADE": ["perguntas", "proximos passos", "continuidade", "investigar"],
    "REFERENCIAS TECNICAS": ["referencias", "fontes", "literatura", "bibliografia"],
  };

  const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").trim();

  for (const line of lines) {
    const normalizedLine = normalize(line);
    let matched = false;

    // Check if line is a section header
    for (const [sectionName, keywords] of Object.entries(sectionKeywords)) {
      if (keywords.some(kw => normalizedLine.includes(kw) && line.trim().length < 80)) {
        // Save previous section
        if (currentTitle || currentBody.length > 0) {
          sections.push({ section: currentTitle || "RESUMO EXECUTIVO", body: currentBody.join("\n") });
        }
        currentTitle = sectionName;
        currentBody = [];
        matched = true;
        break;
      }
    }

    if (!matched) {
      currentBody.push(line);
    }
  }

  // Save last section
  if (currentTitle || currentBody.length > 0) {
    sections.push({ section: currentTitle || "RESUMO EXECUTIVO", body: currentBody.join("\n") });
  }

  // If we only got one section, split the content into logical parts
  if (sections.length <= 1) {
    const allText = cleaned;
    const paragraphs = allText.split("\n\n").filter(p => p.trim());
    
    const result: { section: string; body: string }[] = [];
    
    // First 2-3 sentences as executive summary
    const firstParagraph = paragraphs.slice(0, Math.min(2, paragraphs.length)).join("\n\n");
    result.push({ section: "RESUMO EXECUTIVO", body: firstParagraph });
    
    // Middle content as technical diagnosis
    if (paragraphs.length > 2) {
      const midStart = 2;
      const midEnd = Math.max(midStart + 1, Math.floor(paragraphs.length * 0.5));
      result.push({ section: "DIAGNOSTICO TECNICO", body: paragraphs.slice(midStart, midEnd).join("\n\n") });
    }
    
    // Recommendations
    if (paragraphs.length > 3) {
      const recStart = Math.floor(paragraphs.length * 0.5);
      const recEnd = Math.max(recStart + 1, Math.floor(paragraphs.length * 0.75));
      result.push({ section: "CONDUTA RECOMENDADA", body: paragraphs.slice(recStart, recEnd).join("\n\n") });
    }
    
    // Remaining as protocol
    if (paragraphs.length > 4) {
      const remaining = paragraphs.slice(Math.floor(paragraphs.length * 0.75)).join("\n\n");
      result.push({ section: "PROTOCOLO DE ACAO", body: remaining });
    }
    
    return result;
  }

  return sections;
}

export function ChatResponseActions({ content, profileTitle }: ChatResponseActionsProps) {
  const [copied, setCopied] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportSections, setReportSections] = useState<{ section: string; body: string }[] | null>(null);
  const [reportExpanded, setReportExpanded] = useState(true);

  const handleGenerateReport = () => {
    if (reportSections) {
      // Toggle visibility
      setReportExpanded(!reportExpanded);
      return;
    }

    setGeneratingReport(true);

    // Simulate processing with loading
    setTimeout(() => {
      const sections = buildStructuredReport(content, profileTitle);
      setReportSections(sections);
      setReportExpanded(true);
      setGeneratingReport(false);
      toast.success("Relatório técnico gerado com sucesso!");
    }, 2000);
  };

  const handleDownloadPDF = async () => {
    if (generatingPdf) return;
    setGeneratingPdf(true);
    try {
      const title = `Relatorio ${profileTitle} - VetAgro IA`;
      await exportToPDF({
        title,
        content,
        toolName: profileTitle,
        date: new Date(),
      });
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF. Tente copiar o relatório.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleShare = async () => {
    try {
      const cleanContent = content
        .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
        .replace(/^#{1,6}\s+/gm, "")
        .trim();

      const header = `${profileTitle} - VetAgro IA\n${"═".repeat(40)}\n\n`;
      const footer = `\n\n${"─".repeat(40)}\nGerado por VetAgro IA\n${WEBSITE_URL}`;
      const textToCopy = `${header}${cleanContent}${footer}`;

      if (navigator.share && navigator.canShare?.({ text: textToCopy })) {
        await navigator.share({
          title: `${profileTitle} - VetAgro IA`,
          text: textToCopy,
        });
        toast.success("Compartilhado!");
      } else {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        toast.success("Relatório copiado! Cole no WhatsApp, e-mail ou documento.");
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        toast.error("Não foi possível compartilhar.");
      }
    }
  };

  const WEBSITE_URL = "www.vetagroai.com.br";

  return (
    <div className="mt-2 space-y-2">
      {/* Action buttons row */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateReport}
          disabled={generatingReport}
          className="text-xs gap-1.5 h-8"
        >
          {generatingReport ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileText className="h-3.5 w-3.5" />
          )}
          {generatingReport ? "Gerando..." : reportSections ? (reportExpanded ? "Ocultar relatório" : "Ver relatório") : "Gerar relatório"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPDF}
          disabled={generatingPdf}
          className="text-xs gap-1.5 h-8"
        >
          {generatingPdf ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Baixar PDF
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="text-xs gap-1.5 h-8"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copiado!
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5" />
              Compartilhar
            </>
          )}
        </Button>
      </div>

      {/* Loading state */}
      {generatingReport && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-xs text-primary font-medium">Gerando relatório técnico estruturado...</span>
        </div>
      )}

      {/* Structured Report Card */}
      {reportSections && reportExpanded && (
        <div className="rounded-xl border-2 border-primary/20 bg-card overflow-hidden shadow-sm">
          {/* Report header */}
          <div className="bg-primary/10 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">RELATÓRIO TÉCNICO</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReportExpanded(false)}
              className="h-6 w-6 p-0"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>

          {/* Report title */}
          <div className="px-4 pt-3 pb-2 border-b border-border/50">
            <h3 className="text-sm font-bold text-foreground">{profileTitle} - VetAgro IA</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Report sections */}
          <div className="px-4 py-3 space-y-3">
            {reportSections.map((sec, idx) => (
              <div key={idx}>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wide">{sec.section}</h4>
                </div>
                <div className="pl-3 border-l-2 border-primary/15">
                  {sec.body.split("\n").filter(l => l.trim()).map((line, li) => {
                    const isBullet = line.trim().startsWith("-") || line.trim().startsWith("•");
                    return (
                      <p key={li} className={`text-xs text-foreground/90 leading-relaxed ${isBullet ? "pl-2" : ""} ${li > 0 ? "mt-1" : ""}`}>
                        {line.trim()}
                      </p>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Report footer actions */}
          <div className="px-4 py-3 bg-muted/30 border-t border-border/50 flex flex-wrap gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={generatingPdf}
              className="text-xs gap-1.5 h-7"
            >
              {generatingPdf ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
              Baixar PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="text-xs gap-1.5 h-7"
            >
              {copied ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
              {copied ? "Copiado!" : "Compartilhar"}
            </Button>
          </div>

          {/* Legal disclaimer */}
          <div className="px-4 py-2 bg-muted/30 border-t border-border/30">
            <p className="text-[9px] text-muted-foreground leading-tight">
              Esta analise e um apoio tecnico-consultivo. O julgamento profissional in loco e indispensavel.
            </p>
          </div>
        </div>
      )}

      {/* Collapsed report indicator */}
      {reportSections && !reportExpanded && (
        <button
          onClick={() => setReportExpanded(true)}
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          <ChevronDown className="h-3.5 w-3.5" />
          <span>Ver relatório técnico</span>
        </button>
      )}
    </div>
  );
}
