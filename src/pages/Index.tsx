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

import iconVeterinarios from "@/assets/icon-veterinarios.png";
import iconZootecnistas from "@/assets/icon-zootecnistas.png";
import iconAgronomos from "@/assets/icon-agronomos.png";
import iconProdutorRural from "@/assets/icon-produtor-rural.png";
import iconPesquisador from "@/assets/icon-pesquisador.png";
import iconOutrosRecursos from "@/assets/icon-outros-recursos.png";

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

      {/* Hero — full bleed, no white bar */}
      <section className="relative flex-shrink-0 flex flex-col items-center justify-center" style={{ height: "clamp(220px, 45vh, 400px)" }}>
        <div className="absolute inset-0">
          <img
            src={bgFloresta}
            alt="Floresta amazônica"
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.88) contrast(1.15) saturate(1.15)" }}
            loading="eager"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,40,22,0.20), rgba(0,35,18,0.50))" }} />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-4 py-4 max-w-xl mx-auto">
          {/* Logo with glow — positioned lower */}
          <div className="relative mb-3 mt-2">
            <div className="absolute inset-0 blur-2xl opacity-35 bg-white/25 rounded-full scale-125" />
            <img
              src={logoVeragro}
              alt="VetAgro IA Logo"
              className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain drop-shadow-xl"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-1" style={{ textShadow: "0 2px 16px rgba(0,0,0,0.5)", lineHeight: 1.1 }}>
            VetAgro IA
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-white/90 max-w-sm mx-auto mb-3 leading-snug font-medium" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}>
            Suíte inteligente para análise ambiental, sustentabilidade pecuária e suporte técnico especializado
          </p>
          <div className="flex flex-row gap-3 w-full max-w-xs">
            <Button
              size="default"
              onClick={() => { if (user) navigate("/chat/produtor"); else setAuthDialogOpen(true); }}
              className="flex-1 gap-2 text-sm font-bold shadow-lg bg-[hsl(142,76%,26%)] hover:bg-[hsl(142,76%,22%)] text-white border-0"
            >
              <img src={logoWhite} alt="" className="w-6 h-6 object-contain" />
              Entrar
            </Button>
            <Button
              size="default"
              variant="outline"
              onClick={() => setAboutModalOpen(true)}
              className="flex-1 gap-2 text-sm font-bold shadow-md bg-white/95 text-foreground hover:bg-white border-white/60"
            >
              <Info className="h-4 w-4" />
              Sobre
            </Button>
          </div>
        </div>
      </section>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />

      {/* Profiles grid */}
      <section className="flex-1 bg-muted/30 overflow-hidden flex flex-col">
        <div className="container mx-auto px-3 py-2 max-w-4xl flex-1 flex flex-col overflow-hidden">
          <h2 className="text-sm sm:text-base font-bold text-foreground text-center mb-2 flex-shrink-0">
            Explore as soluções
          </h2>
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-2 content-start pb-1">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleProfileClick(profile)}
                className="rounded-xl bg-card border-2 border-[hsl(142,30%,75%)] shadow-sm hover:shadow-lg hover:border-primary/50 active:scale-[0.97] transition-all duration-200 flex flex-col items-center gap-0.5 p-2 text-center group cursor-pointer"
              >
                <div className="w-9 h-9 sm:w-11 sm:h-11 flex-shrink-0 flex items-center justify-center">
                  <img src={profile.icon} alt={profile.title} className="w-full h-full object-contain" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                  {profile.title}
                </h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-snug line-clamp-2">
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
