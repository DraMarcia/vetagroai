import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
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
import AnaliseArtigos from "./pages/AnaliseArtigos";
import AnaliseImagens from "./pages/AnaliseImagens";
import AnaliseVideos from "./pages/AnaliseVideos";
import EditorImagens from "./pages/EditorImagens";
import GeradorImagens from "./pages/GeradorImagens";
import GeradorVideos from "./pages/GeradorVideos";
import TranscritorNotas from "./pages/TranscritorNotas";
import AssistenteVoz from "./pages/AssistenteVoz";
import ModeladorCenarios from "./pages/ModeladorCenarios";
import ProdutosServicos from "./pages/ProdutosServicos";
import MeuPerfil from "./pages/MeuPerfil";
import Blog from "./pages/Blog";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
              <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background px-4">
                <SidebarTrigger />
              </header>
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/diagnostico-diferencial" element={<DiagnosticoDiferencial />} />
                  <Route path="/calculadora-dose" element={<CalculadoraDose />} />
                  <Route path="/analise-mucosa" element={<AnaliseMucosa />} />
                  <Route path="/resenha-equinos" element={<ResenhaEquinos />} />
                  <Route path="/receituario" element={<Receituario />} />
                  <Route path="/dicionario" element={<Dicionario />} />
                  <Route path="/calculadora-racao" element={<CalculadoraRacao />} />
                  <Route path="/identificador-plantas" element={<IdentificadorPlantas />} />
                  <Route path="/calculadora-gee" element={<CalculadoraGEE />} />
                  <Route path="/consulta-geoespacial" element={<ConsultaGeoespacial />} />
                  <Route path="/analise-artigos" element={<AnaliseArtigos />} />
                  <Route path="/analise-imagens" element={<AnaliseImagens />} />
                  <Route path="/analise-videos" element={<AnaliseVideos />} />
                  <Route path="/editor-imagens" element={<EditorImagens />} />
                  <Route path="/gerador-imagens" element={<GeradorImagens />} />
                  <Route path="/gerador-videos" element={<GeradorVideos />} />
                  <Route path="/transcritor-notas" element={<TranscritorNotas />} />
                  <Route path="/assistente-voz" element={<AssistenteVoz />} />
                  <Route path="/modelador-cenarios" element={<ModeladorCenarios />} />
                  <Route path="/produtos-servicos" element={<ProdutosServicos />} />
                  <Route path="/meu-perfil" element={<MeuPerfil />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
