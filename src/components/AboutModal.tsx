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
          <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-lg">
            <AvatarImage 
              src="https://media.licdn.com/dms/image/v2/D4D03AQEfN-KIB-8zYw/profile-displayphoto-shrink_800_800/B4DZWBEVXaHYAc-/0/1741641594633?e=1742428800&v=beta&t=Gq4wFW9ZJ6g7YH8xVQ5xqNzRwEyLpMgKvL8qMzMnOxY" 
              alt="Dra. Márcia Salgado"
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
              Médica Veterinária • CRMV-MG
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

// Hook para mostrar modal na primeira visita
export function useFirstVisitModal() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem(FIRST_VISIT_KEY);
    if (!hasVisited) {
      // Pequeno delay para não interferir com o carregamento
      const timer = setTimeout(() => {
        setShowModal(true);
        localStorage.setItem(FIRST_VISIT_KEY, "true");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  return { showModal, setShowModal };
}
