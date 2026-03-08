import { useState, useEffect } from "react";
import { 
  Stethoscope, 
  Calculator, 
  Eye, 
  FileText, 
  Pill,
  BookOpen,
  Wheat,
  Leaf,
  Cloud,
  MapPin,
  Sparkles,
  Brain,
  ShoppingBag,
  User,
  FileSearch,
  Activity,
  TrendingUp,
  Warehouse,
  CreditCard,
  Lightbulb,
  Home,
  HelpCircle,
  Shield,
  LogOut,
  MonitorCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { ToolSuggestionDialog } from "@/components/ToolSuggestionDialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const categories = [
  {
    title: "Medicina Veterinária",
    icon: Stethoscope,
    items: [
      { title: "Diagnóstico Diferencial Inteligente", url: "/diagnostico-diferencial", icon: Stethoscope },
      { title: "Interpretação de Exames Laboratoriais e de Imagem", url: "/interpretacao-exames", icon: FileSearch },
      { title: "Calculadora de Dose Veterinária", url: "/calculadora-dose", icon: Calculator },
      { title: "Analisador de Mucosa Ocular e Sinais Clínicos", url: "/analise-mucosa", icon: Eye },
      { title: "Resenha Técnica de Equinos", url: "/resenha-equinos", icon: FileText },
      { title: "Receituário Veterinário", url: "/receituario", icon: Pill },
      { title: "Dicionário Farmacológico Veterinário", url: "/dicionario", icon: BookOpen },
    ],
  },
  {
    title: "Zootecnia e Nutrição",
    icon: Wheat,
    items: [
      { title: "Calculadora de Ração Inteligente", url: "/calculadora-racao", icon: Calculator },
      { title: "Painel de Inteligência Produtiva", url: "/analise-produtiva", icon: TrendingUp },
      { title: "Escore de Condição Corporal (ECC)", url: "/escore-corporal", icon: Activity },
    ],
  },
  {
    title: "Agronomia e Sustentabilidade",
    icon: Leaf,
    items: [
      { title: "Identificador de Plantas (Toxicologia Vegetal)", url: "/identificador-plantas", icon: Leaf },
      { title: "Calculadora Integrada de Emissões de GEE", url: "/calculadora-gee", icon: Cloud },
      { title: "Consulta Geoespacial Sustentável", url: "/consulta-geoespacial", icon: MapPin },
      { title: "Análise de Sustentabilidade", url: "/analise-sustentabilidade", icon: Leaf },
      { title: "Análise Climática Inteligente", url: "/analise-climatica", icon: Cloud },
      
    ],
  },
  {
    title: "Modelagem Avançada",
    icon: Brain,
    items: [
      { title: "Simulador de Confinamento Sustentável", url: "/simulador-confinamento", icon: Warehouse },
      { title: "Modelador de Carbono e Créditos Ambientais", url: "/modelador-carbono", icon: Leaf },
    ],
  },
  {
    title: "Outros",
    icon: Sparkles,
    items: [
      { title: "Planos e Assinaturas", url: "/planos", icon: CreditCard },
      { title: "FAQ – Perguntas Frequentes", url: "/faq", icon: HelpCircle },
      { title: "Produtos e Serviços", url: "/produtos-servicos", icon: ShoppingBag },
      { title: "Meu Espaço Inteligente", url: "/meu-perfil", icon: User },
      { title: "Blog", url: "/blog", icon: BookOpen },
      { title: "Política de Privacidade", url: "/politica-de-privacidade", icon: Shield },
    ],
  },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    <Sidebar className={open ? "w-64" : "w-16"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold text-primary">
            VetAgro IA
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" end>
                    <Home className="h-5 w-5" />
                    <span>Início</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {categories.map((category) => (
          <SidebarGroup key={category.title}>
            <SidebarGroupLabel className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <category.icon className="h-3.5 w-3.5" />
              {category.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {category.items.map((item) => (
                  <SidebarMenuItem key={item.url + item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span className="truncate">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-2">
        {user && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full gap-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="h-3.5 w-3.5" />
            {open && (isLoggingOut ? "Saindo..." : "Sair")}
          </Button>
        )}
        <ToolSuggestionDialog
          trigger={
            <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
              <Lightbulb className="h-3.5 w-3.5" />
              {open && "Sugerir Ferramenta"}
            </Button>
          }
        />
      </SidebarFooter>
    </Sidebar>
  );
}