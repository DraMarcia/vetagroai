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
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import DiagnosticoDiferencial from "./pages/DiagnosticoDiferencial";
import CalculadoraDose from "./pages/CalculadoraDose";
import AnaliseMucosa from "./pages/AnaliseMucosa";
import ResenhaEquinos from "./pages/ResenhaEquinos";
import Receituario from "./pages/Receituario";
import Dicionario from "./pages/Dicionario";
import CalculadoraRacao from "./pages/CalculadoraRacao";
import IdentificadorPlantas from "./pages/IdentificadorPlantas";
import CalculadoraGEE from "./pages/CalculadoraGEE";
import ConsultaGeoespacial from "./pages/ConsultaGeoespacial";
import AnaliseSustentabilidade from "./pages/AnaliseSustentabilidade";
import AnaliseClimatica from "./pages/AnaliseClimatica";
import AnaliseProdutiva from "./pages/AnaliseProdutiva";
import InterpretacaoExames from "./pages/InterpretacaoExames";
import EscoreCorporal from "./pages/EscoreCorporal";
import ProdutosServicos from "./pages/ProdutosServicos";
import MeuPerfil from "./pages/MeuPerfil";
import Blog from "./pages/Blog";
import Planos from "./pages/Planos";
import SimuladorConfinamento from "./pages/SimuladorConfinamento";
import ModeladorCarbono from "./pages/ModeladorCarbono";
import FAQ from "./pages/FAQ";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import MonitoramentoTecnico from "./pages/MonitoramentoTecnico";
import MonitoramentoCustos from "./pages/MonitoramentoCustos";
import RankingFerramentas from "./pages/RankingFerramentas";

const queryClient = new QueryClient();

// Layout with sidebar for tool pages
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
              {/* Landing page - with sidebar */}
              <Route path="/" element={<ToolLayout><Index /></ToolLayout>} />
              
              {/* Dashboard - custom layout */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Tool pages - with sidebar */}
              <Route path="/diagnostico-diferencial" element={<ToolLayout><DiagnosticoDiferencial /></ToolLayout>} />
              <Route path="/calculadora-dose" element={<ToolLayout><CalculadoraDose /></ToolLayout>} />
              <Route path="/analise-mucosa" element={<ToolLayout><AnaliseMucosa /></ToolLayout>} />
              <Route path="/resenha-equinos" element={<ToolLayout><ResenhaEquinos /></ToolLayout>} />
              <Route path="/receituario" element={<ToolLayout><Receituario /></ToolLayout>} />
              <Route path="/dicionario" element={<ToolLayout><Dicionario /></ToolLayout>} />
              <Route path="/calculadora-racao" element={<ToolLayout><CalculadoraRacao /></ToolLayout>} />
              <Route path="/identificador-plantas" element={<ToolLayout><IdentificadorPlantas /></ToolLayout>} />
              <Route path="/calculadora-gee" element={<ToolLayout><CalculadoraGEE /></ToolLayout>} />
              <Route path="/consulta-geoespacial" element={<ToolLayout><ConsultaGeoespacial /></ToolLayout>} />
              <Route path="/analise-sustentabilidade" element={<ToolLayout><AnaliseSustentabilidade /></ToolLayout>} />
              <Route path="/analise-climatica" element={<ToolLayout><AnaliseClimatica /></ToolLayout>} />
              <Route path="/interpretacao-exames" element={<ToolLayout><InterpretacaoExames /></ToolLayout>} />
              <Route path="/escore-corporal" element={<ToolLayout><EscoreCorporal /></ToolLayout>} />
              <Route path="/analise-produtiva" element={<ToolLayout><AnaliseProdutiva /></ToolLayout>} />
              <Route path="/produtos-servicos" element={<ToolLayout><ProdutosServicos /></ToolLayout>} />
              <Route path="/meu-perfil" element={<ToolLayout><MeuPerfil /></ToolLayout>} />
              <Route path="/blog" element={<ToolLayout><Blog /></ToolLayout>} />
              <Route path="/planos" element={<ToolLayout><Planos /></ToolLayout>} />
              <Route path="/simulador-confinamento" element={<ToolLayout><SimuladorConfinamento /></ToolLayout>} />
              <Route path="/modelador-carbono" element={<ToolLayout><ModeladorCarbono /></ToolLayout>} />
              <Route path="/faq" element={<ToolLayout><FAQ /></ToolLayout>} />
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
