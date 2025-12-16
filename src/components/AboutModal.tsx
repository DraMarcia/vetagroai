import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Instagram, Sparkles, Heart, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import creatorPhoto from "@/assets/creator-photo.jpeg";

interface AboutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FIRST_VISIT_KEY = "vetagroai_first_visit_shown";

export function AboutModal({ open, onOpenChange }: AboutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <Heart className="h-5 w-5 text-rose-500" />
            Sobre o VetAgro AI
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center space-y-4">
          {/* Creator Photo */}
          <Avatar className="h-28 w-28 border-4 border-primary/20 shadow-lg">
            <AvatarImage 
              src={creatorPhoto} 
              alt="Dra. Márcia Salgado"
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-600 text-white text-2xl">
              MS
            </AvatarFallback>
          </Avatar>

          {/* Professional Signature */}
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">
              Dra. Márcia Salgado
            </h3>
            <p className="text-sm text-muted-foreground">
              Pesquisadora e Criadora
            </p>
            <p className="text-xs text-muted-foreground">
              Criadora e Desenvolvedora do VetAgro AI
            </p>
          </div>

          <Separator />

          {/* Welcome Message */}
          <div className="space-y-3 px-2">
            <p className="text-sm text-foreground leading-relaxed">
              Seja bem-vindo ao <strong>VetAgro AI</strong>, uma plataforma criada com paixão 
              para transformar a rotina de profissionais do agronegócio e da medicina veterinária.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nosso objetivo é democratizar o acesso a ferramentas de análise técnica, 
              sustentabilidade e diagnóstico, sempre com base em evidências científicas 
              e referências confiáveis.
            </p>
          </div>

          <Separator />

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <a
              href="https://www.instagram.com/vetagrosustentavel"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button variant="outline" className="w-full gap-2">
                <Instagram className="h-4 w-4 text-pink-600" />
                Siga no Instagram
              </Button>
            </a>
            <Link to="/" className="flex-1" onClick={() => onOpenChange(false)}>
              <Button className="w-full gap-2">
                <Sparkles className="h-4 w-4" />
                Explorar Ferramentas
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook para controlar o modal "Sobre" (abertura apenas por clique explícito)
export function useFirstVisitModal() {
  const [showModal, setShowModal] = useState(false);

  // Modal abre SOMENTE quando o usuário clica explicitamente no botão "Sobre"
  // Não há abertura automática na primeira visita

  return { showModal, setShowModal };
}
