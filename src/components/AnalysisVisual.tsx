import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";
import { shouldRenderAnalysis, extractAnalysisData, type AnalysisData } from "@/lib/analysisDetector";

interface AnalysisVisualProps {
  content: string;
  profileId?: string;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--primary) / 0.75)",
  "hsl(var(--primary) / 0.55)",
  "hsl(var(--primary) / 0.4)",
  "hsl(var(--accent-foreground))",
  "hsl(var(--muted-foreground))",
];

function formatMetricValue(value: number, unit: string): string {
  const prefix = unit === "R$" ? "R$ " : "";
  const suffix = unit === "R$" ? "" : ` ${unit}`;
  if (value >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(1)}M${suffix}`;
  if (value >= 1_000) return `${prefix}${(value / 1_000).toFixed(1)}k${suffix}`;
  if (value % 1 !== 0) return `${prefix}${value.toFixed(2)}${suffix}`;
  return `${prefix}${value}${suffix}`;
}

export function AnalysisVisual({ content, profileId }: AnalysisVisualProps) {
  const analysisData = useMemo<AnalysisData | null>(() => {
    try {
      if (!shouldRenderAnalysis(content, profileId)) return null;
      const data = extractAnalysisData(content);
      if (data.metrics.length < 2) return null;
      return data;
    } catch {
      return null;
    }
  }, [content, profileId]);

  if (!analysisData) return null;

  const { metrics, chart, summary } = analysisData;

  return (
    <div className="mt-3 mb-2 rounded-xl border border-primary/15 bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-primary/5 px-4 py-2.5 flex items-center gap-2 border-b border-primary/10">
        <BarChart3 className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold text-primary uppercase tracking-wide">
          Análise Técnica + Métricas
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* A) Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {metrics.map((metric, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-muted/30 p-3 text-center"
            >
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                {metric.label}
              </p>
              <p className="text-lg font-bold text-foreground leading-none">
                {formatMetricValue(metric.value, metric.unit)}
              </p>
            </div>
          ))}
        </div>

        {/* B) Chart */}
        {chart && chart.data.length >= 2 && (
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
              {chart.title}
            </p>
            <div className="w-full h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [value.toLocaleString("pt-BR"), "Valor"]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {chart.data.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* C) Short Interpretation */}
        {summary && (
          <div className="flex gap-2 items-start rounded-lg bg-primary/5 p-3">
            <TrendingUp className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-foreground/80 leading-relaxed">{summary}</p>
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="px-4 py-2 bg-muted/20 border-t border-border/30">
        <p className="text-[9px] text-muted-foreground">
          Métricas extraídas automaticamente da resposta. Sem custo adicional de IA.
        </p>
      </div>
    </div>
  );
}
