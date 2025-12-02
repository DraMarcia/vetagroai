import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Building2, Sparkles } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    description: "Perfeito para começar. Experimente ferramentas básicas e receba orientações gerais.",
    icon: Sparkles,
    color: "from-gray-400 to-gray-500",
    features: [
      "10 créditos diários",
      "Ferramentas de texto básicas",
      "Interpretação simplificada para tutores",
      "Resumo na tela (sem PDF)",
    ],
    limitations: [
      "Sem upload de arquivos",
      "Sem relatórios PDF",
      "Sem prioridade de processamento",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 39,90",
    period: "/mês",
    description: "Tudo o que um veterinário ou gestor precisa. Análises profissionais completas.",
    icon: Crown,
    color: "from-amber-500 to-orange-600",
    popular: true,
    features: [
      "Uso ilimitado das ferramentas",
      "Upload de exames (PDF, imagens, RX, USG)",
      "Relatórios PDF com referências",
      "Respostas técnicas com diferenciação profissional",
      "Modelagem produtiva, metano, clima sem limites",
      "ECC com upload de imagem",
      "Prioridade moderada no processamento",
    ],
    limitations: [],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "R$ 129,90",
    period: "/mês",
    description: "Nível corporativo para consultorias, clínicas e produtores.",
    icon: Building2,
    color: "from-indigo-500 to-purple-600",
    features: [
      "Tudo do plano Pro",
      "Até 5 usuários",
      "Créditos ilimitados",
      "Relatórios PDF com sua marca/logotipo",
      "Painel de histórico e exportação (CSV/PDF)",
      "Suporte prioritário e canal direto",
      "Acesso antecipado a novas ferramentas",
      "Processamento ultra-rápido",
    ],
    limitations: [],
  },
];

const Planos = () => {
  const { plan: currentPlan, isLoading } = useSubscription();

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

                {plan.limitations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">Limitações</h4>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation) => (
                        <li key={limitation} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-red-400">✕</span>
                          <span>{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

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
                    >
                      {plan.id === "free" ? "Começar Grátis" : `Assinar ${plan.name}`}
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
