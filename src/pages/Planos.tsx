import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Sparkles, Building2, Zap } from "lucide-react";
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

const Planos = () => {
  const { plan: currentPlan, credits, isLoading } = useSubscription();
  const navigate = useNavigate();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const planLabel: Record<string, string> = {
    free: "Livre",
    pro: "Pró",
    enterprise: "Empresa",
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      {/* Current plan status */}
      <div className="mb-8 rounded-lg border border-border bg-muted/50 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Você está no plano{" "}
          <span className="font-semibold text-foreground">
            {planLabel[currentPlan ?? "free"] ?? "Livre"}
          </span>{" "}
          — {currentPlan === "pro" || currentPlan === "enterprise"
            ? "uso ilimitado"
            : `${credits ?? 10} créditos disponíveis hoje`}
        </p>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">
          Escolha o plano <span className="text-primary">ideal para você</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Comece sem compromisso ou assine para uso ilimitado.
        </p>
      </div>

      {/* Cards empilhados */}
      <div className="flex flex-col gap-5">
        {/* CARD 1 — Créditos Avulsos */}
        <Card className="relative overflow-hidden border border-border">
          <div className="absolute top-4 right-4">
            <Badge variant="outline" className="text-xs border-primary text-primary">
              Mais fácil para começar
            </Badge>
          </div>
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Créditos Avulsos</CardTitle>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold">R$ 19,90</span>
              <span className="text-muted-foreground text-xs">pagamento único</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {[
                "40 créditos de uso",
                "Sem assinatura, sem renovação automática",
                "Acesso imediato a todas as ferramentas",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full group"
              variant="outline"
              onClick={() => {
                trackSubscriptionClick("credits");
                window.open(MERCADO_PAGO_CREDITS_LINK, "_blank");
              }}
            >
              Comprar agora
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </CardContent>
        </Card>

        {/* CARD 2 — Plano Pró */}
        <Card className={`relative overflow-hidden border-2 border-primary shadow-lg ${currentPlan === "pro" ? "ring-2 ring-green-500" : ""}`}>
          <div className="absolute top-4 right-4">
            <Badge className="bg-primary text-primary-foreground text-xs px-3 py-1">
              Mais popular
            </Badge>
          </div>
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Plano Pró</CardTitle>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold">R$ 39,90</span>
              <span className="text-muted-foreground text-xs">/mês</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {[
                "Uso ilimitado de todas as ferramentas",
                "Relatórios técnicos estruturados",
                "Referências científicas integradas",
                "Exportação de conteúdo",
                "Histórico completo",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground">{f}</span>
                </li>
              ))}
            </ul>
            {currentPlan === "pro" ? (
              <Badge variant="secondary" className="w-full justify-center py-2">
                Plano Atual
              </Badge>
            ) : (
              <Button
                className="w-full group"
                disabled={isLoading}
                onClick={() => {
                  trackSubscriptionClick("pro");
                  window.open(MERCADO_PAGO_LINKS.pro, "_blank");
                }}
              >
                Assinar agora
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* CARD 3 — Plano Empresa */}
        <Card className={`relative overflow-hidden border border-border ${currentPlan === "enterprise" ? "ring-2 ring-green-500" : ""}`}>
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Plano Empresa</CardTitle>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold">R$ 129,90</span>
              <span className="text-muted-foreground text-xs">/mês</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {[
                "Acesso multiusuário",
                "Relatórios avançados e estratégicos",
                "Suporte prioritário",
                "Tudo do plano Pró incluso",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground">{f}</span>
                </li>
              ))}
            </ul>
            {currentPlan === "enterprise" ? (
              <Badge variant="secondary" className="w-full justify-center py-2">
                Plano Atual
              </Badge>
            ) : (
              <Button
                className="w-full group"
                variant="outline"
                disabled={isLoading}
                onClick={() => {
                  trackSubscriptionClick("enterprise");
                  window.open(MERCADO_PAGO_LINKS.enterprise, "_blank");
                }}
              >
                Falar com vendas
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Linha explicativa */}
      <p className="text-xs text-muted-foreground text-center mt-6 px-2">
        Créditos Avulsos não expiram e podem ser usados no seu ritmo. No Pró, uso ilimitado sem se preocupar com créditos.
      </p>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </div>
  );
};

export default Planos;
