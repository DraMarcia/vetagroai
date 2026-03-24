import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { ChatbotAssistant } from "@/components/ChatbotAssistant";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Menu } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import Index from "./pages/Index";
import ChatProfile from "./pages/ChatProfile";
import NotFound from "./pages/NotFound";
import MeuPerfil from "./pages/MeuPerfil";
import Blog from "./pages/Blog";
import Planos from "./pages/Planos";
import FAQ from "./pages/FAQ";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import MonitoramentoTecnico from "./pages/MonitoramentoTecnico";
import MonitoramentoCustos from "./pages/MonitoramentoCustos";
import RankingFerramentas from "./pages/RankingFerramentas";
import ProdutosServicos from "./pages/ProdutosServicos";

const queryClient = new QueryClient();

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <ProfileProvider>
      <div className="flex h-screen w-full overflow-hidden relative">
        {/* Mobile: hamburger button always visible */}
        {isMobile && !mobileSidebarOpen && (
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="fixed top-3 left-3 z-50 p-2 rounded-lg bg-background/80 backdrop-blur-sm shadow-md border border-border"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
        )}

        {/* Mobile: overlay sidebar */}
        {isMobile && mobileSidebarOpen && (
          <>
            <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setMobileSidebarOpen(false)} />
            <div className="fixed inset-y-0 left-0 z-50 w-72 animate-in slide-in-from-left duration-200">
              <DashboardSidebar
                collapsed={false}
                onToggle={() => setMobileSidebarOpen(false)}
              />
            </div>
          </>
        )}

        {/* Desktop: normal sidebar */}
        {!isMobile && (
          <DashboardSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
      <ChatbotAssistant />
    </ProfileProvider>
  );
}

function VisitorLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Green hamburger overlaid on hero image */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-3 left-3 z-50 p-2 rounded-lg transition-colors"
        style={{ color: "hsl(142,76%,36%)" }}
        aria-label="Menu"
      >
        <Menu className="h-6 w-6 drop-shadow-md" />
      </button>

      {/* Overlay sidebar drawer */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-64 animate-in slide-in-from-left duration-200">
            <SidebarProvider defaultOpen={true}>
              <AppSidebar />
            </SidebarProvider>
          </div>
        </>
      )}

      <main className="w-full h-full overflow-hidden">{children}</main>
      <ChatbotAssistant />
    </div>
  );
}

function SmartLayout({ children, isHome }: { children: React.ReactNode; isHome?: boolean }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="h-screen bg-background" />;

  if (!user && isHome) {
    return <VisitorLayout>{children}</VisitorLayout>;
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SubscriptionProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnalyticsProvider>
            <Routes>
              <Route path="/" element={<SmartLayout isHome><Index /></SmartLayout>} />
              <Route path="/chat/:profileId" element={<AuthenticatedLayout><ChatProfile /></AuthenticatedLayout>} />
              <Route path="/meu-perfil" element={<AuthenticatedLayout><MeuPerfil /></AuthenticatedLayout>} />
              <Route path="/planos" element={<AuthenticatedLayout><Planos /></AuthenticatedLayout>} />
              <Route path="/faq" element={<AuthenticatedLayout><FAQ /></AuthenticatedLayout>} />
              <Route path="/produtos-servicos" element={<AuthenticatedLayout><ProdutosServicos /></AuthenticatedLayout>} />
              <Route path="/blog" element={<AuthenticatedLayout><Blog /></AuthenticatedLayout>} />
              <Route path="/politica-de-privacidade" element={<AuthenticatedLayout><PoliticaPrivacidade /></AuthenticatedLayout>} />
              <Route path="/monitoramento-tecnico" element={<AuthenticatedLayout><MonitoramentoTecnico /></AuthenticatedLayout>} />
              <Route path="/monitoramento-custos" element={<AuthenticatedLayout><MonitoramentoCustos /></AuthenticatedLayout>} />
              <Route path="/ranking-ferramentas" element={<AuthenticatedLayout><RankingFerramentas /></AuthenticatedLayout>} />
              <Route path="/dashboard" element={<SmartLayout isHome><Index /></SmartLayout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnalyticsProvider>
        </BrowserRouter>
      </SubscriptionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
