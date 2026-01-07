import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Zap, Sparkles, Building2, ArrowRight, Lightbulb, Brain, BarChart3, Leaf } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { AuthDialog } from "@/components/AuthDialog";
import { trackSubscriptionClick } from "@/lib/analytics";

const MERCADO_PAGO_CREDITS_LINK = "https://mpago.la/12xcSRW";

const MERCADO_PAGO_LINKS = {
  pro: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=71757e967b5049e5bfa5e88c022b357c",
  enterprise: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=8662444c7a604ea196aca59c150313f1",
};

const plans = [
  {
    id: "free",
    name: "Livre",
    subtitle: "Para começar a explorar",
    price: "Grátis",
    period: "",
    icon: Zap,
    features: [
      "10 créditos por dia",
      "Ferramentas básicas",
      "Acesso ao chatbot assistente",
      "Exploração inicial das funcionalidades",
    ],
    buttonText: "Começar grátis",
  },
  {
    id: "pro",
    name: "Pró",
    subtitle: "Para profissionais",
    price: "R$ 39,90",
    period: "/mês",
    icon: Sparkles,
    popular: true,
    features: [
      "Uso ilimitado das ferramentas VetAgro AI",
      "Relatórios técnicos estruturados",
      "Conteúdo profissional pronto para copiar e compartilhar",
      "Referências científicas confiáveis integradas às respostas",
      "Exportação do conteúdo em texto estruturado",
      "Histórico completo das interações",
    ],
    buttonText: "Assinar agora",
  },
  {
    id: "enterprise",
    name: "Empresa",
    subtitle: "Para equipes e empresas",
    price: "R$ 129,90",
    period: "/mês",
    icon: Building2,
    features: [
      "Acesso multiusuário",
      "Relatórios técnicos avançados e estratégicos",
      "Conteúdo profissional para uso institucional",
      "Referências científicas e técnicas consolidadas",
      "Suporte prioritário",
      "Tudo do plano Pró",
      "Apoio à gestão, sustentabilidade e tomada de decisão",
    ],
    buttonText: "Assinar plano Empresa",
  },
];

const Planos = () => {
  const { plan: currentPlan, isLoading } = useSubscription();
  const navigate = useNavigate();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleSubscribe = async (planId: string) => {
    // Track subscription click for all plans
    trackSubscriptionClick(planId);

    if (planId === "free") {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // User is logged in, redirect to home
        navigate("/");
      } else {
        // User not logged in, show auth dialog
        setShowAuthDialog(true);
      }
    } else if (planId === "pro") {
      window.open(MERCADO_PAGO_LINKS.pro, "_blank");
    } else if (planId === "enterprise") {
      window.open(MERCADO_PAGO_LINKS.enterprise, "_blank");
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="text-center mb-12">
        <Badge variant="outline" className="mb-4 text-primary border-primary">
          PLANOS
        </Badge>
        <h1 className="text-4xl font-bold mb-4">
          Escolha o plano <span className="text-primary">ideal para você</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Comece gratuitamente e evolua conforme sua necessidade.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          
          return (
            <Card 
              key={plan.id} 
              className={`relative overflow-hidden bg-card ${
                plan.popular ? "border-2 border-primary shadow-lg" : "border border-border"
              } ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
            >
              {plan.popular && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary text-primary-foreground text-xs px-3 py-1 font-medium">
                    Mais popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <plan.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {plan.subtitle}
                </CardDescription>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4">
                  {isCurrentPlan ? (
                    <Badge variant="secondary" className="w-full justify-center py-2">
                      Plano Atual
                    </Badge>
                  ) : (
                    <Button 
                      className="w-full group" 
                      variant={plan.popular ? "default" : "outline"}
                      disabled={isLoading}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      {plan.buttonText}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Credits Block */}
      <Card className="mt-12 border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Lightbulb className="h-7 w-7 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            Créditos Avulsos – Use Inteligência Artificial no seu ritmo
          </CardTitle>
          <CardDescription className="text-base max-w-2xl mx-auto mt-2">
            Nem sempre você precisa de um plano mensal. Com os Créditos Avulsos, você pode utilizar as ferramentas de Inteligência Artificial do aplicativo conforme sua necessidade real, de forma flexível e sem compromisso.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            Cada análise realizada — como simulações produtivas, avaliações climáticas, cálculos ambientais ou apoio técnico veterinário — consome créditos de acordo com a complexidade da ferramenta.
          </p>

          {/* Icons Row */}
          <div className="flex justify-center gap-6 py-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">IA Avançada</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Análises</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Leaf className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Sustentabilidade</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Ideal para */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Ideal para:</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Testar novas funcionalidades</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Realizar análises pontuais</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Complementar os créditos diários gratuitos</span>
                </li>
              </ul>
            </div>

            {/* O que você recebe */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">O que você recebe:</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>40 créditos de uso</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Acesso imediato às ferramentas avançadas</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Sem renovação automática</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Use quando quiser, até consumir tudo</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Price and CTA */}
          <div className="text-center pt-6 border-t border-border mt-6">
            <div className="mb-4">
              <span className="text-3xl font-bold text-foreground">R$ 19,90</span>
              <span className="text-muted-foreground ml-2">(pagamento único)</span>
            </div>
            <Button 
              size="lg"
              className="group"
              onClick={() => {
                trackSubscriptionClick("credits");
                window.open(MERCADO_PAGO_CREDITS_LINK, "_blank");
              }}
            >
              Comprar Créditos Avulsos
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog} 
      />
    </div>
  );
};

export default Planos;
