import { useState, useEffect } from "react";
import {
  Stethoscope, Wheat, Leaf, Tractor, FlaskConical,
  Sparkles, Home, HelpCircle, Shield, LogOut,
  MonitorCheck, DollarSign, Trophy, ChevronDown,
  User, CreditCard, ShoppingBag, BookOpen, Lightbulb,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { ToolSuggestionDialog } from "@/components/ToolSuggestionDialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import logoVeragroWhite from "@/assets/logo-vetagro-white.png";

import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const profileItems = [
  { title: "Veterinários", url: "/chat/veterinario", icon: Stethoscope },
  { title: "Zootecnistas", url: "/chat/zootecnista", icon: Wheat },
  { title: "Agrônomos", url: "/chat/agronomo", icon: Leaf },
  { title: "Produtor Rural", url: "/chat/produtor", icon: Tractor },
  { title: "Pesquisador", url: "/chat/pesquisador", icon: FlaskConical },
];

const outrosRecursosItems = [
  { title: "Meu Espaço Inteligente", url: "/meu-perfil", icon: User },
  { title: "Planos e Assinaturas", url: "/planos", icon: CreditCard },
  { title: "FAQ – Perguntas Frequentes", url: "/faq", icon: HelpCircle },
  { title: "Produtos e Serviços", url: "/produtos-servicos", icon: ShoppingBag },
  { title: "Blog", url: "/blog", icon: BookOpen },
  { title: "Política de Privacidade", url: "/politica-de-privacidade", icon: Shield },
  { title: "Monitoramento Técnico de IA", url: "/monitoramento-tecnico", icon: MonitorCheck },
  { title: "Custos de IA", url: "/monitoramento-custos", icon: DollarSign },
  { title: "Ranking de Ferramentas", url: "/ranking-ferramentas", icon: Trophy },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [outrosOpen, setOutrosOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const isOutrosRoute = outrosRecursosItems.some((item) => location.pathname === item.url);
    if (isOutrosRoute) setOutrosOpen(true);
  }, [location.pathname]);

  const handleProfileNav = (url: string) => {
    if (!user) {
      toast.error("Cadastre-se para acessar esta funcionalidade.");
      return;
    }
    navigate(url);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Sessão encerrada com sucesso");
      navigate("/");
    } catch (error: any) {
      toast.error("Erro ao sair: " + error.message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Sidebar
      className={`${open ? "w-64" : "w-16"} bg-[hsl(142,50%,12%)] text-white`}
      collapsible="icon"
    >
      <SidebarContent className="bg-gradient-to-b from-[hsl(142,50%,14%)] to-[hsl(142,50%,10%)]">
        {/* Logo + brand */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 px-3 py-4">
            <img src={logoVeragroWhite} alt="VetAgro IA" className="w-8 h-8 object-contain" />
            {open && (
              <span className="text-lg font-bold text-white tracking-tight">VetAgro IA</span>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/"
                    end
                    className="text-white/80 hover:text-white hover:bg-white/10"
                    activeClassName="bg-white/15 text-white font-medium"
                  >
                    <Home className="h-5 w-5" />
                    <span>Início</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Profile navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/50 px-3">
            Perfis
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {profileItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    onClick={() => handleProfileNav(item.url)}
                    className={`text-white/70 hover:text-white hover:bg-white/10 text-sm cursor-pointer ${
                      location.pathname === item.url ? "bg-white/15 text-white font-medium" : ""
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="truncate">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Outros Recursos — accordion */}
        <SidebarGroup>
          <button
            onClick={() => setOutrosOpen(!outrosOpen)}
            className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/50 px-3 py-2 w-full hover:text-white/70 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {open && (
              <>
                <span className="flex-1 text-left">Outros Recursos</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${outrosOpen ? "rotate-180" : ""}`}
                />
              </>
            )}
          </button>
          <div
            className={`overflow-hidden transition-all duration-200 ease-out ${
              outrosOpen ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="overflow-y-auto max-h-[280px] scrollbar-thin">
              <SidebarGroupContent>
                <SidebarMenu>
                  {outrosRecursosItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className="text-white/70 hover:text-white hover:bg-white/10 text-sm"
                          activeClassName="bg-white/15 text-white font-medium"
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="truncate">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </div>
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-[hsl(142,50%,10%)] p-3 space-y-2 border-t border-white/10">
        {user && (
          <div className="flex flex-col gap-1">
            {open && (
              <span className="text-xs text-white/50 truncate px-1">
                {user.email}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-2 text-xs text-red-300 hover:text-red-200 hover:bg-red-500/15"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="h-3.5 w-3.5" />
              {open && (isLoggingOut ? "Saindo..." : "Sair")}
            </Button>
          </div>
        )}
        <ToolSuggestionDialog
          trigger={
            <Button variant="ghost" size="sm" className="w-full gap-2 text-xs text-white/60 hover:text-white hover:bg-white/10">
              <Lightbulb className="h-3.5 w-3.5" />
              {open && "Sugerir Ferramenta"}
            </Button>
          }
        />
      </SidebarFooter>
    </Sidebar>
  );
}
