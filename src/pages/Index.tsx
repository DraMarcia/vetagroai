import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, Info, ArrowDown } from "lucide-react";
import { AuthDialog } from "@/components/AuthDialog";
import { AboutModal, useFirstVisitModal } from "@/components/AboutModal";

import logoVeragro from "@/assets/logo-vetagro.png";
import bgFloresta from "@/assets/bg-floresta.jpeg";
import chatbotLogo from "@/assets/chatbot-logo.jpeg";

import iconVeterinarios from "@/assets/icon-veterinarios.png";
import iconZootecnistas from "@/assets/icon-zootecnistas.png";
import iconAgronomos from "@/assets/icon-agronomos.png";
import iconProdutorRural from "@/assets/icon-produtor-rural.png";
import iconPesquisador from "@/assets/icon-pesquisador.png";
import iconOutrosRecursos from "@/assets/icon-outros-recursos.png";

const profiles = [
  {
    title: "Veterinários",
    description: "Otimize diagnósticos e protocolos de saúde",
    icon: iconVeterinarios,
  },
  {
    title: "Zootecnistas",
    description: "Gestão inteligente de rebanhos e nutrição",
    icon: iconZootecnistas,
  },
  {
    title: "Agrônomos",
    description: "Maximize a produção agrícola de forma sustentável",
    icon: iconAgronomos,
  },
  {
    title: "Produtor Rural",
    description: "Aumente a eficiência e rentabilidade da propriedade",
    icon: iconProdutorRural,
  },
  {
    title: "Pesquisador",
    description: "Acesse dados e insights para inovação científica",
    icon: iconPesquisador,
  },
  {
    title: "Outros Recursos",
    description: "Acesse planos, conteúdos e recursos complementares",
    icon: iconOutrosRecursos,
  },
];

const Index = () => {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const { showModal: firstVisitModal, setShowModal: setFirstVisitModal } = useFirstVisitModal();

  return (
    <div className="min-h-screen bg-background">
      {/* First Visit Modal */}
      <AboutModal open={firstVisitModal} onOpenChange={setFirstVisitModal} />
      <AboutModal open={aboutModalOpen} onOpenChange={setAboutModalOpen} />

      {/* Hero Section */}
      <div className="relative min-h-[75vh] md:min-h-[65vh] flex flex-col items-center justify-center">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src={bgFloresta}
            alt="Floresta amazônica"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/30 to-background/90" />
        </div>

        {/* Content */}
        <div className="relative flex flex-col items-center text-center px-6 py-10">
          <img
            src={logoVeragro}
            alt="VetAgro IA Logo"
            className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 object-contain mb-4 drop-shadow-lg"
          />

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 drop-shadow-md">
            VetAgro IA
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-foreground/85 max-w-lg mx-auto mb-8 drop-shadow-sm leading-relaxed">
            Uma suíte inteligente para análise ambiental, sustentabilidade pecuária e suporte técnico especializado
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-row gap-3 w-full max-w-xs sm:max-w-sm">
            <Button
              size="lg"
              onClick={() => setAuthDialogOpen(true)}
              className="flex-1 gap-2 text-base font-semibold shadow-lg"
            >
              <img src={logoVeragro} alt="" className="w-5 h-5 rounded-full" />
              Entrar
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setAboutModalOpen(true)}
              className="flex-1 gap-2 text-base font-semibold shadow-md bg-background/90 backdrop-blur-sm"
            >
              <Info className="h-5 w-5" />
              Sobre
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative mt-auto pb-6">
          <div className="animate-bounce">
            <ArrowDown className="h-5 w-5 text-primary" />
          </div>
        </div>
      </div>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />

      {/* Solutions Section */}
      <div className="container mx-auto px-4 py-10 md:py-14 max-w-4xl">
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground text-center mb-8">
          Explore as soluções
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {profiles.map((profile) => (
            <button
              key={profile.title}
              onClick={() => setAuthDialogOpen(true)}
              className="group flex flex-col items-center text-center p-5 md:p-6 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/30"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mb-3 flex items-center justify-center">
                <img
                  src={profile.icon}
                  alt={profile.title}
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {profile.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
                {profile.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Floating chatbot button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          className="w-14 h-14 rounded-full shadow-lg overflow-hidden hover:shadow-xl transition-shadow hover:scale-105"
          aria-label="Assistente VetAgro"
        >
          <img src={chatbotLogo} alt="Assistente" className="w-full h-full object-cover" />
        </button>
      </div>
    </div>
  );
};

export default Index;
