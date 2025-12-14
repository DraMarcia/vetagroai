import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Calculator, Loader2, Plus, X, AlertTriangle } from "lucide-react";
import { ResponseActionButtons } from "@/components/ResponseActionButtons";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cleanTextForDisplay } from "@/lib/textUtils";
import { MarkdownTableRenderer } from "@/components/MarkdownTableRenderer";

interface ActiveIngredient {
  name: string;
  quantity: string;
}

const CalculadoraDose = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isProfessional, setIsProfessional] = useState<string>("");
  const [crmv, setCrmv] = useState("");
  const [uf, setUf] = useState("");
  const [isManipulated, setIsManipulated] = useState(false);
  const [species, setSpecies] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [medication, setMedication] = useState("");
  const [route, setRoute] = useState("");
  const [clinicalContext, setClinicalContext] = useState("");
  const [activeIngredients, setActiveIngredients] = useState<ActiveIngredient[]>([
    { name: "", quantity: "" }
  ]);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const addIngredient = () => {
    setActiveIngredients([...activeIngredients, { name: "", quantity: "" }]);
  };

  const removeIngredient = (index: number) => {
    const newIngredients = activeIngredients.filter((_, i) => i !== index);
    setActiveIngredients(newIngredients);
  };

  const updateIngredient = (index: number, field: 'name' | 'quantity', value: string) => {
    const newIngredients = [...activeIngredients];
    newIngredients[index][field] = value;
    setActiveIngredients(newIngredients);
  };

  const handleCopyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "O relatório foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto. Tente selecionar manualmente.",
        variant: "destructive",
      });
    }
  };

  const validateCrmv = (crmvValue: string, ufValue: string): boolean => {
    if (!crmvValue.trim() || !ufValue.trim()) return false;
    // Basic validation: CRMV should have at least 3 digits, UF should be 2 letters
    const crmvPattern = /^\d{3,}$/;
    const ufPattern = /^[A-Z]{2}$/i;
    return crmvPattern.test(crmvValue.trim()) && ufPattern.test(ufValue.trim());
  };

  const handleCalculate = async () => {
    // Validate user type selection
    if (!isProfessional) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe se você é um profissional da área.",
        variant: "destructive",
      });
      return;
    }

    // Validate CRMV for professionals
    if (isProfessional === "sim" && !validateCrmv(crmv, uf)) {
      toast({
        title: "CRMV obrigatório",
        description: "Para respostas técnicas completas, informe CRMV e UF obrigatoriamente.",
        variant: "destructive",
      });
      return;
    }

    // Validate basic fields
    if (!species.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Informe a espécie do animal.",
        variant: "destructive",
      });
      return;
    }

    if (!weight.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Informe o peso do animal.",
        variant: "destructive",
      });
      return;
    }

    if (!medication.trim() && !isManipulated) {
      toast({
        title: "Campo obrigatório",
        description: "Informe o medicamento ou princípio ativo.",
        variant: "destructive",
      });
      return;
    }

    if (isManipulated) {
      const hasEmptyFields = activeIngredients.some(ing => !ing.name || !ing.quantity);
      if (hasEmptyFields) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os princípios ativos e quantidades.",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    setResult("");

    try {
      const userType = isProfessional === "sim" ? "profissional" : "tutor";
      
      // Build medication info
      let medicationInfo = medication;
      if (isManipulated) {
        medicationInfo = activeIngredients.map((ing, i) => `${i + 1}. ${ing.name}: ${ing.quantity}`).join("\n");
      }

      // Build structured prompt based on user type
      const systemPrompt = isProfessional === "sim" 
        ? `Você é um farmacologista veterinário especialista. O usuário é um Médico Veterinário (CRMV ${crmv}/${uf.toUpperCase()}).

REGRAS OBRIGATÓRIAS:
1. Forneça cálculo completo com fórmula matemática
2. Inclua dose mínima e máxima baseada em literatura científica
3. Apresente protocolos clínicos detalhados
4. Liste efeitos adversos e contraindicações
5. Mencione interações medicamentosas relevantes
6. Forneça orientações sobre ajuste de dose conforme quadro clínico
7. Sempre inclua referências científicas reais

ESTRUTURA OBRIGATÓRIA DA RESPOSTA:

IDENTIFICAÇÃO DO CASO
• Espécie: [informada]
• Peso: [informado]
• Idade: [informada se disponível]
• Medicamento solicitado: [informado]
• Via de administração: [informada se disponível]

AVALIAÇÃO FARMACOLÓGICA
• Classe terapêutica do fármaco
• Mecanismo de ação resumido
• Biodisponibilidade e metabolismo

CÁLCULO DA DOSE
• Fórmula: Dose (mg) = Peso (kg) × Dose recomendada (mg/kg)
• Dose mínima: X mg/kg
• Dose máxima: Y mg/kg
• Dose calculada para este paciente: Z mg
• Frequência: (SID/BID/TID conforme indicação)
• Duração sugerida do tratamento

ORIENTAÇÕES CLÍNICAS
• Ajustes para insuficiência renal/hepática
• Monitoramento necessário
• Sinais de toxicidade a observar

ALERTAS DE SEGURANÇA
• Contraindicações absolutas
• Contraindicações relativas
• Interações medicamentosas importantes

ORIENTAÇÕES PARA O TUTOR
• Instruções simplificadas para administração
• Sinais de alerta para retorno imediato

QUANDO REAVALIAR
• Critérios para reavaliação clínica

REFERÊNCIAS CIENTÍFICAS
• Merck Veterinary Manual
• Nelson & Couto — Medicina Interna de Pequenos Animais
• Ettinger & Feldman — Textbook of Veterinary Internal Medicine
• VIN (Veterinary Information Network)

AVISO LEGAL
Esta análise é educativa e não substitui avaliação clínica presencial. A responsabilidade pela prescrição é do médico veterinário responsável.

IMPORTANTE:
- Se o medicamento for TÓXICO para a espécie (ex: ibuprofeno para gatos, xilitol para cães), RECUSE o cálculo e emita ALERTA DE TOXICIDADE
- Se a espécie for exótica sem base científica adequada, oriente consulta com especialista
- NUNCA use hashtags, asteriscos ou markdown
- Use apenas bullets simples (•, –, →)
- Linguagem técnica e profissional`
        
        : `Você é um assistente veterinário educativo. O usuário NÃO é profissional da área.

REGRAS OBRIGATÓRIAS:
1. NÃO forneça doses específicas para automedicação
2. Explique de forma simples e acessível
3. SEMPRE reforce a necessidade de consulta veterinária presencial
4. Não mencione protocolos clínicos avançados
5. Foque em orientações gerais de segurança

ESTRUTURA OBRIGATÓRIA DA RESPOSTA:

IDENTIFICAÇÃO DO CASO
• Espécie: [informada]
• Peso: [informado]
• Medicamento consultado: [informado]

ORIENTAÇÃO GERAL
• Explicação simples sobre o medicamento
• Por que é importante não medicar sem orientação veterinária
• Riscos da automedicação em animais

ALERTA IMPORTANTE
A dosagem de medicamentos para animais é diferente da humana e varia conforme:
• Espécie
• Peso
• Idade
• Condição clínica
• Outros medicamentos em uso

RECOMENDAÇÃO
Procure um médico veterinário para:
• Avaliação clínica do seu animal
• Diagnóstico adequado
• Prescrição segura do medicamento correto

SINAIS DE ALERTA
Leve seu animal imediatamente ao veterinário se apresentar:
• Vômitos persistentes
• Diarreia com sangue
• Dificuldade respiratória
• Apatia extrema
• Convulsões

AVISO LEGAL
Esta orientação é educativa e não substitui a consulta veterinária presencial. Nunca medique seu animal sem orientação profissional.

IMPORTANTE:
- Se o medicamento for TÓXICO para a espécie (ex: ibuprofeno para gatos), ALERTE sobre o perigo
- NUNCA use hashtags, asterisks ou markdown
- Use apenas bullets simples (•, –, →)
- Linguagem simples e acessível`;

      const userPrompt = `Calcule a dose para:

DADOS DO PACIENTE:
• Espécie: ${species}
• Peso: ${weight}
• Idade: ${age || "Não informada"}

MEDICAMENTO:
${isManipulated ? `Medicamento Manipulado:\n${medicationInfo}` : `• ${medication}`}

VIA DE ADMINISTRAÇÃO: ${route || "Não especificada"}

CONTEXTO CLÍNICO: ${clinicalContext || "Não informado"}

Forneça a análise seguindo rigorosamente a estrutura definida.`;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/veterinary-consultation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          tool: "calculadora-dose",
          systemPrompt,
          userPrompt,
          isProfessional: isProfessional === "sim",
          plan: "pro" // TODO: Get from user context
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Limite de requisições atingido. Aguarde alguns minutos e tente novamente.");
        }
        if (response.status === 402) {
          throw new Error("Créditos insuficientes. Faça upgrade do seu plano.");
        }
        throw new Error("Erro ao processar a consulta.");
      }

      const data = await response.json();
      const cleanedResult = cleanTextForDisplay(data.answer || data.response || "");
      
      setResult(cleanedResult);
      toast({
        title: "Cálculo realizado!",
        description: "A análise foi gerada com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro ao calcular",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const ufs = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", 
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", 
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Calculator className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Calculadora de Dose Veterinária</h1>
            <p className="text-muted-foreground">Cálculo seguro de doses com validação profissional</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl">
        {/* User Identification */}
        <Card>
          <CardHeader>
            <CardTitle>Identificação Profissional</CardTitle>
            <CardDescription>
              A resposta será adaptada ao seu perfil
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

            {/* CRMV Fields - Only for professionals */}
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
                      onChange={(e) => setCrmv(e.target.value.replace(/\D/g, ''))}
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <Label htmlFor="uf">UF *</Label>
                    <select
                      id="uf"
                      value={uf}
                      onChange={(e) => setUf(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Selecione</option>
                      {ufs.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Warning for non-professionals */}
            {isProfessional === "nao" && (
              <div className="mt-4 p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Atenção</p>
                    <p className="text-sm text-muted-foreground">
                      A resposta será educativa e orientativa. Para dosagem específica, 
                      consulte um médico veterinário.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patient Data */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Paciente</CardTitle>
            <CardDescription>
              Informações do animal para cálculo preciso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="species">Espécie *</Label>
                <Input
                  id="species"
                  placeholder="Ex: Cão, Gato, Bovino"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="weight">Peso *</Label>
                <Input
                  id="weight"
                  placeholder="Ex: 15kg"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="age">Idade</Label>
                <Input
                  id="age"
                  placeholder="Ex: 5 anos"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medication Type */}
        <Card>
          <CardHeader>
            <CardTitle>Tipo de Medicamento</CardTitle>
            <CardDescription>
              O medicamento é manipulado ou comercial?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="manipulated"
                checked={isManipulated}
                onChange={(e) => setIsManipulated(e.target.checked)}
                className="rounded border-input"
              />
              <Label htmlFor="manipulated">Medicamento Manipulado (múltiplos princípios ativos)</Label>
            </div>

            {!isManipulated && (
              <div>
                <Label htmlFor="medication">Medicamento / Princípio Ativo *</Label>
                <Input
                  id="medication"
                  placeholder="Ex: Dipirona, Meloxicam, Amoxicilina"
                  value={medication}
                  onChange={(e) => setMedication(e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Ingredients for Manipulated */}
        {isManipulated && (
          <Card>
            <CardHeader>
              <CardTitle>Princípios Ativos</CardTitle>
              <CardDescription>
                Liste os princípios ativos e suas quantidades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeIngredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`name-${index}`}>Princípio Ativo</Label>
                    <Input
                      id={`name-${index}`}
                      placeholder="Ex: Dipirona"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`quantity-${index}`}>Quantidade</Label>
                    <Input
                      id={`quantity-${index}`}
                      placeholder="Ex: 500mg"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                    />
                  </div>
                  {activeIngredients.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeIngredient(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addIngredient}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Princípio Ativo
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Administration Route and Clinical Context */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Adicionais</CardTitle>
            <CardDescription>
              Via de administração e contexto clínico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="route">Via de Administração</Label>
              <Input
                id="route"
                placeholder="Ex: Oral, Subcutânea, Intramuscular, Intravenosa"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="clinicalContext">Contexto Clínico</Label>
              <Textarea
                id="clinicalContext"
                placeholder="Ex: Pós-operatório, dor aguda, infecção bacteriana..."
                value={clinicalContext}
                onChange={(e) => setClinicalContext(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Calculate Button */}
        <Button
          onClick={handleCalculate}
          disabled={loading || !isProfessional}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Calculando...
            </>
          ) : (
            <>
              <Calculator className="mr-2 h-5 w-5" />
              Calcular Dose
            </>
          )}
        </Button>

        {/* Result */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado da Análise</CardTitle>
              <CardDescription>
                Revise cuidadosamente antes de aplicar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MarkdownTableRenderer 
                content={result}
                className="bg-muted/50 p-4 rounded-lg border border-border text-foreground leading-relaxed"
              />
              
              {/* Action Buttons - Padrão Global */}
              <div className="pt-2">
                <ResponseActionButtons
                  content={result}
                  title="Cálculo de Dose Veterinária"
                  toolName="Calculadora de Dose Veterinária"
                />
              </div>

              {/* Legal Disclaimer */}
              <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground text-center">
                  Esta análise é educativa e não substitui consulta veterinária presencial.
                  <br />
                  Relatório gerado via VetAgro Sustentável AI © 2025
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CalculadoraDose;
