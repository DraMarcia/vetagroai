import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ChatbotAssistant } from "@/components/ChatbotAssistant";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
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

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-12 items-center px-3 bg-transparent">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
      <ChatbotAssistant />
    </SidebarProvider>
  );
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
              <Route path="/" element={<AppLayout><Index /></AppLayout>} />
              <Route path="/chat/:profileId" element={<AppLayout><ChatProfile /></AppLayout>} />
              <Route path="/meu-perfil" element={<AppLayout><MeuPerfil /></AppLayout>} />
              <Route path="/planos" element={<AppLayout><Planos /></AppLayout>} />
              <Route path="/faq" element={<AppLayout><FAQ /></AppLayout>} />
              <Route path="/produtos-servicos" element={<AppLayout><ProdutosServicos /></AppLayout>} />
              <Route path="/blog" element={<AppLayout><Blog /></AppLayout>} />
              <Route path="/politica-de-privacidade" element={<AppLayout><PoliticaPrivacidade /></AppLayout>} />
              <Route path="/monitoramento-tecnico" element={<AppLayout><MonitoramentoTecnico /></AppLayout>} />
              <Route path="/monitoramento-custos" element={<AppLayout><MonitoramentoCustos /></AppLayout>} />
              <Route path="/ranking-ferramentas" element={<AppLayout><RankingFerramentas /></AppLayout>} />
              {/* Legacy redirects — all go to home */}
              <Route path="/dashboard" element={<AppLayout><Index /></AppLayout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnalyticsProvider>
        </BrowserRouter>
      </SubscriptionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
