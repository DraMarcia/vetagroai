import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, RefreshCw, DollarSign, Cpu, Clock, Zap } from "lucide-react";
import { toast } from "sonner";

type UsageLog = {
  id: string;
  tool_name: string;
  ai_model: string | null;
  tokens_input: number;
  tokens_output: number;
  response_time_ms: number | null;
  user_plan: string | null;
  created_at: string;
};

type ToolCostSummary = {
  toolName: string;
  executions: number;
  totalTokensIn: number;
  totalTokensOut: number;
  avgTokensPerExec: number;
  avgResponseMs: number;
  estimatedCostUsd: number;
};

// Approximate cost per 1M tokens (blended input/output average)
const COST_PER_MILLION_TOKENS = 0.50;

export default function MonitoramentoCustos() {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [period, setPeriod] = useState("7d");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" });
      setIsAdmin(!!data);
    })();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const hoursMap: Record<string, number> = { "1d": 24, "7d": 168, "30d": 720, "90d": 2160 };
      const hours = hoursMap[period] || 168;
      const since = new Date(Date.now() - hours * 3600_000).toISOString();

      const { data, error } = await (supabase.from("ai_usage_logs") as any)
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;
      setLogs(data || []);
    } catch (e: any) {
      toast.error("Erro ao carregar dados: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchLogs();
  }, [isAdmin, period]);

  const summaries = useMemo<ToolCostSummary[]>(() => {
    const map = new Map<string, { execs: number; tokIn: number; tokOut: number; times: number[] }>();
    for (const log of logs) {
      const entry = map.get(log.tool_name) || { execs: 0, tokIn: 0, tokOut: 0, times: [] };
      entry.execs++;
      entry.tokIn += log.tokens_input || 0;
      entry.tokOut += log.tokens_output || 0;
      if (log.response_time_ms) entry.times.push(log.response_time_ms);
      map.set(log.tool_name, entry);
    }
    return Array.from(map.entries())
      .map(([toolName, s]) => ({
        toolName,
        executions: s.execs,
        totalTokensIn: s.tokIn,
        totalTokensOut: s.tokOut,
        avgTokensPerExec: s.execs > 0 ? Math.round((s.tokIn + s.tokOut) / s.execs) : 0,
        avgResponseMs: s.times.length > 0 ? Math.round(s.times.reduce((a, b) => a + b, 0) / s.times.length) : 0,
        estimatedCostUsd: ((s.tokIn + s.tokOut) / 1_000_000) * COST_PER_MILLION_TOKENS,
      }))
      .sort((a, b) => b.estimatedCostUsd - a.estimatedCostUsd);
  }, [logs]);

  const totalTokens = useMemo(() => logs.reduce((s, l) => s + (l.tokens_input || 0) + (l.tokens_output || 0), 0), [logs]);
  const totalCost = useMemo(() => (totalTokens / 1_000_000) * COST_PER_MILLION_TOKENS, [totalTokens]);
  const totalExecs = logs.length;

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">Apenas administradores podem acessar este painel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Monitoramento de Custos de IA</h1>
          <p className="text-muted-foreground">Consumo de tokens, custo estimado e performance por ferramenta</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">1 dia</SelectItem>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Zap className="h-3 w-3" /> Total de Execuções</CardDescription>
            <CardTitle className="text-3xl">{totalExecs.toLocaleString("pt-BR")}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Cpu className="h-3 w-3" /> Tokens Processados</CardDescription>
            <CardTitle className="text-3xl">{(totalTokens / 1000).toFixed(1)}K</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Custo Estimado</CardDescription>
            <CardTitle className="text-3xl text-primary">US$ {totalCost.toFixed(2)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Clock className="h-3 w-3" /> Ferramentas Ativas</CardDescription>
            <CardTitle className="text-3xl">{summaries.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Cost by Tool */}
      <Card>
        <CardHeader>
          <CardTitle>Consumo por Ferramenta</CardTitle>
          <CardDescription>Ordenado por custo estimado — período selecionado</CardDescription>
        </CardHeader>
        <CardContent>
          {summaries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum dado de uso registrado no período.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ferramenta</TableHead>
                    <TableHead className="text-right">Execuções</TableHead>
                    <TableHead className="text-right">Tokens (Entrada)</TableHead>
                    <TableHead className="text-right">Tokens (Saída)</TableHead>
                    <TableHead className="text-right">Média/Exec</TableHead>
                    <TableHead className="text-right">Tempo Médio</TableHead>
                    <TableHead className="text-right">Custo Est.</TableHead>
                    <TableHead>Impacto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaries.map((s, i) => (
                    <TableRow key={s.toolName}>
                      <TableCell className="font-medium">
                        <span className="text-muted-foreground mr-2">{i + 1}º</span>
                        {s.toolName}
                      </TableCell>
                      <TableCell className="text-right">{s.executions}</TableCell>
                      <TableCell className="text-right">{s.totalTokensIn.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-right">{s.totalTokensOut.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-right">{s.avgTokensPerExec.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-right">
                        {s.avgResponseMs > 0 ? `${(s.avgResponseMs / 1000).toFixed(1)}s` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        US$ {s.estimatedCostUsd.toFixed(3)}
                      </TableCell>
                      <TableCell>
                        {s.estimatedCostUsd > 1 ? (
                          <Badge variant="destructive">Alto</Badge>
                        ) : s.estimatedCostUsd > 0.1 ? (
                          <Badge variant="secondary">Médio</Badge>
                        ) : (
                          <Badge variant="outline">Baixo</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
