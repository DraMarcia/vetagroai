import { useState } from "react";
import { AlertTriangle, X, Zap, CreditCard, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const BUY_CREDITS_URL = "https://mpago.li/2RGcL8M";

export function handleBuyCredits() {
  window.open(BUY_CREDITS_URL, "_blank");
}

interface LowCreditBannerProps {
  credits: number;
}

export function LowCreditBanner({ credits }: LowCreditBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || credits > 2 || credits <= 0) return null;

  return (
    <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 px-4 py-3 rounded-xl border border-amber-300/50 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-700/40 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 font-medium">
          Seus créditos estão acabando ({credits} restantes). Evite interrupções nas suas análises.
        </p>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button
          size="sm"
          className="h-8 text-xs font-semibold gap-1.5 flex-1 sm:flex-initial"
          onClick={handleBuyCredits}
        >
          <CreditCard className="h-3.5 w-3.5" />
          Comprar créditos
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-200/50 dark:hover:bg-amber-800/30 transition-colors flex-shrink-0"
          title="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ZeroCreditBlock() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center gap-3 px-4 py-5 rounded-2xl border-2 border-destructive/20 bg-destructive/5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <Zap className="h-6 w-6 text-destructive" />
      </div>
      <div className="text-center space-y-1">
        <h3 className="text-sm font-bold text-foreground">Seus créditos acabaram</h3>
        <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
          Você atingiu o limite de créditos gratuitos. Para continuar usando a VetAgro IA, adquira mais créditos.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button
          className="h-10 text-sm font-semibold gap-2 w-full sm:w-auto"
          onClick={handleBuyCredits}
        >
          <CreditCard className="h-4 w-4" />
          Comprar 50 créditos
        </Button>
        <Button
          variant="outline"
          className="h-10 text-sm font-semibold gap-2 w-full sm:w-auto"
          onClick={() => navigate("/planos")}
        >
          Ver planos
        </Button>
      </div>
    </div>
  );
}

/* ── In-chat credit alert messages ── */

interface CreditAlertMessageProps {
  credits: number;
}

export function CreditAlertMessage({ credits }: CreditAlertMessageProps) {
  const navigate = useNavigate();

  if (credits > 3) return null;

  if (credits === 0) {
    return (
      <div className="flex gap-3 justify-start">
        <div className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-1">
          <Zap className="w-3.5 h-3.5 text-destructive" />
        </div>
        <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 bg-destructive/5 border border-destructive/20">
          <p className="text-sm font-semibold text-destructive mb-2">
            🔴 Seus créditos gratuitos acabaram.
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Para continuar utilizando o VetAgro IA e gerar análises técnicas completas, adquira mais créditos.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="h-8 text-xs font-semibold gap-1.5" onClick={handleBuyCredits}>
              <CreditCard className="h-3.5 w-3.5" />
              Comprar 50 créditos
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs font-semibold gap-1.5" onClick={() => navigate("/planos")}>
              <ArrowRight className="h-3.5 w-3.5" />
              Ver planos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (credits === 1) {
    return (
      <div className="flex gap-3 justify-start">
        <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0 mt-1">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
        </div>
        <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/30">
          <p className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-2">
            🟠 Este é seu último crédito gratuito.
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Após esta mensagem, você precisará adquirir créditos para continuar.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="h-8 text-xs font-semibold gap-1.5" onClick={handleBuyCredits}>
              <CreditCard className="h-3.5 w-3.5" />
              Comprar créditos
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs font-semibold gap-1.5" onClick={() => navigate("/planos")}>
              Ver planos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // credits <= 3
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 mt-1">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30">
        <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
          🟡 Você está aproveitando a VetAgro IA! Seus créditos gratuitos estão acabando ({credits} restantes).
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="h-8 text-xs font-semibold gap-1.5" onClick={() => navigate("/planos")}>
            Ver planos
          </Button>
        </div>
      </div>
    </div>
  );
}
