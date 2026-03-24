import { useState } from "react";
import { FileText, Download, Share2, Check, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { exportToPDF } from "@/lib/reportExport";
import { buildStructuredReport, type StructuredReport } from "@/lib/reportBuilder";

interface ChatResponseActionsProps {
  content: string;
  profileTitle: string;
}

const WEBSITE_URL = "www.vetagroai.com.br";

export function ChatResponseActions({ content, profileTitle }: ChatResponseActionsProps) {
  const [copied, setCopied] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [report, setReport] = useState<StructuredReport | null>(null);
  const [reportExpanded, setReportExpanded] = useState(true);

  const handleGenerateReport = () => {
    if (report) {
      setReportExpanded(!reportExpanded);
      return;
    }
    setGeneratingReport(true);
    setTimeout(() => {
      const result = buildStructuredReport(content, profileTitle);
      setReport(result);
      setReportExpanded(true);
      setGeneratingReport(false);
      toast.success("Relatório técnico gerado com sucesso!");
    }, 2000);
  };

  const handleDownloadPDF = async () => {
    if (generatingPdf) return;
    setGeneratingPdf(true);
    try {
      // If report was generated, use its references; otherwise auto-generate
      let references: string[] | undefined;
      if (report) {
        references = report.references;
      } else {
        const auto = buildStructuredReport(content, profileTitle);
        references = auto.references;
      }

      await exportToPDF({
        title: `Relatorio ${profileTitle} - VetAgro IA`,
        content,
        toolName: profileTitle,
        date: new Date(),
        references,
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
        await navigator.share({ title: `${profileTitle} - VetAgro IA`, text: textToCopy });
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

  return (
    <div className="mt-2 space-y-2">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleGenerateReport} disabled={generatingReport} className="text-xs gap-1.5 h-8">
          {generatingReport ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
          {generatingReport ? "Gerando..." : report ? (reportExpanded ? "Ocultar relatório" : "Ver relatório") : "Gerar relatório"}
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={generatingPdf} className="text-xs gap-1.5 h-8">
          {generatingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Baixar PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleShare} className="text-xs gap-1.5 h-8">
          {copied ? <><Check className="h-3.5 w-3.5" /> Copiado!</> : <><Share2 className="h-3.5 w-3.5" /> Compartilhar</>}
        </Button>
      </div>

      {/* Loading */}
      {generatingReport && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-xs text-primary font-medium">Gerando relatório técnico estruturado...</span>
        </div>
      )}

      {/* Structured Report Card */}
      {report && reportExpanded && (
        <div className="rounded-xl border-2 border-primary/20 bg-card overflow-hidden shadow-sm">
          {/* Header */}
          <div className="bg-primary/10 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">RELATÓRIO TÉCNICO</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setReportExpanded(false)} className="h-6 w-6 p-0">
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>

          {/* Title */}
          <div className="px-4 pt-3 pb-2 border-b border-border/50">
            <h3 className="text-sm font-bold text-foreground">{profileTitle} - VetAgro IA</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Sections */}
          <div className="px-4 py-3 space-y-3">
            {report.sections.map((sec, idx) => {
              const isRef = sec.section === "REFERENCIAS TECNICAS";
              return (
                <div key={idx}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isRef ? "bg-muted-foreground" : "bg-primary"}`} />
                    <h4 className={`text-xs font-bold uppercase tracking-wide ${isRef ? "text-muted-foreground" : "text-primary"}`}>
                      {sec.section}
                    </h4>
                  </div>
                  <div className={`pl-3 border-l-2 ${isRef ? "border-muted-foreground/20" : "border-primary/15"}`}>
                    {sec.body.split("\n").filter(l => l.trim()).map((line, li) => {
                      const isBullet = line.trim().startsWith("-") || line.trim().startsWith("•");
                      const isRefLine = line.trim().match(/^\[\d+\]/);
                      return (
                        <p
                          key={li}
                          className={`text-xs leading-relaxed ${li > 0 ? "mt-1" : ""} ${isBullet ? "pl-2 text-foreground/90" : ""} ${isRefLine ? "text-muted-foreground italic" : "text-foreground/90"}`}
                        >
                          {line.trim()}
                        </p>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="px-4 py-3 bg-muted/30 border-t border-border/50 flex flex-wrap gap-2">
            <Button variant="default" size="sm" onClick={handleDownloadPDF} disabled={generatingPdf} className="text-xs gap-1.5 h-7">
              {generatingPdf ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
              Baixar PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare} className="text-xs gap-1.5 h-7">
              {copied ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
              {copied ? "Copiado!" : "Compartilhar"}
            </Button>
          </div>

          {/* Disclaimer */}
          <div className="px-4 py-2 bg-muted/30 border-t border-border/30">
            <p className="text-[9px] text-muted-foreground leading-tight">
              Esta analise e um apoio tecnico-consultivo. O julgamento profissional in loco e indispensavel.
            </p>
          </div>
        </div>
      )}

      {/* Collapsed indicator */}
      {report && !reportExpanded && (
        <button onClick={() => setReportExpanded(true)} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
          <ChevronDown className="h-3.5 w-3.5" />
          <span>Ver relatório técnico</span>
        </button>
      )}
    </div>
  );
}
