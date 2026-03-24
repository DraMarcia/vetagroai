import { useState } from "react";
import { AlertTriangle, X, Zap, CreditCard } from "lucide-react";
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
          Para continuar utilizando o VetAgro IA e gerar análises técnicas completas, adquira mais créditos.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button
          className="h-10 text-sm font-semibold gap-2 w-full sm:w-auto"
          onClick={handleBuyCredits}
        >
          <CreditCard className="h-4 w-4" />
          Comprar créditos
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
