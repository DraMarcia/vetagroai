import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Sparkles, Loader2, FileText, Crown, Info, Copy, Share2 } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { UpgradeModal } from "@/components/UpgradeModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MarkdownTableRenderer } from "@/components/MarkdownTableRenderer";
import { ReportExporter } from "@/components/ReportExporter";

const biomas = [
  "Amazônia",
  "Cerrado",
  "Mata Atlântica",
  "Caatinga",
  "Pampa",
  "Pantanal"
];

const perfisUsuario = [
  { value: "produtor", label: "Produtor Rural" },
  { value: "tecnico", label: "Técnico / Consultor (Vet, Zoo, Eng. Agrônomo)" },
  { value: "pesquisador", label: "Pesquisador / Acadêmico" },
  { value: "gestor", label: "Gestor Público / ESG" },
  { value: "estudante", label: "Estudante" }
];

const tiposProducao = [
  "Pecuária de corte",
  "Pecuária leiteira",
  "Agricultura de grãos",
  "Silvicultura",
  "ILPF (Integração Lavoura-Pecuária-Floresta)",
  "Aquicultura",
  "Avicultura",
  "Suinocultura",
  "Fruticultura",
  "Horticultura"
];

const objetivosConsulta = [
  "Análise de vulnerabilidade climática",
  "Oportunidades de crédito de carbono",
  "Práticas sustentáveis recomendadas",
  "Certificações ambientais aplicáveis",
  "Pagamento por Serviços Ambientais (PSA)",
  "Riscos e oportunidades regionais",
  "Adequação ambiental e conformidade",
  "Outro (especificar)"
];

const exemploConsultas = [
  {
    titulo: "Amazônia — ILPF para pecuária sustentável",
    perfilUsuario: "produtor",
    bioma: "Amazônia",
    municipio: "Alta Floresta, MT",
    tipoProducao: "ILPF (Integração Lavoura-Pecuária-Floresta)",
    objetivo: "Práticas sustentáveis recomendadas",
    informacoes: "Propriedade de 500 hectares com pecuária extensiva. Desejo converter para sistema ILPF com foco em redução de emissões e certificação."
  },
  {
    titulo: "Cerrado — vulnerabilidade climática do pasto",
    perfilUsuario: "tecnico",
    bioma: "Cerrado",
    municipio: "Rio Verde, GO",
    tipoProducao: "Pecuária de corte",
    objetivo: "Análise de vulnerabilidade climática",
    informacoes: "Região com histórico de secas prolongadas. Preciso avaliar riscos climáticos e estratégias de adaptação para pastagens."
  },
  {
    titulo: "Pantanal — PSA e manejo sustentável",
    perfilUsuario: "gestor",
    bioma: "Pantanal",
    municipio: "Corumbá, MS",
    tipoProducao: "Pecuária de corte",
    objetivo: "Pagamento por Serviços Ambientais (PSA)",
    informacoes: "Fazenda tradicional pantaneira. Interesse em programas de PSA e práticas de manejo que preservem o bioma."
  }
];

