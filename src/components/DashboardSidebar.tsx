import { useState, useEffect, useRef } from "react";
import {
  Search, Plus, Settings, CreditCard, LogOut,
  MessageSquare, ChevronDown, ChevronRight,
  MoreHorizontal, Star, Trash2, FileText, BookmarkCheck,
  Home, Camera,
} from "lucide-react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfile, type UserProfile } from "@/contexts/ProfileContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfilePhoto } from "@/hooks/useProfilePhoto";
import { useConversations, type Conversation } from "@/hooks/useConversations";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import logoVeragro from "@/assets/sidebar-icon-logo.png";
import iconVeterinarios from "@/assets/sidebar-icon-veterinarios.png";
import iconZootecnistas from "@/assets/sidebar-icon-zootecnistas.png";
import iconAgronomos from "@/assets/sidebar-icon-agronomos.png";
import iconProdutorRural from "@/assets/sidebar-icon-produtor-rural.png";
import iconPesquisador from "@/assets/sidebar-icon-pesquisador.png";
import iconOutrosRecursos from "@/assets/sidebar-icon-outros-recursos.png";

const profileMenuItems: { id: UserProfile; label: string; icon: string }[] = [
  { id: "veterinario", label: "Veterinários", icon: iconVeterinarios },
  { id: "zootecnista", label: "Zootecnistas", icon: iconZootecnistas },
  { id: "agronomo", label: "Agrônomos", icon: iconAgronomos },
  { id: "produtor", label: "Produtor Rural", icon: iconProdutorRural },
  { id: "pesquisador", label: "Pesquisador", icon: iconPesquisador },
];

const outrosRecursosItems = [
  { label: "Planos e Assinaturas", url: "/planos" },
  { label: "FAQ – Perguntas Frequentes", url: "/faq" },
  { label: "Produtos e Serviços", url: "/produtos-servicos" },
  { label: "Meu Espaço Inteligente", url: "/meu-perfil" },
  { label: "Blog", url: "/blog" },
  { label: "Política de Privacidade", url: "/politica-de-privacidade" },
  { label: "Monitoramento Técnico", url: "/monitoramento-tecnico" },
  { label: "Custos de IA", url: "/monitoramento-custos" },
  { label: "Ranking de Ferramentas", url: "/ranking-ferramentas" },
];

