import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { AuthDialog } from "@/components/AuthDialog";
import { AboutModal, useFirstVisitModal } from "@/components/AboutModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

import logoVeragro from "@/assets/logo-vetagro.png";
import logoWhite from "@/assets/logo-vetagro-white.png";
import bgFloresta from "@/assets/bg-floresta.jpeg";

import iconVeterinarios from "@/assets/profile-veterinarios.png";
import iconZootecnistas from "@/assets/profile-zootecnistas.png";
import iconAgronomos from "@/assets/profile-agronomos.png";
import iconProdutorRural from "@/assets/profile-produtor-rural.png";
import iconPesquisador from "@/assets/profile-pesquisador.png";
import iconOutrosRecursos from "@/assets/profile-outros-recursos.png";

const profiles = [
  { id: "veterinario", title: "Veterinários", description: "Otimize diagnósticos e protocolos de saúde", icon: iconVeterinarios, route: "/chat/veterinario" },
  { id: "zootecnista", title: "Zootecnistas", description: "Gestão inteligente de rebanhos e nutrição", icon: iconZootecnistas, route: "/chat/zootecnista" },
  { id: "agronomo", title: "Agrônomos", description: "Maximize a produção agrícola de forma sustentável", icon: iconAgronomos, route: "/chat/agronomo" },
  { id: "produtor", title: "Produtor Rural", description: "Aumente a eficiência e rentabilidade da propriedade", icon: iconProdutorRural, route: "/chat/produtor" },
  { id: "pesquisador", title: "Pesquisador", description: "Acesse dados e insights para inovação científica", icon: iconPesquisador, route: "/chat/pesquisador" },
  { id: "outros", title: "Outros Recursos", description: "Acesse planos, conteúdos e recursos complementares", icon: iconOutrosRecursos, route: null },
];

const Index = () => {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const { showModal: firstVisitModal, setShowModal: setFirstVisitModal } = useFirstVisitModal();
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleProfileClick = (profile: typeof profiles[0]) => {
    if (profile.id === "outros") {
      toast.info("Acesse pelo menu lateral", {
        description: "Os itens de Outros Recursos estão disponíveis na sidebar à esquerda.",
      });
      return;
    }
    if (!user) {
      toast.error("Cadastre-se para acessar esta funcionalidade.");
      setAuthDialogOpen(true);
      return;
    }
    if (profile.route) navigate(profile.route);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <AboutModal open={firstVisitModal} onOpenChange={setFirstVisitModal} />
      <AboutModal open={aboutModalOpen} onOpenChange={setAboutModalOpen} />

      {/* Hero — compact to fit everything in viewport */}
      <section
        className="relative flex-shrink-0 flex flex-col items-center justify-center"
        style={{ height: "clamp(180px, 32vh, 340px)" }}
      >
        <div className="absolute inset-0">
          <img
            src={bgFloresta}
            alt="Floresta amazônica"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(0,40,22,0.15), rgba(0,35,18,0.45))" }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-2xl mx-auto">
          <div className="relative mb-0">
            <div className="absolute inset-0 blur-3xl opacity-40 bg-white/30 rounded-full scale-150" />
            <img
              src={logoVeragro}
              alt="VetAgro IA Logo"
              className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 object-contain drop-shadow-xl"
            />
          </div>
          <h1
            className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mb-0"
            style={{ textShadow: "0 2px 16px rgba(0,0,0,0.5)", lineHeight: 1.1 }}
          >
            VetAgro IA
          </h1>
          <p
            className="text-xs sm:text-sm text-white/90 max-w-[90vw] md:whitespace-nowrap mx-auto mb-1.5 md:mb-2 leading-snug font-medium text-center"
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}
          >
            Suíte inteligente para análise ambiental, sustentabilidade e suporte técnico
          </p>
          <div className="flex flex-row gap-2 w-full max-w-[260px]">
            <Button
              size="sm"
              onClick={() => { if (user) navigate("/chat/produtor"); else setAuthDialogOpen(true); }}
              className="flex-1 gap-1.5 text-sm font-bold shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-lg h-10"
            >
              <img src={logoWhite} alt="" className="w-5 h-5 object-contain" />
              Entrar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAboutModalOpen(true)}
              className="flex-1 gap-1.5 text-sm font-bold shadow-md bg-white/95 text-foreground hover:bg-white border-white/60 rounded-lg h-10"
            >
              <Info className="h-4 w-4" />
              Sobre
            </Button>
          </div>
        </div>
      </section>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />

      {/* Profiles grid — fits remaining viewport */}
      <section className="flex-1 min-h-0 bg-muted/30 flex flex-col">
        <div className="flex-1 min-h-0 flex flex-col px-3 sm:px-4 py-2 max-w-4xl mx-auto w-full">
          <h2 className="text-sm sm:text-base md:text-lg font-extrabold text-primary text-center mb-2 flex-shrink-0 tracking-tight" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
            Explore as soluções
          </h2>
          <div className="flex-1 min-h-0 grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 content-start">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleProfileClick(profile)}
                className="relative rounded-2xl bg-card shadow-[0_4px_16px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.08)] border border-[hsl(0,0%,90%)] hover:border-primary/40 active:scale-[0.96] active:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-200 flex flex-col items-center justify-center gap-1 p-2 sm:p-3 md:p-4 text-center group cursor-pointer"
                style={{ background: "linear-gradient(to bottom, hsl(0,0%,100%), hsl(0,0%,97%))" }}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 flex-shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <img src={profile.icon} alt={profile.title} className="w-full h-full object-contain drop-shadow-md" />
                </div>
                <h3 className="text-xs sm:text-sm md:text-base font-extrabold text-foreground group-hover:text-primary transition-colors leading-tight tracking-tight" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                  {profile.title}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-snug line-clamp-2 hidden sm:block">
                  {profile.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
