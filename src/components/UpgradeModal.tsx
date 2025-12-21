import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, Building2, Zap } from "lucide-react";

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
    name: "Pró",
    price: "R$ 39,90",
    period: "/mês",
    description: "Ideal para profissionais que usam o sistema na rotina técnica",
    icon: Crown,
    color: "from-amber-500 to-orange-600",
    features: [
      "Uso ilimitado",
      "Upload de arquivos",
      "Relatórios completos com referências científicas",
      "Relatórios em texto estruturado, prontos para copiar e compartilhar",
      "Histórico completo",
    ],
    buttonText: "Assinar agora",
  },
  {
    id: "enterprise",
    name: "Empresa",
    price: "R$ 129,90",
    period: "/mês",
    description: "Para clínicas, consultorias e produtores com equipe",
    icon: Building2,
    color: "from-indigo-500 to-purple-600",
    features: [
      "Tudo do plano Pró",
      "Multiusuário",
      "Relatórios com branding (logo/nome da empresa)",
      "Suporte prioritário",
      "Gestão de equipe",
    ],
    buttonText: "Assinar plano Empresa",
  },
];

export function UpgradeModal({ open, onOpenChange, reason }: UpgradeModalProps) {
  const handleSubscribe = (planId: string) => {
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
