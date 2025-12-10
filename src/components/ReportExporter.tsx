import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, FileSpreadsheet, Download, Loader2, ChevronDown, BookOpen, FileType, Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import {
  exportToPDF,
  exportToDocx,
  exportToXlsx,
  exportToEpub,
  ReportData,
  defaultReferences
} from "@/lib/reportExport";
import { cleanTextForDisplay } from "@/lib/textUtils";

interface ReportExporterProps {
  title: string;
  content: string;
  toolName?: string;
  references?: string[];
  userInputs?: Record<string, string | number>;
  className?: string;
  variant?: "default" | "outline" | "secondary";
  showAllFormats?: boolean;
  showShare?: boolean;
  showCopy?: boolean;
}

export function ReportExporter({
  title,
  content,
  toolName,
  references = defaultReferences,
  userInputs,
  className = "",
  variant = "default",
  showAllFormats = true,
  showShare = true,
  showCopy = true
}: ReportExporterProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const reportData: ReportData = {
    title,
    content,
    toolName,
    references,
    userInputs,
    date: new Date()
  };

  const handleExport = async (format: "pdf" | "docx" | "xlsx" | "epub") => {
    if (!content.trim()) {
      toast.error("Nenhum conteúdo para exportar");
      return;
    }

    setIsExporting(format);

    try {
      switch (format) {
        case "pdf":
          await exportToPDF(reportData);
          toast.success("PDF gerado com sucesso!");
          break;
        case "docx":
          await exportToDocx(reportData);
          toast.success("Documento Word gerado com sucesso!");
          break;
        case "xlsx":
          await exportToXlsx(reportData);
          toast.success("Planilha Excel gerada com sucesso!");
          break;
        case "epub":
          await exportToEpub(reportData);
          toast.success("Arquivo EPUB gerado com sucesso!");
          break;
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error(`Erro ao exportar ${format.toUpperCase()}`);
    } finally {
      setIsExporting(null);
    }
  };

  const handleShare = async () => {
    const cleanedContent = cleanTextForDisplay(content);
    const shareText = cleanedContent.substring(0, 500) + (cleanedContent.length > 500 ? "..." : "");
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} - VetAgro Sustentável AI`,
          text: shareText,
          url: window.location.href
        });
        toast.success("Relatório compartilhado!");
      } catch (error) {
        // User cancelled or share failed
        if ((error as Error).name !== 'AbortError') {
          // Fallback to copy
          handleCopy();
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      handleCopy();
      toast.info("Link copiado! Cole para compartilhar.");
    }
  };

  const handleCopy = async () => {
    try {
      const cleanedContent = cleanTextForDisplay(content);
      const textToCopy = `${title}\n\n${cleanedContent}\n\n---\nGerado por VetAgro Sustentável AI\n${window.location.href}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success("Relatório copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erro ao copiar texto");
    }
  };

  if (!showAllFormats) {
    return (
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => handleExport("pdf")}
          disabled={isExporting !== null}
          variant={variant}
          className={className}
        >
          {isExporting === "pdf" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Baixar PDF
        </Button>
        
        {showCopy && (
          <Button variant="outline" size="default" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
            {copied ? "Copiado!" : "Copiar"}
          </Button>
        )}
        
        {showShare && (
          <Button variant="outline" size="default" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-1" />
            Compartilhar
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            disabled={isExporting !== null}
            variant={variant}
            className={className}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Exportar
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => handleExport("pdf")}
            disabled={isExporting !== null}
            className="cursor-pointer"
          >
            <FileText className="mr-2 h-4 w-4 text-red-500" />
            <span>PDF</span>
            <span className="ml-auto text-xs text-muted-foreground">Formal</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => handleExport("docx")}
            disabled={isExporting !== null}
            className="cursor-pointer"
          >
            <FileType className="mr-2 h-4 w-4 text-blue-500" />
            <span>Word (.docx)</span>
            <span className="ml-auto text-xs text-muted-foreground">Editável</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => handleExport("epub")}
            disabled={isExporting !== null}
            className="cursor-pointer"
          >
            <BookOpen className="mr-2 h-4 w-4 text-green-500" />
            <span>EPUB/HTML</span>
            <span className="ml-auto text-xs text-muted-foreground">Leitura</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => handleExport("xlsx")}
            disabled={isExporting !== null}
            className="cursor-pointer"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
            <span>Excel (.xlsx)</span>
            <span className="ml-auto text-xs text-muted-foreground">Dados</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {showCopy && (
        <Button variant="outline" size="default" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
          {copied ? "Copiado!" : "Copiar"}
        </Button>
      )}
      
      {showShare && (
        <Button variant="outline" size="default" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-1" />
          Compartilhar
        </Button>
      )}
    </div>
  );
}
