import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Info, ChevronDown, ChevronRight, X } from "lucide-react";
import { AuthDialog } from "@/components/AuthDialog";
import { AboutModal, useFirstVisitModal } from "@/components/AboutModal";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

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
    id: "veterinarios",
    title: "Veterinários",
    description: "Otimize diagnósticos e protocolos de saúde",
    icon: iconVeterinarios,
    tools: [
      { label: "Diagnóstico Diferencial Inteligente", route: "/diagnostico-diferencial" },
      { label: "Interpretação de Exames", route: "/interpretacao-exames" },
      { label: "Calculadora de Dose Veterinária", route: "/calculadora-dose" },
      { label: "Analisador de Mucosa Ocular", route: "/analise-mucosa" },
      { label: "Resenha Técnica de Equinos", route: "/resenha-equinos" },
      { label: "Receituário Veterinário", route: "/receituario" },
      { label: "Dicionário Farmacológico", route: "/dicionario" },
    ],
  },
  {
    id: "zootecnistas",
    title: "Zootecnistas",
    description: "Gestão inteligente de rebanhos e nutrição",
    icon: iconZootecnistas,
    tools: [
      { label: "Calculadora de Ração Inteligente", route: "/calculadora-racao" },
      { label: "Painel de Inteligência Produtiva", route: "/analise-produtiva" },
      { label: "Escore de Condição Corporal (ECC)", route: "/escore-corporal" },
    ],
  },
  {
    id: "agronomos",
    title: "Agrônomos",
    description: "Maximize a produção agrícola de forma sustentável",
    icon: iconAgronomos,
    tools: [
      { label: "Identificador de Plantas", route: "/identificador-plantas" },
      { label: "Calculadora de Emissões de GEE", route: "/calculadora-gee" },
      { label: "Consulta Geoespacial Sustentável", route: "/consulta-geoespacial" },
      { label: "Análise de Sustentabilidade", route: "/analise-sustentabilidade" },
      { label: "Análise Climática Inteligente", route: "/analise-climatica" },
    ],
  },
  {
    id: "produtor",
    title: "Produtor Rural",
    description: "Aumente a eficiência e rentabilidade da propriedade",
    icon: iconProdutorRural,
    tools: [
      { label: "Simulador de Confinamento", route: "/simulador-confinamento" },
      { label: "Modelador de Carbono", route: "/modelador-carbono" },
      { label: "Calculadora de Ração", route: "/calculadora-racao" },
      { label: "Análise Produtiva", route: "/analise-produtiva" },
    ],
  },
  {
    id: "pesquisador",
    title: "Pesquisador",
    description: "Acesse dados e insights para inovação científica",
    icon: iconPesquisador,
    tools: [
      { label: "Calculadora de GEE (IPCC)", route: "/calculadora-gee" },
      { label: "Modelagem de Carbono", route: "/modelador-carbono" },
      { label: "Análise de Sustentabilidade", route: "/analise-sustentabilidade" },
      { label: "Simulador de Confinamento", route: "/simulador-confinamento" },
    ],
  },
  {
    id: "outros",
    title: "Outros Recursos",
    description: "Acesse planos, conteúdos e recursos complementares",
    icon: iconOutrosRecursos,
    tools: [
      { label: "Meu Espaço Inteligente", route: "/meu-perfil" },
      { label: "Planos e Assinaturas", route: "/planos" },
      { label: "FAQ – Perguntas Frequentes", route: "/faq" },
      { label: "Produtos e Serviços", route: "/produtos-servicos" },
      { label: "Blog", route: "/blog" },
      { label: "Política de Privacidade", route: "/politica-de-privacidade" },
      { label: "Monitoramento Técnico de IA", route: "/monitoramento-tecnico" },
    ],
  },
];

