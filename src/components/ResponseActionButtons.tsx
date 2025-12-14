import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import { cleanTextForDisplay } from "@/lib/textUtils";

interface ResponseActionButtonsProps {
  content: string;
  title?: string;
  toolName: string;
  className?: string;
}

/**
 * PADRÃO GLOBAL DE BOTÕES
 * Componente padronizado para todas as ferramentas do app
 * 
 * Botões:
 * 1. Copiar Resposta - copia TODO o texto mantendo estrutura
 * 2. Compartilhar Ferramenta - compartilha o link da ferramenta
 */
export function ResponseActionButtons({
  content,
  title,
  toolName,
  className = ""
}: ResponseActionButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Prepara o texto para cópia mantendo estrutura
  const prepareTextForCopy = (text: string): string => {
    // Remove símbolos de markdown mantendo estrutura
    let cleaned = text
      // Remove múltiplos asteriscos (bold/italic markdown)
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
      // Remove hashtags de títulos
      .replace(/^#{1,6}\s+/gm, '')
      // Normaliza bullets
      .replace(/^[•●○◦▪▸►→]\s*/gm, '- ')
      // Remove linhas vazias múltiplas
      .replace(/\n{3,}/g, '\n\n')
      // Limpa espaços extras
      .replace(/[ \t]+$/gm, '')
      .trim();
    
    return cleaned;
  };

  // Botão: Copiar Resposta
  const handleCopyResponse = async () => {
    if (!content.trim()) {
      toast.error("Nenhum conteúdo para copiar");
      return;
    }

    try {
      const cleanedContent = prepareTextForCopy(content);
      const header = title ? `${title}\n${'═'.repeat(50)}\n\n` : '';
      const footer = `\n\n${'─'.repeat(50)}\nGerado por VetAgro Sustentável AI\nwww.vetagroai.com.br`;
      
      const textToCopy = `${header}${cleanedContent}${footer}`;
      
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success("Resposta copiada! Pronta para colar em WhatsApp, Word ou e-mail.");
      
      setTimeout(() => setCopied(false), 2500);
    } catch (error) {
      console.error("Erro ao copiar:", error);
      toast.error("Erro ao copiar. Tente selecionar o texto manualmente.");
    }
  };

  // Botão: Compartilhar Ferramenta
  const handleShareTool = async () => {
    setSharing(true);
    
    const shareData = {
      title: `${toolName} - VetAgro Sustentável AI`,
      text: `Conheça a ferramenta ${toolName} do VetAgro Sustentável AI - Inteligência aplicada à saúde, produção e bem-estar animal.`,
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success("Ferramenta compartilhada!");
      } else {
        // Fallback: copia o link
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link da ferramenta copiado! Compartilhe com sua rede.");
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        // Fallback: copia o link
        try {
          await navigator.clipboard.writeText(window.location.href);
          toast.success("Link copiado para compartilhamento!");
        } catch {
          toast.error("Não foi possível compartilhar");
        }
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {/* Botão Copiar Resposta */}
      <Button
        onClick={handleCopyResponse}
        variant="default"
        size="default"
        className="flex items-center gap-2 bg-primary hover:bg-primary/90"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copiado!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copiar Resposta
          </>
        )}
      </Button>

      {/* Botão Compartilhar Ferramenta */}
      <Button
        onClick={handleShareTool}
        variant="outline"
        size="default"
        disabled={sharing}
        className="flex items-center gap-2"
      >
        <Share2 className="h-4 w-4" />
        Compartilhar Ferramenta
      </Button>
    </div>
  );
}
