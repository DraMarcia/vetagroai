import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Stethoscope, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ReportExporter } from "@/components/ReportExporter";
import { cleanTextForDisplay } from "@/lib/textUtils";

const DiagnosticoDiferencial = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isProfessional, setIsProfessional] = useState("");
  const [crmv, setCrmv] = useState("");
  const [species, setSpecies] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [history, setHistory] = useState("");
  const [result, setResult] = useState("");

  const validateInputs = (): boolean => {
    if (!isProfessional) {
      toast({
        title: "Campo obrigatório",
        description: "Informe se você é profissional da área.",
        variant: "destructive",
      });
      return false;
    }

    if (isProfessional === "sim" && !crmv.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Informe seu número de CRMV.",
        variant: "destructive",
      });
      return false;
    }

    if (!species.trim()) {
      toast({
        title: "Dados incompletos",
        description: "Informe a espécie do animal. Exemplo: Canina, Felina, Bovina, Equina.",
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

  const handleAnalyze = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const userType = isProfessional === "sim" ? "Profissional Veterinário" : "Tutor/Produtor";
      
      const prompt = `Você é um sistema especialista em diagnóstico veterinário. Analise o caso clínico abaixo e forneça um diagnóstico diferencial estruturado.

DADOS DO CASO:
- Tipo de Usuário: ${userType}${isProfessional === "sim" ? ` (CRMV: ${crmv})` : ""}
- Espécie: ${species}
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
    "Tipo de Usuário": isProfessional === "sim" ? `Profissional (CRMV: ${crmv})` : "Tutor/Produtor",
    "Espécie": species,
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
            <CardTitle>Identificação</CardTitle>
            <CardDescription>
              Informe se você é um profissional da área veterinária
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={isProfessional} onValueChange={setIsProfessional}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="prof-sim" />
                <Label htmlFor="prof-sim">Sou profissional da área veterinária</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="prof-nao" />
                <Label htmlFor="prof-nao">Não sou profissional (tutor/produtor)</Label>
              </div>
            </RadioGroup>

            {isProfessional === "sim" && (
              <div className="mt-4">
                <Label htmlFor="crmv">CRMV *</Label>
                <Input
                  id="crmv"
                  placeholder="Ex: CRMV-SP 12345"
                  value={crmv}
                  onChange={(e) => setCrmv(e.target.value)}
                />
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
                <Input
                  id="species"
                  placeholder="Ex: Canina, Felina, Bovina, Equina..."
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                />
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
            <CardContent>
              <div className="space-y-4">
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

                <ReportExporter
                  title="Diagnóstico Diferencial Veterinário"
                  content={result}
                  toolName="Diagnóstico Diferencial Inteligente"
                  references={getReferences()}
                  userInputs={getUserInputs()}
                  className="w-full"
                  variant="outline"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DiagnosticoDiferencial;
