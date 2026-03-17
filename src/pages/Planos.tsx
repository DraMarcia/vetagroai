import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Sparkles, Building2, Zap, Gift, Crown, Users, Star } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { AuthDialog } from "@/components/AuthDialog";
import { trackSubscriptionClick } from "@/lib/analytics";

const MERCADO_PAGO_CREDITS_LINK = "https://mpago.la/12xcSRW";
const MERCADO_PAGO_LINKS = {
  pro: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=71757e967b5049e5bfa5e88c022b357c",
  enterprise: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=8662444c7a604ea196aca59c150313f1",
};

const Planos = () => {
  const { plan: currentPlan, credits, isLoading, user } = useSubscription();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const planLabel: Record<string, string> = { free: "Gratuito", pro: "Profissional", enterprise: "Empresarial" };

  const handlePlanClick = (planId: string, link: string) => {
    trackSubscriptionClick(planId);
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    window.open(link, "_blank");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Status do plano atual */}
      <div className="mb-6 rounded-xl border border-border bg-muted/40 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Você está no plano{" "}
          <span className="font-semibold text-foreground">{planLabel[currentPlan ?? "free"] ?? "Gratuito"}</span>
          {" — "}
          {currentPlan === "pro"
            ? "300 créditos/mês"
            : currentPlan === "enterprise"
              ? "1000 créditos/mês"
              : `${credits ?? 5} créditos disponíveis hoje`}
        </p>
      </div>

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          Escolha o plano <span className="text-primary">ideal para você</span>
        </h1>
        <p className="text-muted-foreground text-base max-w-xl mx-auto">
          Do uso esporádico ao profissional. Comece grátis e evolua quando precisar.
        </p>
      </div>

      {/* Low credits alert */}
      {user && (currentPlan === "free" || !currentPlan) && (credits ?? 5) < 10 && (
        <div className="mb-6 rounded-xl border-2 border-amber-400/60 bg-amber-50 dark:bg-amber-950/30 p-4 text-center">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            ⚡ Seus créditos estão baixos ({credits ?? 0} restantes). Considere o plano <strong>Profissional</strong> para 300 créditos/mês!
          </p>
        </div>
      )}

      {/* Grid de planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

        {/* ── GRATUITO ── */}
        <Card className={`relative overflow-hidden flex flex-col ${currentPlan === "free" || !currentPlan ? "ring-2 ring-primary/60" : "border-border"}`}>
          {(currentPlan === "free" || !currentPlan) && (
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wide">Plano atual</Badge>
            </div>
          )}
          <CardHeader className="pb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Experimente</p>
            <CardTitle className="text-lg">Gratuito</CardTitle>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold">R$ 0</span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 space-y-4">
            <p className="text-xs font-medium text-primary">5 créditos por dia</p>
            <ul className="space-y-2 flex-1">
              {[
                "Acesso a todas as ferramentas",
                "Renova diariamente",
                "Sem cartão de crédito",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full uppercase font-semibold tracking-wide"
              variant="outline"
              disabled={!!user}
              onClick={() => !user && setShowAuthDialog(true)}
            >
              {user ? "Plano atual" : "Começar grátis"}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">Sem cartão de crédito</p>
          </CardContent>
        </Card>

        {/* ── CRÉDITOS AVULSOS ── */}
        <Card className="relative overflow-hidden flex flex-col border-border">
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="text-[10px] border-primary/50 text-primary uppercase tracking-wide">Pague por uso</Badge>
          </div>
          <CardHeader className="pb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pague por uso</p>
            <CardTitle className="text-lg">Créditos Avulsos</CardTitle>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold">R$ 29,90</span>
              <span className="text-muted-foreground text-xs">pagamento único</span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 space-y-4">
            <p className="text-xs font-medium text-primary">50 créditos</p>
            <ul className="space-y-2 flex-1">
              {[
                "Créditos permanentes (não expiram)",
                "Acesso imediato a todas as ferramentas",
                "Sem assinatura ou renovação",
                "Ideal para uso esporádico",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full group uppercase font-semibold tracking-wide"
              variant="outline"
              onClick={() => handlePlanClick("credits", MERCADO_PAGO_CREDITS_LINK)}
            >
              Comprar créditos
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">Ideal para uso esporádico</p>
          </CardContent>
        </Card>

        {/* ── PROFISSIONAL (destaque) ── */}
        <Card className={`relative overflow-hidden flex flex-col border-2 border-primary shadow-xl shadow-primary/10 ${currentPlan === "pro" ? "ring-2 ring-green-500" : ""}`}>
          {/* Selo MAIS VENDIDO */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-lime-500 py-1 text-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white flex items-center justify-center gap-1">
              <Star className="h-3 w-3 fill-white" /> Mais vendido
            </span>
          </div>
          {currentPlan === "pro" && (
            <div className="absolute top-8 right-3">
              <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wide">Plano atual</Badge>
            </div>
          )}
          <CardHeader className="pb-2 pt-10">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profissional</p>
            <CardTitle className="text-lg">Plano Pro</CardTitle>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold">R$ 49,90</span>
              <span className="text-muted-foreground text-xs">/mês</span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 space-y-4">
            <p className="text-xs font-medium text-primary">300 créditos por mês</p>
            <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-2 py-1">
              <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">💰 Economize 40% comparado aos créditos avulsos</p>
            </div>
            <ul className="space-y-2 flex-1">
              {[
                "Suporte prioritário",
                "Histórico de conversas ilimitado",
                "Relatórios técnicos estruturados",
                "Referências científicas integradas",
                "Exportação de conteúdo",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground">{f}</span>
                </li>
              ))}
            </ul>
            {currentPlan === "pro" ? (
              <Badge variant="secondary" className="w-full justify-center py-2 uppercase tracking-wide">Plano Atual</Badge>
            ) : (
              <Button
                className="w-full group uppercase font-semibold tracking-wide"
                disabled={isLoading}
                onClick={() => handlePlanClick("pro", MERCADO_PAGO_LINKS.pro)}
              >
                Assinar agora
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            )}
            <p className="text-[10px] text-muted-foreground text-center">Cancele quando quiser</p>
          </CardContent>
        </Card>

        {/* ── EMPRESARIAL ── */}
        <Card className={`relative overflow-hidden flex flex-col border-border ${currentPlan === "enterprise" ? "ring-2 ring-green-500" : ""}`}>
          {currentPlan === "enterprise" && (
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wide">Plano atual</Badge>
            </div>
          )}
          <CardHeader className="pb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Equipes</p>
            <CardTitle className="text-lg">Empresarial</CardTitle>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold">R$ 297,90</span>
              <span className="text-muted-foreground text-xs">/mês</span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 space-y-4">
            <p className="text-xs font-medium text-primary">1000 créditos por mês</p>
            <ul className="space-y-2 flex-1">
              {[
                "Múltiplos usuários (até 5)",
                "Tudo do plano Profissional",
                "Relatórios de uso detalhados",
                "Consultoria personalizada (1h/mês)",
                "Suporte prioritário dedicado",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground">{f}</span>
                </li>
              ))}
            </ul>
            {currentPlan === "enterprise" ? (
              <Badge variant="secondary" className="w-full justify-center py-2 uppercase tracking-wide">Plano Atual</Badge>
            ) : (
              <Button
                className="w-full group uppercase font-semibold tracking-wide"
                variant="outline"
                disabled={isLoading}
                onClick={() => handlePlanClick("enterprise", MERCADO_PAGO_LINKS.enterprise)}
              >
                Falar com consultor
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            )}
            <p className="text-[10px] text-muted-foreground text-center">Ideal para propriedades, clínicas e universidades</p>
          </CardContent>
        </Card>
      </div>

      {/* Rodapé explicativo */}
      <p className="text-xs text-muted-foreground text-center mt-8 px-2 max-w-2xl mx-auto">
        No plano Gratuito você recebe 5 créditos todo dia. Nos Créditos Avulsos, 50 créditos permanentes. No Profissional, 300 créditos/mês com suporte prioritário. No Empresarial, 1000 créditos/mês para equipes.
      </p>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </div>
  );
};

export default Planos;
