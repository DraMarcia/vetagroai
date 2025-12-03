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
  Crown
} from "lucide-react";
import logo from "@/assets/logo.jpg";
import banner from "@/assets/banner.jpg";
import { AuthDialog } from "@/components/AuthDialog";

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

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      {/* Hero Section - Mobile First */}
      <div className="mb-6 md:mb-12 relative">
        <div className="relative w-full h-[320px] sm:h-[380px] md:h-[450px] lg:h-[500px] rounded-xl md:rounded-2xl overflow-hidden shadow-xl md:shadow-2xl">
          <img 
            src={banner} 
            alt="Banner VetAgro Sustentável" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background/85" />
          
          {/* Content - Mobile Optimized */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 py-6">
            {/* Logo - Responsive Size */}
            <div className="mb-3 md:mb-6 animate-[spin_20s_linear_infinite]">
              <img 
                src={logo} 
                alt="VetAGro Sustentável AI Logo" 
                className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 object-contain rounded-full shadow-lg"
              />
            </div>
            
            {/* Title - Responsive Font */}
            <h1 className="mb-2 md:mb-4 text-2xl sm:text-3xl md:text-4xl font-bold text-foreground drop-shadow-lg">
              VetAgro IA
            </h1>
            
            {/* Short Description - Mobile Friendly */}
            <p className="text-sm sm:text-base md:text-lg text-foreground/90 max-w-md md:max-w-2xl mx-auto mb-4 md:mb-6 drop-shadow-md leading-relaxed px-2">
              Uma suíte inteligente para análise ambiental, sustentabilidade pecuária e suporte técnico veterinário. 
              Acesse ferramentas práticas para eficiência, bem-estar animal e decisões baseadas em dados.
            </p>
            
            {/* CTA Button - Always Visible */}
            <Button
              size="lg"
              onClick={() => setAuthDialogOpen(true)}
              className="gap-2 shadow-lg text-sm sm:text-base px-6 py-2.5 md:px-8 md:py-3"
            >
              <LogIn className="h-4 w-4 md:h-5 md:w-5" />
              Entrar
            </Button>
          </div>
        </div>
      </div>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />

      {/* CTA Section - Compact */}
      <div className="text-center mb-6 md:mb-10">
        <div className="flex items-center justify-center gap-2 mb-1 md:mb-2">
          <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground">Explore as ferramentas</h2>
          <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-primary" />
        </div>
        <p className="text-sm md:text-base text-muted-foreground">Maximize seu potencial técnico com IA aplicada</p>
      </div>

      {/* Categories Grid - Responsive */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8 md:mb-12">
        {categories.map((category) => (
          <Card 
            key={category.title} 
            className="hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <CardHeader className="pb-2 md:pb-4">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center mb-3 md:mb-4`}>
                <category.icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <CardTitle className="text-base md:text-xl group-hover:text-primary transition-colors">
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

      {/* Subscription Block - Compact */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-5 md:py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
              <Crown className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
              <h3 className="text-base md:text-xl font-semibold">Ferramentas avançadas</h3>
            </div>
            <p className="text-xs md:text-base text-muted-foreground mb-3 md:mb-4 max-w-xl mx-auto px-2">
              A versão gratuita oferece simulações básicas. Os planos <strong>Pro</strong> e <strong>Enterprise</strong> liberam 
              relatórios técnicos, exportação e análises aprofundadas.
            </p>
            <Link to="/planos">
              <Button variant="default" size="sm" className="gap-2 md:text-base">
                <Crown className="h-4 w-4" />
                Ver Planos
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
