import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Leaf, Loader2, HelpCircle, TreePine, Droplets, Recycle, Award, TrendingUp, Lightbulb, CheckCircle2, Sprout, DollarSign, FileCheck, Target, MapPin, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MarkdownTableRenderer } from "@/components/MarkdownTableRenderer";
import { ResponseActionButtons } from "@/components/ResponseActionButtons";

const AnaliseSustentabilidade = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [perfilUsuario, setPerfilUsuario] = useState("");
  const [tipoProducao, setTipoProducao] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [escalaProdutiva, setEscalaProdutiva] = useState("");
  const [objetivoPrincipal, setObjetivoPrincipal] = useState("");
  const [praticasAtuais, setPraticasAtuais] = useState("");
  
  // Results
  const [result, setResult] = useState("");
  const [sustainabilityScore, setSustainabilityScore] = useState<number | null>(null);
  const [maturidadeAmbiental, setMaturidadeAmbiental] = useState("");
  const [maturidadeProdutiva, setMaturidadeProdutiva] = useState("");
  const [maturidadeGestao, setMaturidadeGestao] = useState("");

  const perfilOptions = [
    { value: "produtor", label: "Produtor Rural" },
    { value: "tecnico", label: "Profissional Técnico (Vet, Zoo, Eng. Agrônomo)" },
    { value: "pesquisador", label: "Pesquisador / Acadêmico" },
    { value: "gestor", label: "Gestor / ESG" },
    { value: "estudante", label: "Estudante" },
  ];

  const tipoProducaoOptions = [
    { value: "pecuaria-corte", label: "Pecuária de Corte" },
    { value: "pecuaria-leite", label: "Pecuária Leiteira" },
    { value: "agricultura", label: "Agricultura" },
    { value: "ilpf", label: "ILPF - Integração Lavoura-Pecuária-Floresta" },
    { value: "silvicultura", label: "Silvicultura" },
    { value: "fruticultura", label: "Fruticultura" },
    { value: "olericultura", label: "Olericultura" },
    { value: "avicultura", label: "Avicultura" },
    { value: "suinocultura", label: "Suinocultura" },
    { value: "aquicultura", label: "Aquicultura" },
    { value: "misto", label: "Sistema Misto" },
  ];

  const escalaOptions = [
    { value: "pequena", label: "Pequena (até 100 ha)" },
    { value: "media", label: "Média (100-500 ha)" },
    { value: "grande", label: "Grande (500-2000 ha)" },
    { value: "muito-grande", label: "Muito Grande (acima de 2000 ha)" },
  ];

  const objetivoOptions = [
    { value: "diagnostico", label: "Diagnóstico geral de sustentabilidade" },
    { value: "certificacao", label: "Buscar certificações ambientais" },
    { value: "carbono", label: "Avaliar potencial de crédito de carbono" },
    { value: "esg", label: "Adequação ESG" },
    { value: "melhoria", label: "Identificar oportunidades de melhoria" },
    { value: "psa", label: "Avaliar PSA (Pagamento por Serviços Ambientais)" },
    { value: "incentivos", label: "Acessar políticas públicas e incentivos" },
  ];

  // EXEMPLO GUIADO DE RORAIMA
  const carregarExemploRoraima = () => {
    setPerfilUsuario("produtor");
    setTipoProducao("pecuaria-corte");
    setLocalizacao("Roraima");
    setEscalaProdutiva("grande");
    setObjetivoPrincipal("incentivos");
    setPraticasAtuais(`Propriedade rural localizada em Roraima, com pecuária de corte em sistema extensivo, área aproximada de 800 hectares. Possui reserva legal conservada, não realiza queimadas, utiliza rotação de pastagens em parte da área, mantém nascentes protegidas, faz manejo adequado de resíduos e busca melhorar o bem-estar animal. Interesse em acessar programas de incentivo ambiental, crédito rural sustentável e certificações.`);
    
    toast({
      title: "Exemplo carregado!",
      description: "Dados de uma propriedade sustentável de Roraima foram inseridos. Você pode editar ou usar como está.",
    });
  };

  const handleAnalyze = async () => {
    if (!perfilUsuario || !tipoProducao || !localizacao.trim() || !praticasAtuais.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o perfil, tipo de produção, localização e práticas atuais.",
        variant: "destructive",
      });
      return;
    }

    if (loading) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          tool: "analise-sustentabilidade",
          perfilUsuario,
          tipoProducao: tipoProducaoOptions.find(t => t.value === tipoProducao)?.label || tipoProducao,
          localizacao,
          escalaProdutiva: escalaOptions.find(e => e.value === escalaProdutiva)?.label || escalaProdutiva,
          objetivoPrincipal: objetivoOptions.find(o => o.value === objetivoPrincipal)?.label || objetivoPrincipal,
          praticasAtuais,
          question: `ANÁLISE ESTRATÉGICA DE SUSTENTABILIDADE — VetAgro Sustentável AI

DADOS DA PROPRIEDADE:
• Perfil do Usuário: ${perfilOptions.find(p => p.value === perfilUsuario)?.label}
• Tipo de Produção: ${tipoProducaoOptions.find(t => t.value === tipoProducao)?.label}
• Localização: ${localizacao}
• Escala Produtiva: ${escalaOptions.find(e => e.value === escalaProdutiva)?.label || "Não informada"}
• Objetivo Principal: ${objetivoOptions.find(o => o.value === objetivoPrincipal)?.label || "Diagnóstico geral"}

PRÁTICAS ATUAIS E CONTEXTO INFORMADO PELO PRODUTOR:
${praticasAtuais}

---

INSTRUÇÕES OBRIGATÓRIAS PARA GERAÇÃO DA RESPOSTA:

TOM ESTRATÉGICO:
• VALORIZE o produtor — reconheça o que ele já faz de positivo
• TIRE O MEDO da palavra "sustentabilidade" — mostre que é estratégia, não custo
• CONECTE sustentabilidade com DINHEIRO, POLÍTICA PÚBLICA e FUTURO
• MOSTRE que o produtor já está no caminho certo e pode ganhar mais com isso
• USE linguagem motivadora, clara e técnica ao mesmo tempo

ESTRUTURA OBRIGATÓRIA DA RESPOSTA (8 SEÇÕES):

1. SÍNTESE EXECUTIVA DE SUSTENTABILIDADE
Resumo direto do nível de sustentabilidade da propriedade e seu potencial de valorização. Comece reconhecendo os pontos positivos.

2. PRÁTICAS SUSTENTÁVEIS JÁ EXISTENTES NA PROPRIEDADE
Liste e VALORIZE ações que o produtor já faz, mesmo que ele não reconheça como sustentabilidade:
• Manutenção de reserva legal
• Proteção de APPs e nascentes
• Ausência de queimadas
• Manejo racional de pastagens
• Bem-estar animal
• Uso eficiente da água
• Outras práticas identificadas
ENFATIZE: "Essas práticas já geram valor ambiental e podem ser reconhecidas."

3. OPORTUNIDADES DE MELHORIA AO ALCANCE DO PRODUTOR
Apresente ações SIMPLES, REALISTAS e de BAIXO CUSTO:
• Ajustes de manejo
• Organização de registros ambientais
• Pequenas melhorias de infraestrutura
• Planejamento forrageiro
• Monitoramento básico ambiental
Seja prático — não liste coisas inatingíveis.

4. CONEXÃO COM POLÍTICAS PÚBLICAS E INCENTIVOS
Explique de forma CLARA e MOTIVADORA:
• Crédito rural diferenciado (Banco do Brasil, BNDES, Plano ABC+)
• Programas de PSA — Pagamento por Serviços Ambientais
• Prioridade em programas ambientais e produtivos
• Certificações que abrem portas
• Programas estaduais e federais disponíveis
DEIXE CLARO: "O produtor sustentável hoje é prioridade para políticas públicas e instituições financeiras."

5. POTENCIAL DE VALORIZAÇÃO DA PROPRIEDADE
Demonstre benefícios concretos:
• Melhor imagem institucional e reputação
• Facilidade de acesso a crédito
• Maior resiliência climática
• Acesso a mercados diferenciados
• Base para projetos de carbono e sustentabilidade
• Valorização patrimonial

6. PRÓXIMOS PASSOS RECOMENDADOS
Checklist simples e prático:
• Organizar informações ambientais da propriedade
• Buscar assistência técnica especializada
• Avaliar certificações aplicáveis
• Monitorar indicadores básicos de sustentabilidade
• Documentar práticas já existentes

7. ALERTA LEGAL
"Esta análise tem caráter orientativo e não substitui avaliações técnicas, auditorias ou validações oficiais."

8. REFERÊNCIAS INSTITUCIONAIS
Liste APENAS fontes oficiais:
• MAPA — Ministério da Agricultura, Pecuária e Abastecimento
• EMBRAPA — Empresa Brasileira de Pesquisa Agropecuária
• MMA — Ministério do Meio Ambiente
• Banco do Brasil / BNDES — Linhas de crédito sustentável
• FAO — Organização das Nações Unidas para Alimentação e Agricultura (quando aplicável)

REGRAS DE FORMATAÇÃO:
• Proibido usar hashtags (#), asteriscos (*) ou emojis no texto
• Use apenas bullets padrão (• ou –) para listas
• Títulos das seções em MAIÚSCULAS seguidos de dois pontos
• Texto justificado e escaneável
• Parágrafos curtos (máximo 4-5 linhas)
• Linguagem técnica mas acessível

OBJETIVO FINAL:
O produtor deve sair da análise pensando: "Eu já faço muita coisa certa — e posso ganhar mais com isso."`,
          isProfessional: perfilUsuario === "tecnico" || perfilUsuario === "pesquisador",
          context: "Análise estratégica de sustentabilidade rural",
        },
      });

      if (error) throw error;

      setResult(data.answer);

      // Extract sustainability score
      const scoreMatch = data.answer.match(/PONTUAÇÃO[:\s]*(\d+)%/i) || 
                        data.answer.match(/MATURIDADE[:\s]*(\d+)%/i) ||
                        data.answer.match(/(\d+)%\s*de\s*maturidade/i);
      if (scoreMatch) {
        setSustainabilityScore(parseInt(scoreMatch[1]));
      }

      // Extract maturity levels
      const ambientalMatch = data.answer.match(/Dimensão Ambiental[:\s]*(Baixa|Média|Alta)/i);
      const produtivaMatch = data.answer.match(/Dimensão Produtiva[:\s]*(Baixa|Média|Alta)/i);
      const gestaoMatch = data.answer.match(/Dimensão de Gestão[:\s]*(Baixa|Média|Alta)/i);
      
      if (ambientalMatch) setMaturidadeAmbiental(ambientalMatch[1]);
      if (produtivaMatch) setMaturidadeProdutiva(produtivaMatch[1]);
      if (gestaoMatch) setMaturidadeGestao(gestaoMatch[1]);

      toast({
        title: "Análise concluída!",
        description: "Relatório estratégico de sustentabilidade gerado com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro ao analisar",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMaturidadeColor = (nivel: string) => {
    switch (nivel.toLowerCase()) {
      case "alta": return "bg-green-500 text-white";
      case "média": return "bg-yellow-500 text-white";
      case "baixa": return "bg-red-500 text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-emerald-600";
    if (score >= 40) return "text-yellow-600";
    if (score >= 20) return "text-orange-600";
    return "text-red-600";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-emerald-500";
    if (score >= 40) return "bg-yellow-500";
    if (score >= 20) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header com conceito estratégico */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <Leaf className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Análise de Sustentabilidade</h1>
            <p className="text-muted-foreground">Avaliação do nível de maturidade sustentável da propriedade rural</p>
          </div>
        </div>
        
        {/* BLOCO EXPLICATIVO INSTITUCIONAL - INSPIRADOR */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800 mb-6">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-green-800 dark:text-green-200 mb-2">
                  Sustentabilidade hoje não é custo — é estratégia, valorização e acesso a incentivos.
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Esta ferramenta avalia o nível de sustentabilidade da sua propriedade rural e mostra, 
                  de forma prática, quais ações já realizadas podem gerar reconhecimento, acesso a políticas 
                  públicas, programas governamentais, certificações, crédito diferenciado e oportunidades 
                  de remuneração ambiental.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de benefícios visuais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="text-xs font-medium text-green-700 dark:text-green-300">Crédito Diferenciado</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <FileCheck className="h-5 w-5 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Certificações</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-teal-50 dark:bg-teal-950/50 rounded-lg border border-teal-200 dark:border-teal-800">
            <Building2 className="h-5 w-5 text-teal-600" />
            <span className="text-xs font-medium text-teal-700 dark:text-teal-300">Políticas Públicas</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-cyan-50 dark:bg-cyan-950/50 rounded-lg border border-cyan-200 dark:border-cyan-800">
            <Award className="h-5 w-5 text-cyan-600" />
            <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300">PSA Ambiental</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
              <CardTitle className="flex items-center gap-2">
                <TreePine className="h-5 w-5 text-green-600" />
                Dados da Propriedade
              </CardTitle>
              <CardDescription>
                Preencha as informações para análise estratégica
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              
              {/* BOTÃO DE EXEMPLO GUIADO - RORAIMA */}
              <Button
                variant="outline"
                onClick={carregarExemploRoraima}
                className="w-full border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-950 text-green-700 dark:text-green-300"
              >
                <Sprout className="mr-2 h-4 w-4" />
                🌱 Usar exemplo de propriedade sustentável (Roraima)
              </Button>

              {/* Perfil do Usuário */}
              <div>
                <Label htmlFor="perfil">Perfil do Usuário *</Label>
                <Select value={perfilUsuario} onValueChange={setPerfilUsuario}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {perfilOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de Produção */}
              <div>
                <Label htmlFor="producao">Tipo de Produção *</Label>
                <Select value={tipoProducao} onValueChange={setTipoProducao}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoProducaoOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Localização */}
              <div>
                <Label htmlFor="localizacao" className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  Localização (Município/Estado) *
                </Label>
                <Input
                  id="localizacao"
                  placeholder="Ex: Cantá, Roraima"
                  value={localizacao}
                  onChange={(e) => setLocalizacao(e.target.value)}
                />
              </div>

              {/* Escala Produtiva */}
              <div>
                <Label htmlFor="escala">Escala Produtiva</Label>
                <Select value={escalaProdutiva} onValueChange={setEscalaProdutiva}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a escala" />
                  </SelectTrigger>
                  <SelectContent>
                    {escalaOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Objetivo Principal */}
              <div>
                <Label htmlFor="objetivo">Objetivo Principal</Label>
                <Select value={objetivoPrincipal} onValueChange={setObjetivoPrincipal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {objetivoOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Práticas Atuais */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="praticas">Práticas Atuais e Contexto *</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Descreva: manejo atual, reserva legal, APP, nascentes, uso de queimadas, gestão de resíduos, bem-estar animal, interesse em certificações ou incentivos.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Textarea
                  id="praticas"
                  placeholder="Descreva as práticas atuais da propriedade, o que você já faz de bom para o meio ambiente e a produção..."
                  value={praticasAtuais}
                  onChange={(e) => setPraticasAtuais(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>

              {/* Botão Analisar */}
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analisando sua propriedade...
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    Analisar Sustentabilidade
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Maturity Indicators */}
          {(maturidadeAmbiental || maturidadeProdutiva || maturidadeGestao) && (
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Diagnóstico de Maturidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Ambiental</p>
                    <Badge className={getMaturidadeColor(maturidadeAmbiental)}>
                      {maturidadeAmbiental || "—"}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Produtiva</p>
                    <Badge className={getMaturidadeColor(maturidadeProdutiva)}>
                      {maturidadeProdutiva || "—"}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Gestão</p>
                    <Badge className={getMaturidadeColor(maturidadeGestao)}>
                      {maturidadeGestao || "—"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Score */}
          {sustainabilityScore !== null && (
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Award className="h-5 w-5 text-amber-500" />
                  Índice Geral de Sustentabilidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pontuação</span>
                    <span className={`text-2xl font-bold ${getScoreColor(sustainabilityScore)}`}>
                      {sustainabilityScore}%
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={sustainabilityScore} className="h-3" />
                    <div 
                      className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getProgressColor(sustainabilityScore)}`}
                      style={{ width: `${sustainabilityScore}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Result - TEXTO EM BLOCO CONTÍNUO */}
          {result && (
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Recycle className="h-5 w-5 text-green-600" />
                    Relatório Estratégico de Sustentabilidade
                  </CardTitle>
                </div>
                <CardDescription>
                  VetAgro Sustentável AI — Valorização e oportunidades para sua propriedade
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Texto em bloco contínuo - SEM scroll interno */}
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <MarkdownTableRenderer 
                    content={result}
                    className="bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/30 dark:to-emerald-950/30 p-6 rounded-xl border border-green-200 dark:border-green-800"
                  />
                </div>
                
                {/* BOTÕES PADRÃO: Copiar + Compartilhar */}
                <ResponseActionButtons
                  content={result}
                  title="Relatório Estratégico de Sustentabilidade"
                  toolName="Análise de Sustentabilidade"
                />

                {/* Mensagem motivadora */}
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-center text-green-700 dark:text-green-300 font-medium">
                    🌱 Você já está no caminho certo! Compartilhe este relatório e inspire outros produtores.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!result && (
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
                  <Sprout className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Descubra o Valor da Sua Propriedade
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Preencha os dados e descubra como suas práticas já geram valor ambiental, 
                  quais incentivos você pode acessar e como se posicionar melhor para o futuro.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    variant="outline" 
                    onClick={carregarExemploRoraima}
                    className="border-green-300 hover:bg-green-50 text-green-700"
                  >
                    <Sprout className="mr-2 h-4 w-4" />
                    🌱 Usar exemplo de Roraima
                  </Button>
                </div>

                {/* Benefícios destacados */}
                <div className="mt-8 grid grid-cols-2 gap-4 max-w-lg mx-auto text-left">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">Valorize o que você já faz</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">Acesse crédito diferenciado</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">Conheça políticas públicas</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">Prepare-se para certificações</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnaliseSustentabilidade;