const Index = () => {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const { showModal: firstVisitModal, setShowModal: setFirstVisitModal } = useFirstVisitModal();
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleProfileClick = (profileId: string) => {
    setExpandedProfile(expandedProfile === profileId ? null : profileId);
  };

  const handleToolClick = (route: string) => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* First Visit Modal */}
      <AboutModal open={firstVisitModal} onOpenChange={setFirstVisitModal} />
      <AboutModal open={aboutModalOpen} onOpenChange={setAboutModalOpen} />

      {/* Hero Section — full viewport */}
      <section className="relative min-h-[55vh] md:min-h-[50vh] flex flex-col items-center justify-center">
        {/* Background image with dark green overlay */}
        <div className="absolute inset-0">
          <img
            src={bgFloresta}
            alt="Floresta amazônica"
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.85) contrast(1.12) saturate(1.08)" }}
            loading="eager"
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, rgba(0,40,25,0.50), rgba(0,40,25,0.60))",
            }}
          />
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 py-8 md:py-12 max-w-2xl mx-auto">
          <img
            src={logoVeragro}
            alt="VetAgro IA Logo"
            className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 object-contain mb-3 drop-shadow-lg"
          />

          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.35)" }}
          >
            VetAgro IA
          </h1>

          <p
            className="text-base sm:text-lg md:text-xl text-white/90 max-w-lg mx-auto mb-6 leading-relaxed font-medium"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.45)" }}
          >
            Uma suíte inteligente para análise ambiental, sustentabilidade pecuária e suporte técnico especializado
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-row gap-3 w-full max-w-xs sm:max-w-sm">
            <Button
              size="lg"
              onClick={() => {
                if (user) {
                  navigate("/dashboard");
                } else {
                  setAuthDialogOpen(true);
                }
              }}
              className="flex-1 gap-2 text-base font-semibold shadow-lg bg-[hsl(142,76%,26%)] hover:bg-[hsl(142,76%,22%)] text-white border-0"
            >
              <img src={logoVeragro} alt="" className="w-5 h-5 rounded-full" />
              {user ? "Acessar" : "Entrar"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setAboutModalOpen(true)}
              className="flex-1 gap-2 text-base font-semibold shadow-md bg-white/95 text-foreground hover:bg-white border-white/60"
            >
              <Info className="h-5 w-5" />
              Sobre
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 mt-auto pb-4 animate-bounce">
          <ChevronDown className="h-6 w-6 text-white/80" />
        </div>
      </section>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />

      {/* Solutions Section */}
      <section className="flex-1 bg-muted/30 py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2
            className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground text-center mb-8"
            style={{ textWrap: "balance" }}
          >
            Explore as soluções
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {profiles.map((profile) => {
              const isExpanded = expandedProfile === profile.id;
              return (
                <div
                  key={profile.id}
                  className={`
                    rounded-2xl bg-card border border-border shadow-sm
                    transition-all duration-300 ease-out
                    ${isExpanded ? "sm:col-span-2 lg:col-span-3 shadow-md border-primary/30" : "hover:shadow-md hover:border-primary/20"}
                  `}
                >
                  {/* Card header */}
                  <button
                    onClick={() => handleProfileClick(profile.id)}
                    className="w-full flex items-center gap-4 p-5 md:p-6 text-left group"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center">
                      <img
                        src={profile.icon}
                        alt={profile.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {profile.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-snug mt-0.5">
                        {profile.description}
                      </p>
                    </div>
                    <ChevronRight
                      className={`h-5 w-5 text-muted-foreground transition-transform duration-300 flex-shrink-0 ${
                        isExpanded ? "rotate-90 text-primary" : ""
                      }`}
                    />
                  </button>

                  {/* Expanded tools */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-out ${
                      isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-5 pb-5 md:px-6 md:pb-6 pt-0">
                      <div className="border-t border-border pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {profile.tools.map((tool) => (
                            <button
                              key={tool.route}
                              onClick={() => handleToolClick(tool.route)}
                              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left
                                hover:bg-primary/10 hover:text-primary transition-colors duration-150
                                active:scale-[0.97]"
                            >
                              <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-primary/60" />
                              <span className="truncate">{tool.label}</span>
                            </button>
                          ))}
                        </div>
                        {!user && (
                          <p className="text-xs text-destructive mt-3 font-medium">
                            Cadastre-se para acessar esta funcionalidade.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Floating chatbot button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          className="w-14 h-14 rounded-full shadow-lg overflow-hidden hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 ring-2 ring-white/30"
          aria-label="Assistente VetAgro"
        >
          <img src={chatbotLogo} alt="Assistente" className="w-full h-full object-cover" />
        </button>
      </div>
    </div>
  );
};

export default Index;
