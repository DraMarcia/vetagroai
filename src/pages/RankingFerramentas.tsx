import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Clock, CheckCircle } from "lucide-react";

// Friendly display names for edge function tool names
const TOOL_DISPLAY_NAMES: Record<string, string> = {
  "veterinary-consultation": "Consulta Veterinária",
  "interpret-exams": "Interpretação de Exames",
  "analyze-equine": "Resenha de Equinos",
  "chatbot-assistant": "Assistente Chatbot",
  "calculadora-dose": "Calculadora de Dose",
  "diagnostico-diferencial": "Diagnóstico Diferencial",
  "analise-mucosa": "Análise de Mucosa",
  "receituario": "Receituário Veterinário",
  "dicionario": "Dicionário Farmacológico",
  "calculadora-racao": "Calculadora de Ração",
  "identificador-plantas": "Identificador de Plantas",
  "calculadora-gee": "Calculadora de Emissões de GEE",
  "consulta-geoespacial": "Consulta Geoespacial",
  "analise-sustentabilidade": "Análise de Sustentabilidade",
  "analise-climatica": "Análise Climática",
  "analise-produtiva": "Painel Produtivo",
  "escore-corporal": "Escore Corporal",
  "simulador-confinamento": "Simulador de Confinamento",
  "modelador-carbono": "Modelador de Carbono",
};

const MEDAL_COLORS = ["text-yellow-500", "text-gray-400", "text-amber-700"];

type RankedTool = {
  toolName: string;
  displayName: string;
  executions: number;
  successRate: number;
  avgResponseMs: number;
};

export default function RankingFerramentas() {
  const [rankings, setRankings] = useState<RankedTool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Fetch last 30 days of monitoring logs (public aggregated data)
        const since = new Date(Date.now() - 30 * 24 * 3600_000).toISOString();

        const { data, error } = await supabase
          .from("tool_monitoring_logs")
          .select("tool_name, event_type, response_time_ms")
          .gte("created_at", since);

        if (error) throw error;

        const map = new Map<string, { total: number; successes: number; times: number[] }>();
        for (const log of data || []) {
          const entry = map.get(log.tool_name) || { total: 0, successes: 0, times: [] };
          entry.total++;
          if (log.event_type === "usage") entry.successes++;
          if (log.response_time_ms) entry.times.push(log.response_time_ms);
          map.set(log.tool_name, entry);
        }

        const ranked = Array.from(map.entries())
          .map(([toolName, s]) => ({
            toolName,
            displayName: TOOL_DISPLAY_NAMES[toolName] || toolName,
            executions: s.total,
            successRate: s.total > 0 ? Math.round((s.successes / s.total) * 100) : 0,
            avgResponseMs: s.times.length > 0
              ? Math.round(s.times.reduce((a, b) => a + b, 0) / s.times.length)
              : 0,
          }))
          .sort((a, b) => b.executions - a.executions);

        setRankings(ranked);
      } catch (e) {
        console.warn("[Ranking] Error loading:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalExecs = useMemo(() => rankings.reduce((s, r) => s + r.executions, 0), [rankings]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold">Ferramentas Mais Utilizadas</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Ranking baseado no uso real da plataforma nos últimos 30 dias.
          Descubra quais ferramentas os profissionais do agro mais utilizam.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        <Card>
          <CardHeader className="pb-2 text-center">
            <CardDescription className="flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3" /> Total de Análises
            </CardDescription>
            <CardTitle className="text-3xl">{totalExecs.toLocaleString("pt-BR")}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 text-center">
            <CardDescription className="flex items-center justify-center gap-1">
              <CheckCircle className="h-3 w-3" /> Ferramentas Ativas
            </CardDescription>
            <CardTitle className="text-3xl">{rankings.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2 text-center">
            <CardDescription className="flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" /> Período
            </CardDescription>
            <CardTitle className="text-xl">Últimos 30 dias</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Ranking Table */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Ranking de Uso</CardTitle>
          <CardDescription>Ferramentas ordenadas por número de execuções</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Carregando ranking...</p>
          ) : rankings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum dado de uso registrado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Ferramenta</TableHead>
                  <TableHead className="text-right">Execuções</TableHead>
                  <TableHead className="text-right">Taxa de Sucesso</TableHead>
                  <TableHead className="text-right">Tempo Médio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankings.map((r, i) => (
                  <TableRow key={r.toolName}>
                    <TableCell>
                      {i < 3 ? (
                        <Trophy className={`h-5 w-5 ${MEDAL_COLORS[i]}`} />
                      ) : (
                        <span className="text-muted-foreground font-mono">{i + 1}º</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{r.displayName}</TableCell>
                    <TableCell className="text-right font-mono">{r.executions.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right">
                      {r.successRate >= 95 ? (
                        <Badge variant="default">{r.successRate}%</Badge>
                      ) : r.successRate >= 80 ? (
                        <Badge variant="secondary">{r.successRate}%</Badge>
                      ) : (
                        <Badge variant="destructive">{r.successRate}%</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {r.avgResponseMs > 0 ? `${(r.avgResponseMs / 1000).toFixed(1)}s` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