type SidebarView = "history" | "favorites" | "reports" | "search";

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function DashboardSidebar({ collapsed, onToggle }: DashboardSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();
  const { activeProfile, setActiveProfile } = useProfile();
  const [user, setUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Conversation[] | null>(null);
  const [outrosOpen, setOutrosOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeView, setActiveView] = useState<SidebarView>("history");
  const [expandedProfile, setExpandedProfile] = useState<UserProfile | null>(activeProfile);

  const {
    conversations, groupedConversations, createConversation,
    toggleFavorite, deleteConversation, searchConversations,
  } = useConversations(activeProfile);

  const favorites = conversations.filter(c => c.is_favorite);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Sync profile from URL
  useEffect(() => {
    const match = location.pathname.match(/\/chat\/(\w+)/);
    if (match && match[1] !== activeProfile) {
      setActiveProfile(match[1] as UserProfile);
      setExpandedProfile(match[1] as UserProfile);
    }
  }, [location.pathname]);

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

  const handleProfileClick = (id: UserProfile) => {
    if (activeProfile === id) {
      setExpandedProfile(expandedProfile === id ? null : id);
    } else {
      setActiveProfile(id);
      setExpandedProfile(id);
      navigate(`/chat/${id}`);
    }
  };

  const handleNewChat = async () => {
    navigate(`/chat/${activeProfile}`);
    // Clear conv param to start fresh
    window.history.replaceState({}, "", `/chat/${activeProfile}`);
    window.location.reload();
  };

  const handleOpenConversation = (conv: Conversation) => {
    navigate(`/chat/${conv.profile_id}?conv=${conv.id}`);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const results = await searchConversations(searchQuery);
    setSearchResults(results);
    setActiveView("search");
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";
  const userEmail = user?.email || "";
  const { photoUrl, uploading, uploadPhoto } = useProfilePhoto(user?.id);

  const handleAvatarClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadPhoto(file);
    e.target.value = "";
  };

  if (collapsed) {
    return (
      <div className="w-16 h-full bg-gradient-to-b from-[hsl(142,40%,22%)] to-[hsl(142,45%,15%)] flex flex-col items-center py-4 gap-3">
        <button onClick={onToggle} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <img src={logoVeragro} alt="VetAgro IA" className="w-10 h-10 object-contain" />
        </button>
        <button
          onClick={() => navigate("/")}
          className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          title="Início"
        >
          <Home className="w-5 h-5 text-white/80" />
        </button>
        <div className="flex-1 flex flex-col items-center gap-2 mt-2">
          {profileMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleProfileClick(item.id)}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                activeProfile === item.id ? "bg-white/20 ring-1 ring-white/30" : "hover:bg-white/10"
              }`}
              title={item.label}
            >
              <img src={item.icon} alt={item.label} className="w-8 h-8 object-contain" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const grouped = groupedConversations();

  return (
    <div className="w-72 h-full bg-gradient-to-b from-[hsl(142,40%,22%)] to-[hsl(142,45%,15%)] flex flex-col text-white">
      {/* Logo */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-3">
        <button onClick={onToggle} className="hover:opacity-80 transition-opacity">
          <img src={logoVeragro} alt="VetAgro IA" className="w-14 h-14 object-contain" />
        </button>
        <span className="text-lg font-bold tracking-tight text-white">VetAgro IA</span>
      </div>

      {/* Home button */}
      <div className="px-3 mb-0.5">
        <button
          onClick={() => navigate("/")}
          translate="no"
          className="notranslate w-full min-w-0 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white transition-all overflow-hidden"
        >
          <Home className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1 text-left truncate">Início</span>
        </button>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 overflow-y-auto sidebar-green-scroll">
        {/* Profiles with workspace items */}
        <nav className="px-3 space-y-0.5">
          {profileMenuItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => handleProfileClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeProfile === item.id
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <img src={item.icon} alt="" className="w-8 h-8 object-contain flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {activeProfile === item.id && (
                  expandedProfile === item.id
                    ? <ChevronDown className="w-3.5 h-3.5 text-white/50" />
                    : <ChevronRight className="w-3.5 h-3.5 text-white/50" />
                )}
              </button>

              {/* Workspace items for active profile */}
              {expandedProfile === item.id && activeProfile === item.id && (
                <div className="ml-6 mt-1 space-y-0.5">
                  <button
                    onClick={handleNewChat}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo Chat VetAgro</span>
                  </button>
                  <button
                    onClick={() => setActiveView("history")}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors ${activeView === "history" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Histórico</span>
                  </button>
                  <button
                    onClick={() => setActiveView("favorites")}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors ${activeView === "favorites" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>Favoritos</span>
                    {favorites.length > 0 && (
                      <span className="ml-auto text-[10px] bg-white/20 px-1.5 rounded-full">{favorites.length}</span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveView("reports")}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors ${activeView === "reports" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Relatórios</span>
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Outros Recursos */}
          <div>
            <button
              onClick={() => setOutrosOpen(!outrosOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white transition-all"
            >
              <img src={iconOutrosRecursos} alt="" className="w-7 h-7 object-contain flex-shrink-0" />
              <span className="flex-1 text-left">Outros Recursos</span>
              {outrosOpen ? <ChevronDown className="w-4 h-4 text-white/50" /> : <ChevronRight className="w-4 h-4 text-white/50" />}
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
              placeholder="Buscar no histórico..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) setSearchResults(null);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              className="pl-9 bg-white/10 border-white/15 text-white placeholder:text-white/40 text-sm h-9 focus-visible:ring-white/30"
            />
          </div>
        </div>

        {/* Content area based on active view */}
        <div className="px-3 mt-3 pb-3">
        {activeView === "search" && searchResults !== null ? (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-white/40 px-3 mb-2 font-medium">
              {searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""}
            </p>
            {searchResults.length === 0 ? (
              <p className="text-xs text-white/50 px-3 py-4 text-center">Nenhuma conversa encontrada</p>
            ) : (
              searchResults.map((conv) => (
                <ConversationItem key={conv.id} conv={conv} onClick={handleOpenConversation} onToggleFavorite={toggleFavorite} onDelete={deleteConversation} />
              ))
            )}
          </div>
        ) : activeView === "favorites" ? (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-white/40 px-3 mb-2 font-medium">Favoritos</p>
            {favorites.length === 0 ? (
              <p className="text-xs text-white/50 px-3 py-4 text-center">Nenhuma conversa favorita</p>
            ) : (
              favorites.map((conv) => (
                <ConversationItem key={conv.id} conv={conv} onClick={handleOpenConversation} onToggleFavorite={toggleFavorite} onDelete={deleteConversation} />
              ))
            )}
          </div>
        ) : activeView === "reports" ? (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-white/40 px-3 mb-2 font-medium">Relatórios</p>
            <div className="px-3 py-6 text-center">
              <FileText className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/50">Relatórios técnicos serão gerados aqui</p>
              <p className="text-[10px] text-white/30 mt-1">Em breve: exportação em PDF</p>
            </div>
          </div>
        ) : (
          /* History view */
          <div className="space-y-4">
            {grouped.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <MessageSquare className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-xs text-white/50">Nenhuma conversa ainda</p>
                <p className="text-[10px] text-white/30 mt-1">Inicie um novo chat acima</p>
              </div>
            ) : (
              grouped.map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] uppercase tracking-wider text-white/40 px-3 mb-1.5 font-medium">{group.label}</p>
                  {group.items.map((conv) => (
                    <ConversationItem key={conv.id} conv={conv} onClick={handleOpenConversation} onToggleFavorite={toggleFavorite} onDelete={deleteConversation} />
                  ))}
                </div>
              ))
            )}
          </div>
        )}
        </div>
      </div>

      {/* User Footer */}
      <div className="border-t border-white/15 p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex items-center gap-3 px-3 py-2.5">
          {/* Clickable avatar for photo upload */}
          <button
            onClick={handleAvatarClick}
            className="relative group flex-shrink-0"
            title="Alterar foto de perfil"
            disabled={uploading}
          >
            <Avatar className="h-9 w-9 border-2 border-white/20 group-hover:border-white/50 transition-colors">
              <AvatarImage src={photoUrl || undefined} alt={userName} className="object-cover" />
              <AvatarFallback className="bg-white/20 text-white text-sm font-semibold">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-3.5 h-3.5 text-white" />
            </div>
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>

          {/* User info + dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex-1 flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity">
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-white truncate">{userName}</p>
                  <p className="text-[10px] text-white/50 truncate">{userEmail}</p>
                </div>
                <MoreHorizontal className="w-4 h-4 text-white/50 flex-shrink-0" />
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
              <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                {isLoggingOut ? "Saindo..." : "Sair"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

/* ── Conversation list item ── */
function ConversationItem({ conv, onClick, onToggleFavorite, onDelete }: {
  conv: Conversation;
  onClick: (conv: Conversation) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const date = new Date(conv.updated_at);
  const dateStr = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  return (
    <div className="group w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs hover:bg-white/10 transition-colors cursor-pointer">
      <button onClick={() => onClick(conv)} className="flex-1 flex items-center gap-2 min-w-0 text-left">
        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-white/40" />
        <span className="truncate text-white/70 group-hover:text-white">{conv.title}</span>
      </button>
      <span className="text-[10px] text-white/30 flex-shrink-0">{dateStr}</span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(conv.id); }}
          className="p-1 rounded hover:bg-white/10"
          title={conv.is_favorite ? "Remover favorito" : "Favoritar"}
        >
          <Star className={`w-3 h-3 ${conv.is_favorite ? "text-yellow-400 fill-yellow-400" : "text-white/40"}`} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
          className="p-1 rounded hover:bg-red-500/20"
          title="Excluir"
        >
          <Trash2 className="w-3 h-3 text-white/40 hover:text-red-300" />
        </button>
      </div>
    </div>
  );
}
