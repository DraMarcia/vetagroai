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
import Dashboard from "./pages/Dashboard";
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

// Layout with sidebar for all pages
function ToolLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background px-4">
            <SidebarTrigger />
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
              {/* Landing page */}
              <Route path="/" element={<ToolLayout><Index /></ToolLayout>} />

              {/* Chat-first profile routes */}
              <Route path="/chat/:profileId" element={<ToolLayout><ChatProfile /></ToolLayout>} />

              {/* Dashboard (legacy) */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Institutional / resource pages */}
              <Route path="/meu-perfil" element={<ToolLayout><MeuPerfil /></ToolLayout>} />
              <Route path="/planos" element={<ToolLayout><Planos /></ToolLayout>} />
              <Route path="/faq" element={<ToolLayout><FAQ /></ToolLayout>} />
              <Route path="/produtos-servicos" element={<ToolLayout><ProdutosServicos /></ToolLayout>} />
              <Route path="/blog" element={<ToolLayout><Blog /></ToolLayout>} />
              <Route path="/politica-de-privacidade" element={<ToolLayout><PoliticaPrivacidade /></ToolLayout>} />
              <Route path="/monitoramento-tecnico" element={<ToolLayout><MonitoramentoTecnico /></ToolLayout>} />
              <Route path="/monitoramento-custos" element={<ToolLayout><MonitoramentoCustos /></ToolLayout>} />
              <Route path="/ranking-ferramentas" element={<ToolLayout><RankingFerramentas /></ToolLayout>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnalyticsProvider>
        </BrowserRouter>
      </SubscriptionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
