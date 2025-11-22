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
  FileSearch,
  Image as ImageIcon,
  Video,
  Wand2,
  Sparkles,
  Mic,
  MessageSquare,
  Brain,
  ShoppingBag,
  User
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const categories = [
  {
    title: "Medicina Veterinária",
    icon: Stethoscope,
    items: [
      { title: "Diagnóstico Diferencial", url: "/diagnostico-diferencial", icon: Stethoscope },
      { title: "Calculadora de Dose", url: "/calculadora-dose", icon: Calculator },
      { title: "Análise de Mucosa", url: "/analise-mucosa", icon: Eye },
      { title: "Resenha de Equinos", url: "/resenha-equinos", icon: FileText },
      { title: "Receituário Veterinário", url: "/receituario", icon: Pill },
      { title: "Dicionário Veterinário", url: "/dicionario", icon: BookOpen },
    ],
  },
  {
    title: "Zootecnia e Nutrição",
    icon: Wheat,
    items: [
      { title: "Calculadora de Ração", url: "/calculadora-racao", icon: Calculator },
    ],
  },
  {
    title: "Agronomia e Sustentabilidade",
    icon: Leaf,
    items: [
      { title: "Identificador de Plantas", url: "/identificador-plantas", icon: Leaf },
      { title: "Calculadora de GEE", url: "/calculadora-gee", icon: Cloud },
      { title: "Consulta Geoespacial", url: "/consulta-geoespacial", icon: MapPin },
    ],
  },
  {
    title: "Comunicação e Conteúdo",
    icon: FileSearch,
    items: [
      { title: "Análise de Artigos", url: "/analise-artigos", icon: FileSearch },
      { title: "Análise de Imagens", url: "/analise-imagens", icon: ImageIcon },
      { title: "Análise de Vídeos", url: "/analise-videos", icon: Video },
      { title: "Editor de Imagens", url: "/editor-imagens", icon: Wand2 },
      { title: "Gerador de Imagens", url: "/gerador-imagens", icon: Sparkles },
      { title: "Gerador de Vídeos", url: "/gerador-videos", icon: Video },
    ],
  },
  {
    title: "Voz e Áudio",
    icon: Mic,
    items: [
      { title: "Transcritor de Notas", url: "/transcritor-notas", icon: Mic },
      { title: "Assistente de Voz", url: "/assistente-voz", icon: MessageSquare },
    ],
  },
  {
    title: "Modelagem Avançada",
    icon: Brain,
    items: [
      { title: "Modelador de Cenários", url: "/modelador-cenarios", icon: Brain },
    ],
  },
  {
    title: "Outros",
    icon: Sparkles,
    items: [
      { title: "Produtos e Serviços", url: "/produtos-servicos", icon: ShoppingBag },
      { title: "Meu Perfil", url: "/meu-perfil", icon: User },
      { title: "Blog", url: "/blog", icon: BookOpen },
    ],
  },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();

  return (
    <Sidebar className={open ? "w-64" : "w-16"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold">VetAgro IA</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" end>
                    <Sparkles className="h-5 w-5" />
                    <span>Início</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {categories.map((category) => (
          <SidebarGroup key={category.title}>
            <SidebarGroupLabel>
              <category.icon className="h-4 w-4 mr-2" />
              {category.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {category.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
