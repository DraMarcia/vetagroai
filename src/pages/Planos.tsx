import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Zap, Sparkles, Building2, ArrowRight } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Badge } from "@/components/ui/badge";

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

  const handleSubscribe = (planId: string) => {
    if (planId === "pro") {
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
    </div>
  );
};

export default Planos;
