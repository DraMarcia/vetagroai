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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12 relative">
        {/* Background Banner */}
        <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl">
          <img 
            src={banner} 
            alt="Banner VetAgro Sustentável" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80" />
          
          {/* Content on top of banner */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            {/* Animated Logo */}
            <div className="mb-6 animate-[spin_20s_linear_infinite]">
              <img 
                src={logo} 
                alt="VetAGro Sustentável AI Logo" 
                className="w-48 h-48 object-contain rounded-full shadow-lg"
              />
            </div>
            
            <h1 className="mb-4 text-4xl font-bold text-foreground drop-shadow-lg">
              Bem-vindo à VetAgro IA
            </h1>
            <p className="text-lg text-foreground/90 max-w-3xl mx-auto mb-4 drop-shadow-md">
              Sua suíte inteligente para eficiência produtiva e sustentabilidade no campo.
              Aqui você acessa ferramentas avançadas para análise ambiental, modelagem agrícola, 
              estimativa de emissões, consultoria geoespacial e simulação de confinamento sustentável.
            </p>
            <p className="text-md text-foreground/80 max-w-2xl mx-auto mb-6 drop-shadow-md">
              Nossa missão é apoiar decisões embasadas, responsáveis e competitivas, 
              reduzindo riscos, elevando resultados e promovendo práticas agropecuárias regenerativas.
            </p>
            <Button
              size="lg"
              onClick={() => setAuthDialogOpen(true)}
              className="gap-2 shadow-lg"
            >
              <LogIn className="h-5 w-5" />
              Entrar
            </Button>
          </div>
        </div>
      </div>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />

      {/* CTA Section */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold text-foreground">Explore as ferramentas abaixo</h2>
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <p className="text-muted-foreground">Maximize seu potencial técnico com inteligência artificial aplicada</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
        {categories.map((category) => (
          <Card 
            key={category.title} 
            className="hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <CardHeader>
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center mb-4`}>
                <category.icon className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl group-hover:text-primary transition-colors">
                {category.title}
              </CardTitle>
              <CardDescription className="text-sm">
                {category.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
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
        <CardContent className="py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Crown className="h-6 w-6 text-amber-500" />
              <h3 className="text-xl font-semibold">Ferramentas avançadas exigem análise inteligente</h3>
            </div>
            <p className="text-muted-foreground mb-4 max-w-2xl mx-auto">
              A versão gratuita oferece simulações básicas. Os planos <strong>Pro</strong> e <strong>Enterprise</strong> liberam 
              relatórios técnicos, exportação, análises aprofundadas e inteligência aplicada.
            </p>
            <Link to="/planos">
              <Button variant="default" className="gap-2">
                <Crown className="h-4 w-4" />
                Ver Planos e Assinaturas
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
