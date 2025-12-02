import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, Building2, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: string;
}

const plans = [
  {
    name: "Pro",
    price: "R$ 39,90",
    period: "/mês",
    description: "Ideal para profissionais que usam o sistema na rotina técnica",
    icon: Crown,
    color: "from-amber-500 to-orange-600",
    features: [
      "Uso ilimitado das ferramentas",
      "Upload de exames (PDF, imagens)",
      "Relatórios PDF com referências",
      "Respostas técnicas completas",
      "Modelagem produtiva sem limites",
      "Prioridade no processamento",
    ],
  },
  {
    name: "Enterprise",
    price: "R$ 129,90",
    period: "/mês",
    description: "Para clínicas, consultorias e produtores com volume",
    icon: Building2,
    color: "from-indigo-500 to-purple-600",
    features: [
      "Tudo do plano Pro",
      "Até 5 usuários",
      "Créditos ilimitados",
      "Relatórios com sua marca",
      "Histórico e exportação",
      "Suporte prioritário",
      "Processamento ultra-rápido",
    ],
  },
];

export function UpgradeModal({ open, onOpenChange, reason }: UpgradeModalProps) {
  const navigate = useNavigate();

  const handleViewPlans = () => {
    onOpenChange(false);
    navigate("/planos");
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
            <Card key={plan.name} className="relative overflow-hidden">
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
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center mt-4">
          <Button onClick={handleViewPlans} className="w-full sm:w-auto">
            Ver todos os planos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
