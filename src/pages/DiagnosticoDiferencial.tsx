import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stethoscope, Loader2, AlertCircle, AlertTriangle, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cleanTextForDisplay } from "@/lib/textUtils";
import { useCrmvValidation, UFS, SPECIES_OPTIONS } from "@/hooks/useCrmvValidation";

const DiagnosticoDiferencial = () => {
  const { toast } = useToast();
  const { validateAndNotify } = useCrmvValidation();
  const [loading, setLoading] = useState(false);
  const [isProfessional, setIsProfessional] = useState("");
  const [crmv, setCrmv] = useState("");
  const [uf, setUf] = useState("");
  const [species, setSpecies] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [history, setHistory] = useState("");
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const validateInputs = (): boolean => {
    if (!isProfessional) {
      toast({
        title: "Campo obrigatório",
        description: "Informe se você é profissional da área.",
        variant: "destructive",
      });
      return false;
    }

    // Gate keeper: CRMV + UF validation for professionals
    if (isProfessional === "sim") {
      const crmvResult = validateAndNotify(true, crmv, uf);
      if (!crmvResult.isValid) {
        return false;
      }
    }

    if (!species.trim()) {
      toast({
        title: "Dados incompletos",
        description: "Selecione a espécie do animal.",
        variant: "destructive",
      });
      return false;
    }

    if (!age.trim()) {
      toast({
        title: "Dados incompletos",
        description: "Informe a idade do animal. Exemplo: 5 anos, 8 meses, filhote.",
        variant: "destructive",
      });
      return false;
    }

    if (!weight.trim()) {
      toast({
        title: "Dados incompletos",
        description: "Informe o peso do animal. Exemplo: 25 kg, 450 kg.",
        variant: "destructive",
      });
      return false;
    }

    if (!symptoms.trim() || symptoms.trim().length < 20) {
      toast({
        title: "Sinais clínicos insuficientes",
        description: "Descreva os sinais clínicos com mais detalhes. Exemplo: Anorexia há 3 dias, apatia, vômitos frequentes, desidratação moderada, mucosas pálidas.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleCopyReport = async () => {
    if (!result) return;

    const fullReport = `${result}\n\n---\nRelatório gerado via VetAgro Sustentável AI — Análise Assistida © 2025`;

    try {
      await navigator.clipboard.writeText(fullReport);
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "Relatório copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar. Selecione o texto manualmente.",
        variant: "destructive",
      });
    }
  };

  const handleAnalyze = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const userType = isProfessional === "sim" ? "Profissional Veterinário" : "Tutor/Produtor";
      const speciesLabel = SPECIES_OPTIONS.find(s => s.value === species)?.label || species;
      
      const prompt = `Você é um sistema especialista em diagnóstico veterinário MULTIESPÉCIE. Analise o caso clínico abaixo e forneça um diagnóstico diferencial estruturado.

IMPORTANTE: Adapte sua análise à espécie informada. Você é capaz de diagnosticar qualquer espécie animal (caninos, felinos, equinos, bovinos, suínos, aves, etc.).

DADOS DO CASO:
- Tipo de Usuário: ${userType}${isProfessional === "sim" ? ` (CRMV: ${crmv}-${uf.toUpperCase()})` : ""}
- Espécie: ${speciesLabel}
- Idade: ${age}
- Peso: ${weight}
- Sinais Clínicos: ${symptoms}
${history ? `- Histórico: ${history}` : ""}

INSTRUÇÕES DE FORMATAÇÃO (OBRIGATÓRIO):
1. NÃO use hashtags (#), asteriscos (*), emojis ou símbolos markdown
2. Use TÍTULOS EM MAIÚSCULAS seguidos de dois pontos para seções
3. Use pontos (•) ou traços (–) para listas
4. Mantenha parágrafos bem espaçados e organizados

ESTRUTURA OBRIGATÓRIA DO RELATÓRIO:

IDENTIFICAÇÃO DO CASO:
• Tipo de usuário: ${userType}
• Espécie: ${species}
• Idade: ${age}
• Peso: ${weight}
• Sinais clínicos principais: [resumo]
• Histórico relevante: [se houver]

ANÁLISE CLÍNICA:
${isProfessional === "sim" 
  ? "Forneça análise técnica detalhada dos sinais clínicos, correlacionando achados e mecanismos fisiopatológicos envolvidos."
  : "Explique de forma clara e acessível o que os sinais observados podem indicar, usando linguagem simples."}

DIAGNÓSTICOS DIFERENCIAIS:
Liste em ordem de probabilidade (do mais ao menos provável):
1. [Diagnóstico mais provável] – [justificativa breve]
2. [Segundo diagnóstico] – [justificativa breve]
3. [Terceiro diagnóstico] – [justificativa breve]
4. [Quarto diagnóstico, se aplicável] – [justificativa breve]

EXAMES COMPLEMENTARES RECOMENDADOS:
• [Exame 1] – [objetivo/justificativa]
• [Exame 2] – [objetivo/justificativa]
• [Exame 3] – [objetivo/justificativa]

NÍVEIS DE URGÊNCIA E SINAIS CRÍTICOS:
• Classificação de urgência: [Baixa/Moderada/Alta/Emergência]
• Sinais de alerta que exigem atenção imediata: [listar]

RECOMENDAÇÕES DE MANEJO:
${isProfessional === "sim"
  ? "• Condutas terapêuticas iniciais sugeridas\n• Monitoramento recomendado\n• Prognóstico preliminar"
  : "• Cuidados imediatos que o tutor pode oferecer\n• O que observar nas próximas horas\n• Quando procurar atendimento urgente"}

ALERTA LEGAL:
Esta análise tem caráter orientativo e educacional. O diagnóstico definitivo requer avaliação clínica presencial por médico veterinário habilitado, com exame físico completo e exames complementares apropriados.

REFERÊNCIAS:
• Merck Veterinary Manual – [tópico específico consultado]
• [Referência científica relevante ao caso, ex: JAVMA, Veterinary Clinics, etc.]
• [Literatura técnica adicional se aplicável]`;

      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          question: prompt,
          isProfessional: isProfessional === "sim",
          context: "Diagnóstico diferencial veterinário",
        },
      });

      if (error) throw error;

      const cleanedResult = cleanTextForDisplay(data.answer);
      setResult(cleanedResult);
      
      toast({
        title: "Análise concluída!",
        description: "Diagnóstico diferencial gerado com sucesso.",
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

  const getUserInputs = () => ({
    "Tipo de Usuário": isProfessional === "sim" ? `Profissional (CRMV: ${crmv}-${uf.toUpperCase()})` : "Tutor/Produtor",
    "Espécie": SPECIES_OPTIONS.find(s => s.value === species)?.label || species,
    "Idade": age,
    "Peso": weight,
    "Sinais Clínicos": symptoms,
    ...(history && { "Histórico": history }),
  });

  const getReferences = () => [
    "Merck Veterinary Manual — Diagnóstico Clínico Veterinário",
    "Nelson, R.W. & Couto, C.G. — Medicina Interna de Pequenos Animais",
    "Radostits, O.M. et al. — Clínica Veterinária: Tratado de Doenças",
    "JAVMA — Journal of the American Veterinary Medical Association",
    "Ettinger, S.J. & Feldman, E.C. — Textbook of Veterinary Internal Medicine",
  ];


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Stethoscope className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Diagnóstico Diferencial Inteligente</h1>
            <p className="text-muted-foreground">Gere hipóteses diagnósticas com base em sinais clínicos</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Identificação Profissional</CardTitle>
            <CardDescription>
              Informe se você é um profissional da área veterinária
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={isProfessional} onValueChange={setIsProfessional}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="prof-sim" />
                <Label htmlFor="prof-sim">Sou Médico(a) Veterinário(a)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="prof-nao" />
                <Label htmlFor="prof-nao">Não sou profissional da área (tutor/produtor)</Label>
              </div>
            </RadioGroup>

            {isProfessional === "sim" && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-foreground">CRMV obrigatório para respostas técnicas</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="crmv">Número CRMV *</Label>
                    <Input
                      id="crmv"
                      placeholder="Ex: 12345"
                      value={crmv}
                      onChange={(e) => setCrmv(e.target.value.replace(/\D/g, ""))}
                      maxLength={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="uf">UF *</Label>
                    <Select value={uf} onValueChange={setUf}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {UFS.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="col-span-2 text-xs text-muted-foreground mt-2">
                  CRMV e UF obrigatórios para emissão de análise técnica completa
                </p>
              </div>
            )}

            {isProfessional === "nao" && (
              <div className="mt-4 p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Atenção</p>
                    <p className="text-sm text-muted-foreground">
                      A resposta será educativa e orientativa. Para diagnóstico e tratamento, 
                      consulte um médico veterinário.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Animal</CardTitle>
            <CardDescription>
              Informações básicas sobre o paciente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="species">Espécie *</Label>
                <Select value={species} onValueChange={setSpecies}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a espécie" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIES_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Idade *</Label>
                  <Input
                    id="age"
                    placeholder="Ex: 5 anos"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Peso *</Label>
                  <Input
                    id="weight"
                    placeholder="Ex: 25 kg"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sinais Clínicos</CardTitle>
            <CardDescription>
              Descreva detalhadamente os sinais observados no animal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="symptoms">Descrição dos Sinais *</Label>
                <Textarea
                  id="symptoms"
                  placeholder="Ex: Anorexia há 3 dias, apatia, vômitos frequentes, desidratação moderada, mucosas pálidas..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Quanto mais detalhes você fornecer, mais precisa será a análise.
                </p>
              </div>
              <div>
                <Label htmlFor="history">Histórico (opcional)</Label>
                <Textarea
                  id="history"
                  placeholder="Ex: Vacinação em dia, castrado, sem histórico de doenças prévias..."
                  value={history}
                  onChange={(e) => setHistory(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleAnalyze}
          disabled={loading || !isProfessional}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Stethoscope className="mr-2 h-5 w-5" />
              Gerar Diagnóstico Diferencial
            </>
          )}
        </Button>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Diagnósticos Diferenciais</CardTitle>
              <CardDescription>
                Análise baseada nos sinais clínicos informados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm leading-relaxed">
                  {result}
                </div>
              </div>

              {isProfessional === "nao" && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Esta análise tem caráter informativo. É fundamental procurar um médico veterinário para avaliação presencial e diagnóstico definitivo.
                  </p>
                </div>
              )}

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-3 italic">
                  Relatório gerado via VetAgro Sustentável AI — Análise Assistida © 2025
                </p>
                
                <Button
                  onClick={handleCopyReport}
                  variant="outline"
                  className="w-full"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar Relatório
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DiagnosticoDiferencial;
