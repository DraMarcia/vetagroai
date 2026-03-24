import { useState } from "react";
import { FileText, Download, Share2, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { exportToPDF } from "@/lib/reportExport";

interface ChatResponseActionsProps {
  content: string;
  profileTitle: string;
}

export function ChatResponseActions({ content, profileTitle }: ChatResponseActionsProps) {
  const [copied, setCopied] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showFormatted, setShowFormatted] = useState(false);

  const handleGenerateReport = () => {
    setShowFormatted(!showFormatted);
    if (!showFormatted) {
      toast.success("Relatório estruturado exibido abaixo.");
    }
  };

  const handleDownloadPDF = async () => {
    if (generatingPdf) return;
    setGeneratingPdf(true);
    try {
      const title = `Relatório ${profileTitle} - VetAgro IA`;
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
      const footer = `\n\n${"─".repeat(40)}\nGerado por VetAgro Sustentável AI\nwww.vetagroai.com.br`;
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

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleGenerateReport}
        className="text-xs gap-1.5 h-8"
      >
        <FileText className="h-3.5 w-3.5" />
        Gerar relatório
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
  );
}
