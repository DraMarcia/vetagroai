import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowRight, Sparkles, Zap, Gift, Crown, Users, Star, MessageSquare, Flame } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { AuthDialog } from "@/components/AuthDialog";
import { trackSubscriptionClick, trackBeginCheckout, trackViewPlans } from "@/lib/analytics";

const MERCADO_PAGO_CREDITS_LINK = "https://mpago.li/2RGcL8M";
const MERCADO_PAGO_LINKS = {
  pro: "https://mpago.li/25uChSe",
  enterprise: "https://mpago.la/1mA7f1V",
};
const WHATSAPP_ENTERPRISE = "https://wa.me/5500000000000?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20o%20plano%20Empresarial%20do%20VetAgro%20IA";

const Planos = () => {
  const { plan: currentPlan, credits, isLoading, user } = useSubscription();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const planLabel: Record<string, string> = { free: "Gratuito", pro: "Profissional", enterprise: "Empresarial" };

  useEffect(() => {
    trackViewPlans();
  }, []);

  const handlePlanClick = (planId: string, link: string) => {
    trackSubscriptionClick(planId);
    trackBeginCheckout(planId);
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    window.open(link, "_blank");
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
      {/* Status do plano atual */}
      <div className="mb-5 rounded-xl border border-border bg-muted/40 p-3 sm:p-4 text-center">
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
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
          Escolha o plano <span className="text-primary">ideal para você</span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
          Do uso esporádico ao profissional. Comece grátis e evolua quando precisar.
        </p>
      </div>

      {/* Low credits alert */}
      {user && (currentPlan === "free" || !currentPlan) && (credits ?? 5) <= 10 && (
        <div className="mb-6 rounded-xl border-2 border-amber-400/60 bg-amber-50 dark:bg-amber-950/30 p-4 text-center space-y-3">
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
            ⚡ Você atingiu o limite diário gratuito ({credits ?? 0} créditos restantes)
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Continue agora sem interromper sua análise técnica
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              size="sm"
              variant="outline"
              className="border-amber-400 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40"
              onClick={() => handlePlanClick("credits", MERCADO_PAGO_CREDITS_LINK)}
            >
              <Zap className="h-4 w-4 mr-1" />
              Comprar créditos
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => handlePlanClick("pro", MERCADO_PAGO_LINKS.pro)}
            >
              <Crown className="h-4 w-4 mr-1" />
              Assinar plano Pro
            </Button>
          </div>
        </div>
      )}

      {/* Grid de planos — Mobile: menor→maior. Desktop: 4 colunas com Pro destacado */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 auto-rows-auto">

        {/* ── PLANO PRO ── */}
        <Card className={`relative overflow-hidden flex flex-col border-2 border-primary shadow-xl shadow-primary/10 order-3 xl:order-3 ${currentPlan === "pro" ? "ring-2 ring-green-500" : ""}`}>
          {/* Selo MAIS ESCOLHIDO */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500 via-lime-500 to-emerald-500 py-1.5 text-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white flex items-center justify-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-white" /> Mais utilizado
              <Flame className="h-3.5 w-3.5" />
            </span>
          </div>
          {currentPlan === "pro" && (
            <div className="absolute top-9 right-3">
              <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wide">Plano atual</Badge>
            </div>
          )}
          <CardHeader className="pb-2 pt-11">
            <div className="w-11 h-11 rounded-lg bg-primary/15 flex items-center justify-center mb-2">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Profissional</p>
            <CardTitle className="text-xl">Plano Pro</CardTitle>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-4xl font-extrabold text-foreground">R$ 49,90</span>
              <span className="text-muted-foreground text-sm">/mês</span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 space-y-4">
            <p className="text-sm font-bold text-primary">300 créditos por mês</p>
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2 space-y-1">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                🔥 Melhor custo-benefício para uso frequente
              </p>
            </div>
            <ul className="space-y-2 flex-1">
              {[
                "Histórico de conversas ilimitado",
                "Relatórios técnicos completos",
                "Respostas com maior profundidade",
                "Prioridade de processamento",
                "Exportação de conteúdo",
                "Acesso total às ferramentas",
                "Referências científicas integradas",
                "Suporte prioritário",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground">{f}</span>
                </li>
              ))}
            </ul>
            {currentPlan === "pro" ? (
              <Badge variant="secondary" className="w-full justify-center py-2.5 uppercase tracking-wide text-sm">Plano Atual</Badge>
            ) : (
              <Button
                className="w-full group uppercase font-bold tracking-wide h-12 text-base"
                disabled={isLoading}
                onClick={() => handlePlanClick("pro", MERCADO_PAGO_LINKS.pro)}
              >
                Comprar agora
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            )}
            <p className="text-[10px] text-muted-foreground text-center">Cancele quando quiser • Sem fidelidade</p>
          </CardContent>
        </Card>

        {/* ── GRATUITO ── */}
        <Card className={`relative overflow-hidden flex flex-col order-1 xl:order-1 ${currentPlan === "free" || !currentPlan ? "ring-2 ring-primary/40" : "border-border"}`}>
          {(currentPlan === "free" || !currentPlan) && (
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wide">Plano atual</Badge>
            </div>
          )}
          <CardHeader className="pb-2">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-2">
              <Gift className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Teste</p>
            <CardTitle className="text-lg">Gratuito</CardTitle>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold text-foreground">R$ 0</span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 space-y-4">
            <p className="text-xs font-medium text-muted-foreground">5 créditos por dia</p>
            <ul className="space-y-2 flex-1">
              {[
                { text: "Acesso a todas as ferramentas", included: true },
                { text: "Renova diariamente", included: true },
                { text: "Sem cartão de crédito", included: true },
                { text: "Histórico limitado (últimas 5 conversas)", included: false },
                { text: "Sem exportação de conteúdo", included: false },
                { text: "Sem relatórios completos", included: false },
                { text: "Respostas com menor profundidade", included: false },
              ].map((f) => (
                <li key={f.text} className="flex items-start gap-2 text-sm">
                  {f.included ? (
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5" />
                  )}
                  <span className={f.included ? "text-foreground" : "text-muted-foreground/70"}>{f.text}</span>
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
        <Card className="relative overflow-hidden flex flex-col border-border order-2 xl:order-2">
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="text-[10px] border-primary/50 text-primary uppercase tracking-wide">Pague por uso</Badge>
          </div>
          <CardHeader className="pb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Uso imediato</p>
            <CardTitle className="text-lg">Créditos Avulsos</CardTitle>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold text-foreground">R$ 29,90</span>
              <span className="text-muted-foreground text-xs">pagamento único</span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 space-y-4">
            <p className="text-xs font-medium text-primary">50 créditos — Ideal para uso rápido e testes</p>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3 py-2">
              <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                ⚡ Continue sua análise agora mesmo
              </p>
            </div>
            <ul className="space-y-2 flex-1">
              {[
                "Créditos permanentes (não expiram)",
                "Liberação instantânea",
                "Acesso a todas as ferramentas",
                "Sem assinatura ou renovação",
                "Ideal para uso imediato ou emergência",
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
              Comprar agora
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">Ideal para uso imediato — sem esperar o próximo ciclo</p>
          </CardContent>
        </Card>

        {/* ── EMPRESARIAL ── */}
        <Card className={`relative overflow-hidden flex flex-col border-border order-4 xl:order-4 ${currentPlan === "enterprise" ? "ring-2 ring-green-500" : ""}`}>
          {currentPlan === "enterprise" && (
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wide">Plano atual</Badge>
            </div>
          )}
          <CardHeader className="pb-2">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Equipes e operações</p>
            <CardTitle className="text-lg">Soluções para Equipes</CardTitle>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold text-foreground">R$ 297,90</span>
              <span className="text-muted-foreground text-xs">/mês</span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 space-y-4">
            <p className="text-xs font-medium text-muted-foreground">1000 créditos por mês</p>
            <Badge variant="outline" className="text-[10px] border-primary/50 text-primary uppercase tracking-wide w-fit">Plano Profissional</Badge>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Para uso profissional contínuo. Ideal para clínicas, propriedades rurais, consultorias e instituições de pesquisa.
            </p>
            <ul className="space-y-2 flex-1">
              {[
                "Múltiplos usuários (até 5)",
                "Tudo do plano Profissional",
                "Gestão de uso por usuário",
                "Relatórios avançados",
                "Consultoria especializada (1h/mês)",
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
                Assinar plano
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            )}
            <p className="text-[10px] text-muted-foreground text-center">Proposta personalizada para sua operação</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela comparativa resumida */}
      <div className="mt-10 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2 text-muted-foreground font-medium">Recurso</th>
              <th className="text-center py-2 px-2 text-muted-foreground font-medium">Gratuito</th>
              <th className="text-center py-2 px-2 text-muted-foreground font-medium">Avulso</th>
              <th className="text-center py-2 px-2 font-bold text-primary">Pro ⭐</th>
              <th className="text-center py-2 px-2 text-muted-foreground font-medium">Equipes</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {[
              { label: "Créditos", free: "5/dia", avulso: "50", pro: "300/mês", emp: "1000/mês" },
              { label: "Histórico", free: "5 conversas", avulso: "5 conversas", pro: "Ilimitado", emp: "Ilimitado" },
              { label: "Profundidade das respostas", free: "Básica", avulso: "Básica", pro: "Completa", emp: "Completa" },
              { label: "Relatórios técnicos", free: "—", avulso: "—", pro: "✓", emp: "✓" },
              { label: "Exportação de conteúdo", free: "—", avulso: "—", pro: "✓", emp: "✓" },
              { label: "Múltiplos usuários", free: "—", avulso: "—", pro: "—", emp: "Até 5" },
              { label: "Suporte", free: "Comunidade", avulso: "Comunidade", pro: "Prioritário", emp: "Dedicado" },
            ].map((row) => (
              <tr key={row.label} className="border-b border-border/50">
                <td className="py-2 px-2 text-foreground font-medium">{row.label}</td>
                <td className="py-2 px-2 text-center text-muted-foreground">{row.free}</td>
                <td className="py-2 px-2 text-center text-muted-foreground">{row.avulso}</td>
                <td className="py-2 px-2 text-center font-semibold text-primary">{row.pro}</td>
                <td className="py-2 px-2 text-center text-muted-foreground">{row.emp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rodapé */}
      <p className="text-xs text-muted-foreground text-center mt-8 px-2 max-w-2xl mx-auto">
        No plano Gratuito você recebe 5 créditos todo dia. Nos Créditos Avulsos, 50 créditos permanentes. No Profissional, 300 créditos/mês com suporte prioritário. No Empresarial, 1000 créditos/mês para equipes.
      </p>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
      </div>
    </div>
  );
};

export default Planos;