const ConsultaGeoespacial = () => {
  const { plan, useCredit, user, hasUnlimited, isLoading: subscriptionLoading } = useSubscription();
  const [perfilUsuario, setPerfilUsuario] = useState("");
  const [bioma, setBioma] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [tipoProducao, setTipoProducao] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [informacoes, setInformacoes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resposta, setResposta] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const carregarExemplo = (exemplo: typeof exemploConsultas[0]) => {
    setPerfilUsuario(exemplo.perfilUsuario);
    setBioma(exemplo.bioma);
    setMunicipio(exemplo.municipio);
    setTipoProducao(exemplo.tipoProducao);
    setObjetivo(exemplo.objetivo);
    setInformacoes(exemplo.informacoes);
  };

  const handleCopyReport = () => {
    if (resposta) {
      navigator.clipboard.writeText(resposta);
      toast.success("Relatório copiado para a área de transferência!");
    }
  };

  const handleShare = () => {
    if (navigator.share && resposta) {
      navigator.share({
        title: "Relatório de Consulta Geoespacial Sustentável - VetAgro AI",
        text: resposta,
      }).catch(() => {
        handleCopyReport();
      });
    } else {
      handleCopyReport();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Faça login para usar esta ferramenta");
      return;
    }

    if (!perfilUsuario || !bioma || !municipio || !tipoProducao || !objetivo) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Check credits for free plan
    if (!hasUnlimited) {
      const canUse = await useCredit();
      if (!canUse) {
        setShowUpgradeModal(true);
        return;
      }
    }

    setIsLoading(true);
    setResposta("");

    try {
      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          tool: "consulta-geoespacial",
          plan,
          data: {
            perfilUsuario,
            bioma,
            municipio,
            tipoProducao,
            objetivo,
            informacoes
          }
        }
      });

      if (error) throw error;
      setResposta(data.response);
    } catch (error) {
      console.error("Erro na consulta:", error);
      toast.error("Erro ao processar consulta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Consulta Geoespacial Sustentável</h1>
              <p className="text-muted-foreground">Análise técnica de biomas, regiões e práticas sustentáveis</p>
            </div>
          </div>

          {/* Texto comercial */}
          <Card className="bg-gradient-to-r from-green-500/10 to-teal-500/10 border-green-500/20 mb-6">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-green-600 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  <strong>Inteligência aplicada à sustentabilidade agropecuária.</strong> Esta ferramenta 
                  combina dados técnicos de biomas brasileiros, legislação ambiental e recomendações práticas 
                  para operações mais eficientes, lucrativas e responsáveis ambientalmente.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Formulário */}
          <Card>
            <CardHeader>
              <CardTitle>Dados da Consulta</CardTitle>
              <CardDescription>Preencha os campos para análise geoespacial personalizada</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Perfil do Usuário */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="perfilUsuario">Perfil do Usuário *</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>A profundidade técnica e linguagem serão adaptadas ao seu perfil</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={perfilUsuario} onValueChange={setPerfilUsuario}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione seu perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {perfisUsuario.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="bioma">Bioma *</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Selecione o bioma brasileiro onde a propriedade está localizada</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={bioma} onValueChange={setBioma}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o bioma" />
                    </SelectTrigger>
                    <SelectContent>
                      {biomas.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="municipio">Município/Estado *</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Informe o município e estado (ex: Rio Verde, GO)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="municipio"
                    value={municipio}
                    onChange={(e) => setMunicipio(e.target.value)}
                    placeholder="Ex: Rio Verde, GO"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="tipoProducao">Tipo de Produção *</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Selecione a atividade produtiva principal</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={tipoProducao} onValueChange={setTipoProducao}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de produção" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposProducao.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="objetivo">Objetivo da Consulta *</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Qual é o principal objetivo desta análise?</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={objetivo} onValueChange={setObjetivo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o objetivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {objetivosConsulta.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="informacoes">Informações Adicionais</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Descreva detalhes sobre a propriedade, área, histórico, etc.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Textarea
                    id="informacoes"
                    value={informacoes}
                    onChange={(e) => setInformacoes(e.target.value)}
                    placeholder="Descreva informações relevantes sobre a propriedade, área, práticas atuais, desafios..."
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || subscriptionLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analisando dados geoespaciais...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      Gerar Relatório Geoespacial
                    </>
                  )}
                </Button>
              </form>

              {/* Texto orientador */}
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Como funciona:</strong> A IA analisará bioma, perfil produtivo, contexto ambiental 
                  e práticas sustentáveis para gerar um relatório técnico completo com diagnóstico, 
                  recomendações e oportunidades estratégicas.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Exemplos e Resposta */}
          <div className="space-y-6">
            {/* Exemplos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Exemplos de Consulta</CardTitle>
                <CardDescription>Clique para preencher automaticamente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {exemploConsultas.map((exemplo, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => carregarExemplo(exemplo)}
                  >
                    <MapPin className="h-4 w-4 mr-2 shrink-0 text-green-600" />
                    <span className="text-sm">{exemplo.titulo}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Resposta */}
            {resposta && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    Relatório de Consulta Geoespacial Sustentável
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MarkdownTableRenderer 
                    content={resposta}
                    className="prose prose-sm max-w-none dark:prose-invert text-sm"
                  />
                  
                  {/* Botões de ação */}
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCopyReport}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar Relatório
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleShare}
                      className="flex items-center gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      Compartilhar
                    </Button>

                    <ReportExporter
                      title="Consulta Geoespacial Sustentável"
                      content={resposta}
                      toolName="Consulta Geoespacial"
                    />
                  </div>

                  {/* Mensagem de compartilhamento */}
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-xs text-muted-foreground text-center">
                      Este relatório pode ser compartilhado com técnicos, produtores ou gestores interessados 
                      em sustentabilidade agropecuária. <strong>Compartilhar conhecimento fortalece a produção responsável.</strong>
                    </p>
                  </div>
                  
                  {plan === "free" && (
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <Crown className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Para relatórios completos e recomendações avançadas, faça upgrade para Pro ou Enterprise.
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
      </div>
    </TooltipProvider>
  );
};

export default ConsultaGeoespacial;
