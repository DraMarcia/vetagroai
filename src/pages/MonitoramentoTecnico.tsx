import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AlertTriangle, Activity, BarChart3, RefreshCw, Trash2, Shield } from "lucide-react";

type LogEntry = {
  id: string;
  created_at: string;
  tool_name: string;
  tool_route: string | null;
  event_type: string;
  error_type: string | null;
  error_message: string | null;
  response_time_ms: number | null;
  user_plan: string | null;
  request_status: string | null;
  request_id: string | null;
};

type ToolStats = {
  toolName: string;
  totalUses: number;
  errors: number;
  errorRate: number;
  avgResponseMs: number;
  lastError: string | null;
};

type Alert = {
  id: string;
  type: "consecutive_errors" | "high_response_time" | "edge_function_failure";
  toolName: string;
  message: string;
  timestamp: string;
  count: number;
};

const EVENT_BADGE_MAP: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  usage: { variant: "default", label: "Sucesso" },
  error: { variant: "destructive", label: "Erro" },
  timeout: { variant: "destructive", label: "Timeout" },
  empty_response: { variant: "secondary", label: "Resposta Vazia" },
  auth_error: { variant: "destructive", label: "Auth Erro" },
  upload_error: { variant: "secondary", label: "Upload Erro" },
};

export default function MonitoramentoTecnico() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filterTool, setFilterTool] = useState("all");
  const [filterEvent, setFilterEvent] = useState("all");
  const [timeRange, setTimeRange] = useState("24h");

  // Check admin access
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
      const hoursMap: Record<string, number> = { "1h": 1, "6h": 6, "24h": 24, "7d": 168, "30d": 720 };
      const hours = hoursMap[timeRange] || 24;
      const since = new Date(Date.now() - hours * 3600_000).toISOString();

      const { data, error } = await supabase
        .from("tool_monitoring_logs")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      setLogs((data as LogEntry[]) || []);
    } catch (e: any) {
      toast.error("Erro ao carregar logs: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchLogs();
  }, [isAdmin, timeRange]);

  // Compute tool stats
  const toolStats = useMemo<ToolStats[]>(() => {
    const map = new Map<string, { total: number; errors: number; responseTimes: number[]; lastError: string | null }>();
    for (const log of logs) {
      const entry = map.get(log.tool_name) || { total: 0, errors: 0, responseTimes: [], lastError: null };
      entry.total++;
      if (log.event_type !== "usage") {
        entry.errors++;
        if (!entry.lastError) entry.lastError = log.error_message;
      }
      if (log.response_time_ms) entry.responseTimes.push(log.response_time_ms);
      map.set(log.tool_name, entry);
    }
    return Array.from(map.entries())
      .map(([toolName, s]) => ({
        toolName,
        totalUses: s.total,
        errors: s.errors,
        errorRate: s.total > 0 ? Math.round((s.errors / s.total) * 100) : 0,
        avgResponseMs: s.responseTimes.length > 0
          ? Math.round(s.responseTimes.reduce((a, b) => a + b, 0) / s.responseTimes.length)
          : 0,
        lastError: s.lastError,
      }))
      .sort((a, b) => b.totalUses - a.totalUses);
  }, [logs]);

  // Detect alerts
  const alerts = useMemo<Alert[]>(() => {
    const result: Alert[] = [];
    const byTool = new Map<string, LogEntry[]>();
    for (const log of logs) {
      const arr = byTool.get(log.tool_name) || [];
      arr.push(log);
      byTool.set(log.tool_name, arr);
    }

    for (const [toolName, toolLogs] of byTool) {
      // Check consecutive errors (3+)
      const sorted = [...toolLogs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      let consecutiveErrors = 0;
      for (const l of sorted) {
        if (l.event_type !== "usage") consecutiveErrors++;
        else break;
      }
      if (consecutiveErrors >= 3) {
        result.push({
          id: `consec-${toolName}`,
          type: "consecutive_errors",
          toolName,
          message: `${consecutiveErrors} erros consecutivos detectados`,
          timestamp: sorted[0].created_at,
          count: consecutiveErrors,
        });
      }

      // Check high response time (>10s)
      const slowLogs = toolLogs.filter(l => (l.response_time_ms || 0) > 10000);
      if (slowLogs.length > 0) {
        result.push({
          id: `slow-${toolName}`,
          type: "high_response_time",
          toolName,
          message: `${slowLogs.length} requisições acima de 10s`,
          timestamp: slowLogs[0].created_at,
          count: slowLogs.length,
        });
      }

      // Edge function failure
      const edgeFailures = toolLogs.filter(l => l.error_type === "server_error");
      if (edgeFailures.length >= 2) {
        result.push({
          id: `edge-${toolName}`,
          type: "edge_function_failure",
          toolName,
          message: `${edgeFailures.length} falhas de Edge Function`,
          timestamp: edgeFailures[0].created_at,
          count: edgeFailures.length,
        });
      }
    }

    return result.sort((a, b) => b.count - a.count);
  }, [logs]);

  // Filtered logs for the table
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (filterTool !== "all" && l.tool_name !== filterTool) return false;
      if (filterEvent !== "all" && l.event_type !== filterEvent) return false;
      return true;
    });
  }, [logs, filterTool, filterEvent]);

  const uniqueTools = useMemo(() => [...new Set(logs.map(l => l.tool_name))].sort(), [logs]);

  const handleClearLogs = async () => {
    if (!confirm("Tem certeza que deseja limpar todos os logs de monitoramento?")) return;
    try {
      const { error } = await supabase.from("tool_monitoring_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast.success("Logs limpos com sucesso");
      fetchLogs();
    } catch (e: any) {
      toast.error("Erro ao limpar logs: " + e.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">Esta página é acessível apenas para administradores da plataforma.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Monitoramento Técnico</h1>
          <p className="text-muted-foreground">Monitoramento de erros, uso e desempenho das ferramentas</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 hora</SelectItem>
              <SelectItem value="6h">6 horas</SelectItem>
              <SelectItem value="24h">24 horas</SelectItem>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="destructive" size="icon" onClick={handleClearLogs}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Eventos</CardDescription>
            <CardTitle className="text-3xl">{logs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Erros</CardDescription>
            <CardTitle className="text-3xl text-destructive">
              {logs.filter(l => l.event_type !== "usage").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taxa de Erro</CardDescription>
            <CardTitle className="text-3xl">
              {logs.length > 0
                ? Math.round((logs.filter(l => l.event_type !== "usage").length / logs.length) * 100)
                : 0}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Alertas Ativos</CardDescription>
            <CardTitle className="text-3xl text-orange-500">{alerts.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-orange-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Alertas ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div>
                  <p className="font-medium">{alert.toolName}</p>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                </div>
                <Badge variant="outline" className="text-orange-500 border-orange-500">
                  {alert.type === "consecutive_errors" ? "Erros Consecutivos" :
                   alert.type === "high_response_time" ? "Lento" : "Edge Function"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="analytics">
        <TabsList>
          <TabsTrigger value="analytics" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-1">
            <Activity className="h-4 w-4" /> Logs
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Ferramentas</CardTitle>
              <CardDescription>Ordenado por uso — período selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              {toolStats.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum dado de uso registrado no período.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ferramenta</TableHead>
                      <TableHead className="text-right">Usos</TableHead>
                      <TableHead className="text-right">Erros</TableHead>
                      <TableHead className="text-right">Taxa de Erro</TableHead>
                      <TableHead className="text-right">Tempo Médio</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {toolStats.map(stat => (
                      <TableRow key={stat.toolName}>
                        <TableCell className="font-medium">{stat.toolName}</TableCell>
                        <TableCell className="text-right">{stat.totalUses}</TableCell>
                        <TableCell className="text-right">{stat.errors}</TableCell>
                        <TableCell className="text-right">
                          <span className={stat.errorRate > 20 ? "text-destructive font-bold" : ""}>
                            {stat.errorRate}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={(stat.avgResponseMs > 10000) ? "text-orange-500 font-bold" : ""}>
                            {stat.avgResponseMs > 0 ? `${(stat.avgResponseMs / 1000).toFixed(1)}s` : "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {stat.errorRate === 0 ? (
                            <Badge variant="default">Saudável</Badge>
                          ) : stat.errorRate < 10 ? (
                            <Badge variant="secondary">Adequado</Badge>
                          ) : stat.errorRate < 30 ? (
                            <Badge variant="outline" className="text-orange-500 border-orange-500">Atenção</Badge>
                          ) : (
                            <Badge variant="destructive">Crítico</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <div className="flex gap-2">
            <Select value={filterTool} onValueChange={setFilterTool}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filtrar ferramenta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ferramentas</SelectItem>
                {uniqueTools.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterEvent} onValueChange={setFilterEvent}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="usage">Sucesso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
                <SelectItem value="timeout">Timeout</SelectItem>
                <SelectItem value="auth_error">Auth Erro</SelectItem>
                <SelectItem value="empty_response">Resposta Vazia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              {filteredLogs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum log encontrado para os filtros selecionados.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Ferramenta</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Erro</TableHead>
                        <TableHead className="text-right">Tempo</TableHead>
                        <TableHead>Request ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.slice(0, 100).map(log => {
                        const badge = EVENT_BADGE_MAP[log.event_type] || { variant: "outline" as const, label: log.event_type };
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString("pt-BR")}
                            </TableCell>
                            <TableCell className="font-medium text-sm">{log.tool_name}</TableCell>
                            <TableCell>
                              <Badge variant={badge.variant}>{badge.label}</Badge>
                            </TableCell>
                            <TableCell className="text-xs max-w-[200px] truncate" title={log.error_message || ""}>
                              {log.error_message || "—"}
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              {log.response_time_ms ? `${(log.response_time_ms / 1000).toFixed(1)}s` : "—"}
                            </TableCell>
                            <TableCell className="text-xs font-mono truncate max-w-[120px]" title={log.request_id || ""}>
                              {log.request_id?.slice(0, 8) || "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
