import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, Building2, Zap } from "lucide-react";
import { trackSubscriptionClick } from "@/lib/analytics";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: string;
}

const MERCADO_PAGO_LINKS = {
  pro: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=71757e967b5049e5bfa5e88c022b357c",
  enterprise: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=8662444c7a604ea196aca59c150313f1",
};

const plans = [
  {
    id: "pro",
    name: "Profissional",
    price: "R$ 49,90",
    period: "/mês",
    description: "300 créditos/mês — ideal para profissionais da rotina técnica",
    icon: Crown,
    color: "from-amber-500 to-lime-500",
    features: [
      "300 créditos por mês",
      "Suporte prioritário",
      "Histórico de conversas ilimitado",
      "Relatórios completos com referências científicas",
      "Exportação de conteúdo",
    ],
    buttonText: "Assinar agora",
  },
  {
    id: "enterprise",
    name: "Empresarial",
    price: "R$ 297,90",
    period: "/mês",
    description: "1000 créditos/mês — para equipes e propriedades",
    icon: Building2,
    color: "from-indigo-500 to-purple-600",
    features: [
      "1000 créditos por mês",
      "Múltiplos usuários (até 5)",
      "Relatórios de uso detalhados",
      "Consultoria personalizada (1h/mês)",
      "Suporte prioritário dedicado",
    ],
    buttonText: "Falar com consultor",
  },
];

export function UpgradeModal({ open, onOpenChange, reason }: UpgradeModalProps) {
  const handleSubscribe = (planId: string) => {
    // Track subscription click
    trackSubscriptionClick(planId);
    window.open(MERCADO_PAGO_LINKS[planId as keyof typeof MERCADO_PAGO_LINKS], "_blank");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Seus créditos acabaram
          </DialogTitle>
          <DialogDescription>
            {reason || "Para continuar usando as ferramentas, faça upgrade do seu plano."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${plan.color}`} />
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <plan.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <CardDescription className="text-xs">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
