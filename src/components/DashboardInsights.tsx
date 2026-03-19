import { useProfile } from "@/contexts/ProfileContext";
import { TrendingUp, DollarSign, BarChart3, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const indicatorsMap: Record<string, { label: string; value: string; icon: any; trend?: string }[]> = {
  veterinario: [
    { label: "Consultas realizadas", value: "24", icon: Activity, trend: "+12%" },
    { label: "Taxa de resolução", value: "87%", icon: TrendingUp, trend: "+3%" },
    { label: "Exames interpretados", value: "18", icon: BarChart3 },
  ],
  zootecnista: [
    { label: "Eficiência alimentar", value: "6.2:1", icon: TrendingUp, trend: "+5%" },
    { label: "GMD médio", value: "1.4 kg", icon: BarChart3, trend: "+8%" },
    { label: "Custo/arroba", value: "R$ 210", icon: DollarSign, trend: "-3%" },
  ],
  agronomo: [
    { label: "Área monitorada", value: "450 ha", icon: BarChart3 },
    { label: "Índice sustentabilidade", value: "78%", icon: TrendingUp, trend: "+6%" },
    { label: "Alertas ativos", value: "2", icon: Activity },
  ],
  produtor: [
    { label: "Eficiência", value: "82%", icon: TrendingUp, trend: "+5%" },
    { label: "Custo operacional", value: "R$ 14.2k", icon: DollarSign, trend: "-2%" },
    { label: "Produção", value: "340 @", icon: BarChart3, trend: "+10%" },
  ],
  pesquisador: [
    { label: "Análises geradas", value: "12", icon: BarChart3, trend: "+4" },
    { label: "Modelos calibrados", value: "3", icon: TrendingUp },
    { label: "Datasets ativos", value: "7", icon: Activity },
  ],
};

const titleMap: Record<string, string> = {
  veterinario: "Resumo clínico",
  zootecnista: "Resumo produtivo",
  agronomo: "Resumo da propriedade",
  produtor: "Resumo da propriedade",
  pesquisador: "Resumo da pesquisa",
};

export function DashboardInsights() {
  const { activeProfile } = useProfile();
  const indicators = indicatorsMap[activeProfile] || indicatorsMap.produtor;
  const title = titleMap[activeProfile] || "Resumo";

  return (
    <div className="w-72 h-full border-l border-border bg-muted/30 flex flex-col">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>

      <div className="px-4 space-y-3 flex-1">
        {indicators.map((ind, i) => (
          <Card key={i} className="border-border/60 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{ind.label}</span>
                <ind.icon className="w-4 h-4 text-primary/60" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-xl font-bold text-foreground">{ind.value}</span>
                {ind.trend && (
                  <span className={`text-xs font-medium ${
                    ind.trend.startsWith("+") ? "text-primary" : "text-destructive"
                  }`}>
                    {ind.trend}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Simple chart placeholder */}
        <Card className="border-border/60 shadow-none">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Desempenho semanal
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-end gap-1.5 h-20">
              {[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-primary/20 rounded-sm transition-all hover:bg-primary/40"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[9px] text-muted-foreground">Seg</span>
              <span className="text-[9px] text-muted-foreground">Dom</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 border-t border-border">
        <p className="text-[10px] text-muted-foreground text-center">
          Dados atualizados automaticamente
        </p>
      </div>
    </div>
  );
}
