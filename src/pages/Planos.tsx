import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Building2, Sparkles } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Badge } from "@/components/ui/badge";

const MERCADO_PAGO_LINKS = {
  pro: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=71757e967b5049e5bfa5e88c022b357c",
  enterprise: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=8662444c7a604ea196aca59c150313f1",
};

const plans = [
  {
    id: "free",
    name: "Gratuito",
    price: "R$ 0",
    period: "/mês",
    description: "Perfeito para começar. Experimente as ferramentas básicas do VetAgro AI.",
    icon: Sparkles,
    color: "from-gray-400 to-gray-500",
    features: [
      "Acesso limitado diário",
      "Ferramentas básicas",
      "Acesso ao chatbot assistente",
    ],
    limitations: [],
    buttonText: "Começar grátis",
  },
  {
    id: "pro",
    name: "Pró",
    price: "R$ 39,90",
    period: "/mês",
    description: "Ideal para profissionais que usam o sistema na rotina técnica.",
    icon: Crown,
    color: "from-amber-500 to-orange-600",
    popular: true,
    features: [
      "Uso ilimitado",
      "Upload de arquivos",
      "Geração de relatórios completos com referências científicas",
      "Relatórios em texto estruturado, prontos para copiar, salvar e compartilhar",
      "Histórico completo",
    ],
    limitations: [],
    buttonText: "Assinar agora",
  },
  {
    id: "enterprise",
    name: "Empresa",
    price: "R$ 129,90",
    period: "/mês",
    description: "Para clínicas, consultorias e produtores com equipe.",
    icon: Building2,
    color: "from-indigo-500 to-purple-600",
    features: [
      "Tudo do plano Pró",
      "Multiusuário",
      "Relatórios completos com branding (logo/nome da empresa no cabeçalho)",
      "Relatórios estruturados e profissionais, prontos para copiar e compartilhar",
      "Suporte prioritário",
      "Gestão de equipe",
    ],
    limitations: [],
    buttonText: "Assinar plano Empresa",
  },
];

const Planos = () => {
  const { plan: currentPlan, isLoading } = useSubscription();

  const handleSubscribe = (planId: string) => {
    if (planId === "pro" || planId === "enterprise") {
      window.open(MERCADO_PAGO_LINKS[planId as keyof typeof MERCADO_PAGO_LINKS], "_blank");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Planos e Assinaturas</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Escolha o plano ideal para suas necessidades. Todos os planos incluem acesso às ferramentas de IA do VetAgro.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          
          return (
            <Card 
              key={plan.id} 
              className={`relative overflow-hidden ${
                plan.popular ? "border-2 border-primary shadow-lg" : ""
              } ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg font-medium">
                  Mais Popular
                </div>
              )}
              
              <div className={`h-2 bg-gradient-to-r ${plan.color}`} />
              
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-2">
                  <plan.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <CardDescription className="mt-2">{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">Incluído</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4">
                  {isCurrentPlan ? (
                    <Badge variant="secondary" className="w-full justify-center py-2">
                      Plano Atual
                    </Badge>
                  ) : (
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? "default" : "outline"}
                      disabled={isLoading}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      {plan.buttonText}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 text-center text-muted-foreground">
        <p className="text-sm">
          Todos os planos podem ser cancelados a qualquer momento. 
          Dúvidas? Entre em contato conosco.
        </p>
      </div>
    </div>
  );
};

export default Planos;
