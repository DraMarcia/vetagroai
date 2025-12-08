import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Stethoscope, 
  Wheat, 
  Leaf, 
  Brain,
  ArrowRight,
  LogIn,
  Sparkles,
  Crown,
  Info
} from "lucide-react";
import logo from "@/assets/logo.jpg";
import banner from "@/assets/banner.jpg";
import { AuthDialog } from "@/components/AuthDialog";
import { AboutModal, useFirstVisitModal } from "@/components/AboutModal";

const categories = [
  {
    title: "Medicina Veterinária e Saúde Animal",
    description: "Diagnóstico, dosagem, análises clínicas e receituário",
    icon: Stethoscope,
    tools: 7,
    color: "from-green-500 to-emerald-600",
  },
  {
    title: "Zootecnia, Nutrição e Produção Animal",
    description: "Formulação de rações, análise produtiva e escore corporal",
    icon: Wheat,
    tools: 3,
    color: "from-amber-500 to-orange-600",
  },
  {
    title: "Agronomia, Fitotecnia e Sustentabilidade",
    description: "Identificação de plantas, emissões e consultas geoespaciais",
    icon: Leaf,
    tools: 6,
    color: "from-green-600 to-teal-600",
  },
  {
    title: "Modelagem e Análises Avançadas",
    description: "Simuladores de confinamento e modelagem de carbono",
    icon: Brain,
    tools: 2,
    color: "from-indigo-500 to-purple-600",
  },
];

const Index = () => {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const { showModal: firstVisitModal, setShowModal: setFirstVisitModal } = useFirstVisitModal();

  return (
    <div className="min-h-screen">
      {/* First Visit Modal */}
      <AboutModal 
        open={firstVisitModal} 
        onOpenChange={setFirstVisitModal} 
      />
      
      {/* About Modal (triggered by button) */}
      <AboutModal 
        open={aboutModalOpen} 
        onOpenChange={setAboutModalOpen} 
      />

      {/* Hero Section - Full Screen on Mobile */}
      <div className="relative min-h-[85vh] md:min-h-[70vh] flex flex-col">
        {/* Background Image - Ultra HD without blur */}
        <div className="absolute inset-0">
          <img 
            src={banner} 
            alt="Banner VetAgro Sustentável" 
            className="w-full h-full object-cover"
            loading="eager"
          />
          {/* Soft overlay for text readability - maintains image sharpness */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background/85" />
        </div>
        
        {/* Hero Content - Centered */}
        <div className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-8">
          {/* Logo */}
          <div className="mb-4 md:mb-6 animate-[spin_20s_linear_infinite]">
            <img 
              src={logo} 
              alt="VetAGro Sustentável AI Logo" 
              className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 object-contain rounded-full shadow-xl border-4 border-background/30"
            />
          </div>
          
          {/* Title */}
          <h1 className="mb-3 md:mb-4 text-3xl sm:text-4xl md:text-5xl font-bold text-foreground drop-shadow-lg">
            VetAgro IA
          </h1>
          
          {/* Short Description */}
          <p className="text-sm sm:text-base md:text-lg text-foreground/90 max-w-sm md:max-w-xl mx-auto mb-6 md:mb-8 drop-shadow-md leading-relaxed">
            Uma suíte inteligente para análise ambiental, sustentabilidade pecuária e suporte técnico veterinário. 
            Acesse ferramentas práticas para eficiência, bem-estar animal e decisões baseadas em dados.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              onClick={() => setAuthDialogOpen(true)}
              className="gap-2 shadow-xl text-base px-8 py-3 md:px-10 md:py-4"
            >
              <LogIn className="h-5 w-5" />
              Entrar
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setAboutModalOpen(true)}
              className="gap-2 shadow-lg text-base px-6 py-3 bg-background/80 backdrop-blur-sm"
            >
              <Info className="h-5 w-5" />
              Sobre
            </Button>
          </div>
        </div>

        {/* Scroll Indicator - Peek of next section */}
        <div className="relative bg-gradient-to-t from-background to-transparent py-6 md:py-8">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-foreground">Explore as ferramentas</h2>
              <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">Maximize seu potencial técnico com IA aplicada</p>
            <div className="mt-3 animate-bounce">
              <ArrowRight className="h-5 w-5 mx-auto text-primary rotate-90" />
            </div>
          </div>
        </div>
      </div>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />

      {/* Tools Section - Below the fold */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Categories Grid */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8 md:mb-12">
          {categories.map((category) => (
            <Card 
              key={category.title} 
              className="hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <CardHeader className="pb-2 md:pb-4">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center mb-3 md:mb-4`}>
                  <category.icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <CardTitle className="text-base md:text-lg group-hover:text-primary transition-colors">
                  {category.title}
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  {category.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm text-muted-foreground">
                    {category.tools} {category.tools === 1 ? 'ferramenta' : 'ferramentas'}
                  </span>
                  <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Subscription Block */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/20">
          <CardContent className="py-6 md:py-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
                <Crown className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
                <h3 className="text-base md:text-xl font-semibold">Ferramentas avançadas</h3>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mb-4 max-w-xl mx-auto px-2">
                A versão gratuita oferece simulações básicas. Os planos <strong>Pro</strong> e <strong>Enterprise</strong> liberam 
                relatórios técnicos, exportação e análises aprofundadas.
              </p>
              <Link to="/planos">
                <Button variant="default" size="sm" className="gap-2">
                  <Crown className="h-4 w-4" />
                  Ver Planos
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
