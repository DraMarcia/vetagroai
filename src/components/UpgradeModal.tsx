import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, Crown, ArrowRight } from "lucide-react";
import { trackSubscriptionClick, trackBeginCheckout } from "@/lib/analytics";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: string;
}

const MERCADO_PAGO_CREDITS_LINK = "https://mpago.li/2RGcL8M";
const MERCADO_PAGO_PRO_LINK = "https://mpago.li/25uChSe";

export function UpgradeModal({ open, onOpenChange, reason }: UpgradeModalProps) {
  const handleClick = (planId: string, link: string) => {
    trackSubscriptionClick(planId);
    trackBeginCheckout(planId);
    window.open(link, "_blank");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
            <Zap className="h-7 w-7 text-amber-500" />
          </div>
          <DialogTitle className="text-xl">
            Seus créditos acabaram
          </DialogTitle>
          <DialogDescription className="text-sm">
            {reason || "Continue agora sem interromper sua análise técnica"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          {/* Opção Pro — destacada */}
          <Button
            className="w-full h-14 text-base font-bold group gap-2"
            onClick={() => handleClick("pro", MERCADO_PAGO_PRO_LINK)}
          >
            <Crown className="h-5 w-5" />
            Assinar plano Pro — R$ 49,90/mês
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <p className="text-[11px] text-muted-foreground text-center -mt-1">
            300 créditos/mês • Economize até 60% • Cancele quando quiser
          </p>

          {/* Opção Créditos avulsos */}
          <Button
            variant="outline"
            className="w-full h-12 font-semibold group gap-2"
            onClick={() => handleClick("credits", MERCADO_PAGO_CREDITS_LINK)}
          >
            <Zap className="h-4 w-4" />
            Comprar 50 créditos — R$ 29,90
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <p className="text-[11px] text-muted-foreground text-center -mt-1">
            Créditos permanentes • Liberação instantânea
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
