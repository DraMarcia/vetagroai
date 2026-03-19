import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Settings,
  CreditCard,
  LogOut,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Stethoscope,
  Wheat,
  Leaf,
  Home as HomeIcon,
  FlaskConical,
  MoreHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfile, type UserProfile } from "@/contexts/ProfileContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import logoVeragro from "@/assets/logo-vetagro.png";

import iconVeterinarios from "@/assets/icon-veterinarios.png";
import iconZootecnistas from "@/assets/icon-zootecnistas.png";
import iconAgronomos from "@/assets/icon-agronomos.png";
import iconProdutorRural from "@/assets/icon-produtor-rural.png";
import iconPesquisador from "@/assets/icon-pesquisador.png";
import iconOutrosRecursos from "@/assets/icon-outros-recursos.png";

const profileMenuItems: { id: UserProfile; label: string; icon: string }[] = [
  { id: "veterinario", label: "Veterinários", icon: iconVeterinarios },
  { id: "zootecnista", label: "Zootecnistas", icon: iconZootecnistas },
  { id: "agronomo", label: "Agrônomos", icon: iconAgronomos },
  { id: "produtor", label: "Produtor Rural", icon: iconProdutorRural },
  { id: "pesquisador", label: "Pesquisador", icon: iconPesquisador },
];

const outrosRecursosItems = [
  { label: "Planos e Assinaturas", url: "/planos" },
  { label: "FAQ", url: "/faq" },
  { label: "Blog", url: "/blog" },
  { label: "Política de Privacidade", url: "/politica-de-privacidade" },
];

const mockHistory = {
  hoje: [
    "Diagnóstico bovino com febre",
    "Cálculo de ração para confinamento",
  ],
  semana: [
    "Emissões de GEE do lote 3",
    "Interpretação de hemograma",
    "Análise climática Roraima",
  ],
  anteriores: [
    "Plano alimentar para vacas em lactação",
    "Receituário anti-parasitário",
  ],
};

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function DashboardSidebar({ collapsed, onToggle }: DashboardSidebarProps) {
  const navigate = useNavigate();
  const { activeProfile, setActiveProfile } = useProfile();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [outrosOpen, setOutrosOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      toast.success("Sessão encerrada com sucesso");
      navigate("/");
    } catch (error: any) {
      toast.error("Erro ao sair: " + error.message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";
  const userEmail = user?.email || "";

  if (collapsed) {
    return (
      <div className="w-16 h-full bg-gradient-to-b from-[hsl(142,40%,22%)] to-[hsl(142,45%,15%)] flex flex-col items-center py-4 gap-3">
        <button onClick={onToggle} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <img src={logoVeragro} alt="VetAgro IA" className="w-8 h-8 object-contain" />
        </button>
        <div className="flex-1 flex flex-col items-center gap-2 mt-4">
          {profileMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveProfile(item.id)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                activeProfile === item.id
                  ? "bg-white/20 ring-1 ring-white/30"
                  : "hover:bg-white/10"
              }`}
              title={item.label}
            >
              <img src={item.icon} alt={item.label} className="w-6 h-6 object-contain" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 h-full bg-gradient-to-b from-[hsl(142,40%,22%)] to-[hsl(142,45%,15%)] flex flex-col text-white">
      {/* Logo */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-3">
        <button onClick={onToggle} className="hover:opacity-80 transition-opacity">
          <img src={logoVeragro} alt="VetAgro IA" className="w-10 h-10 object-contain" />
        </button>
        <span className="text-lg font-bold tracking-tight text-white">VetAgro IA</span>
      </div>

      {/* Profile Menu */}
      <nav className="px-3 space-y-0.5">
        {profileMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveProfile(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeProfile === item.id
                ? "bg-white/15 text-white shadow-sm"
                : "text-white/75 hover:bg-white/10 hover:text-white"
            }`}
          >
            <img src={item.icon} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
            <span>{item.label}</span>
          </button>
        ))}

        {/* Outros Recursos - colapsável */}
        <div>
          <button
            onClick={() => setOutrosOpen(!outrosOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white transition-all"
          >
            <img src={iconOutrosRecursos} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
            <span className="flex-1 text-left">Outros Recursos</span>
            {outrosOpen ? (
              <ChevronDown className="w-4 h-4 text-white/50" />
            ) : (
              <ChevronRight className="w-4 h-4 text-white/50" />
            )}
          </button>
          {outrosOpen && (
            <div className="ml-8 mt-1 space-y-0.5">
              {outrosRecursosItems.map((item) => (
                <button
                  key={item.url}
                  onClick={() => navigate(item.url)}
                  className="w-full text-left px-3 py-2 rounded-md text-xs text-white/65 hover:bg-white/10 hover:text-white transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Divider */}
      <div className="mx-5 my-3 border-t border-white/15" />

      {/* Search */}
      <div className="px-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/10 border-white/15 text-white placeholder:text-white/40 text-sm h-9 focus-visible:ring-white/30"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-3 mt-2 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1.5 text-xs bg-white/10 border-white/15 text-white hover:bg-white/20 hover:text-white"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo Chat
        </Button>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1 px-3 mt-3">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/40 px-3 mb-1.5 font-medium">Hoje</p>
            {mockHistory.hoje.map((item, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-white/40" />
                <span className="truncate">{item}</span>
              </button>
            ))}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/40 px-3 mb-1.5 font-medium">Últimos 7 dias</p>
            {mockHistory.semana.map((item, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-white/40" />
                <span className="truncate">{item}</span>
              </button>
            ))}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/40 px-3 mb-1.5 font-medium">Anteriores</p>
            {mockHistory.anteriores.map((item, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-white/40" />
                <span className="truncate">{item}</span>
              </button>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* User Footer */}
      <div className="border-t border-white/15 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-white truncate">{userName}</p>
                {userEmail && (
                  <p className="text-[10px] text-white/50 truncate">{userEmail}</p>
                )}
              </div>
              <MoreHorizontal className="w-4 h-4 text-white/50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate("/meu-perfil")}>
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/planos")}>
              <CreditCard className="w-4 h-4 mr-2" />
              Plano
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? "Saindo..." : "Sair"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
