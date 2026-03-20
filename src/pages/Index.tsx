import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Info, ChevronRight } from "lucide-react";
import { AuthDialog } from "@/components/AuthDialog";
import { AboutModal, useFirstVisitModal } from "@/components/AboutModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

import logoVeragro from "@/assets/logo-vetagro.png";
import bgFloresta from "@/assets/bg-floresta.jpeg";

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
    tools: [],
    isMenuOnly: true,
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
    if (profileId === "outros") {
      toast.info("Acesse pelo menu lateral", {
        description: "Os itens de Outros Recursos estão disponíveis na sidebar à esquerda.",
      });
      return;
    }
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
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
      <AboutModal open={firstVisitModal} onOpenChange={setFirstVisitModal} />
      <AboutModal open={aboutModalOpen} onOpenChange={setAboutModalOpen} />

      {/* Hero Section */}
      <section className="relative flex-shrink-0 flex flex-col items-center justify-center"
        style={{ height: "clamp(180px, 38vh, 340px)" }}
      >
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
              background: "linear-gradient(to bottom, rgba(0,40,25,0.45), rgba(0,40,25,0.55))",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-4 py-4 max-w-xl mx-auto">
          <img
            src={logoVeragro}
            alt="VetAgro IA Logo"
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain mb-2 drop-shadow-lg"
          />
          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.35)", lineHeight: 1.1 }}
          >
            VetAgro IA
          </h1>
          <p
            className="text-sm sm:text-base md:text-lg text-white/90 max-w-md mx-auto mb-3 leading-snug font-medium"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.45)" }}
          >
            Uma suíte inteligente para análise ambiental, sustentabilidade pecuária e suporte técnico especializado
          </p>

          <div className="flex flex-row gap-3 w-full max-w-xs">
            <Button
              size="default"
              onClick={() => {
                if (user) navigate("/dashboard");
                else setAuthDialogOpen(true);
              }}
              className="flex-1 gap-2 text-sm font-semibold shadow-lg bg-[hsl(142,76%,26%)] hover:bg-[hsl(142,76%,22%)] text-white border-0"
            >
              <img src={logoVeragro} alt="" className="w-4 h-4 rounded-full" />
              {user ? "Acessar" : "Entrar"}
            </Button>
            <Button
              size="default"
              variant="outline"
              onClick={() => setAboutModalOpen(true)}
              className="flex-1 gap-2 text-sm font-semibold shadow-md bg-white/95 text-foreground hover:bg-white border-white/60"
            >
              <Info className="h-4 w-4" />
              Sobre
            </Button>
          </div>
        </div>
      </section>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />

      {/* Solutions Section — fills remaining space */}
      <section className="flex-1 bg-muted/30 overflow-hidden flex flex-col">
        <div className="container mx-auto px-3 py-3 md:py-4 max-w-5xl flex-1 flex flex-col overflow-hidden">
          <h2
            className="text-lg sm:text-xl md:text-2xl font-bold text-foreground text-center mb-3 flex-shrink-0"
            style={{ textWrap: "balance" }}
          >
            Explore as soluções
          </h2>

          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pb-2">
              {profiles.map((profile) => {
                const isExpanded = expandedProfile === profile.id;
                const isOtherResources = profile.id === "outros";

                return (
                  <div
                    key={profile.id}
                    className={`
                      rounded-2xl bg-card border border-border shadow-sm transition-all duration-300 ease-out
                      ${isExpanded ? "col-span-2 lg:col-span-3 shadow-md border-primary/30" : "hover:shadow-md hover:border-primary/20"}
                    `}
                  >
                    <button
                      onClick={() => handleProfileClick(profile.id)}
                      className="w-full flex flex-col items-center gap-1 p-3 md:p-4 text-center group"
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 flex items-center justify-center">
                        <img src={profile.icon} alt={profile.title} className="w-full h-full object-contain" />
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                        {profile.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-snug">
                        {profile.description}
                      </p>
                    </button>

                    {/* Expanded tools (not for "outros") */}
                    {!isOtherResources && (
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-out ${
                          isExpanded ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="px-3 pb-3 md:px-4 md:pb-4 pt-0">
                          <div className="border-t border-border pt-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                              {profile.tools.map((tool) => (
                                <button
                                  key={tool.route}
                                  onClick={() => handleToolClick(tool.route)}
                                  className="flex items-center gap-2 px-2 py-2 rounded-lg text-xs sm:text-sm text-left
                                    hover:bg-primary/10 hover:text-primary transition-colors duration-150
                                    active:scale-[0.97]"
                                >
                                  <ChevronRight className="h-3 w-3 flex-shrink-0 text-primary/60" />
                                  <span className="truncate">{tool.label}</span>
                                </button>
                              ))}
                            </div>
                            {!user && (
                              <p className="text-xs text-destructive mt-2 font-medium">
                                Cadastre-se para acessar esta funcionalidade.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
