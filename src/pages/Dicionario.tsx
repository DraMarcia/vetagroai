import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Loader2, Copy, Check, User, Stethoscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ReportExporter } from "@/components/ReportExporter";
import { useCrmvValidation, UFS } from "@/hooks/useCrmvValidation";

// Pharmacological categories
const PHARMACOLOGICAL_CATEGORIES = [
  { value: "aines", label: "Anti-inflamatórios não esteroidais (AINEs)" },
  { value: "corticosteroides", label: "Corticosteroides" },
  { value: "antibioticos", label: "Antibióticos" },
  { value: "antivirais", label: "Antivirais" },
  { value: "antifungicos", label: "Antifúngicos" },
  { value: "antiparasitarios", label: "Antiparasitários" },
  { value: "antitermicos", label: "Antitérmicos" },
  { value: "antihistaminicos", label: "Antialérgicos / Anti-histamínicos" },
  { value: "analgesicos", label: "Analgésicos opioides e não opioides" },
  { value: "hemostaticos", label: "Hemostáticos / Anti-hemorrágicos" },
  { value: "anestesicos", label: "Anestésicos" },
  { value: "relaxantes", label: "Relaxantes musculares" },
  { value: "sedativos", label: "Sedativos / Tranquilizantes" },
  { value: "antiemeticos", label: "Antieméticos" },
  { value: "gastroprotetores", label: "Gastroprotetores" },
  { value: "cardiologicos", label: "Cardiológicos" },
  { value: "endocrinologicos", label: "Endocrinológicos" },
  { value: "oftalmicos", label: "Oftálmicos" },
  { value: "otologicos", label: "Otológicos" },
  { value: "dermatologicos", label: "Tópicos dermatológicos" },
  { value: "suplementos", label: "Vitaminas / Suplementos" },
  { value: "outros", label: "Outros" },
];

// Consultation objectives
const CONSULTATION_OBJECTIVES = [
  { value: "entender", label: "Entender o medicamento" },
  { value: "posologia", label: "Ver posologia" },
  { value: "comparar", label: "Comparar com outro fármaco" },
  { value: "caes", label: "Saber se pode usar em cães" },
  { value: "gatos", label: "Saber se pode usar em gatos" },
  { value: "equinos", label: "Saber se pode usar em equinos" },
  { value: "plantao", label: "Revisão rápida para plantão" },
  { value: "completa", label: "Análise completa (modo avançado)" },
];

const Dicionario = () => {
  const { toast } = useToast();
  const { validateAndNotify } = useCrmvValidation();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Professional identification
  const [isProfessional, setIsProfessional] = useState(false);
  const [professionalName, setProfessionalName] = useState("");
  const [crmv, setCrmv] = useState("");
  const [uf, setUf] = useState("");
  
  // Search fields
  const [category, setCategory] = useState("");
  const [medication, setMedication] = useState("");
  const [objective, setObjective] = useState("completa");
  
  // Result
  const [result, setResult] = useState("");

  const handleSearch = async () => {
    // Validate medication field
    if (!medication.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite o nome do medicamento, princípio ativo ou nome comercial.",
        variant: "destructive",
      });
      return;
    }

    // Validate CRMV if professional
    if (isProfessional) {
      const validation = validateAndNotify(isProfessional, crmv, uf);
      if (!validation.isValid) return;
    }

    if (loading) return;
    setLoading(true);

    try {
      const categoryLabel = PHARMACOLOGICAL_CATEGORIES.find(c => c.value === category)?.label || "";
      const objectiveLabel = CONSULTATION_OBJECTIVES.find(o => o.value === objective)?.label || "Análise completa";

      const prompt = `DICIONÁRIO FARMACOLÓGICO VETERINÁRIO — VetAgro Sustentável AI

Você é o Dicionário Farmacológico VetAgro AI, uma ferramenta avançada de consulta para médicos veterinários, estudantes e profissionais da área.

FÁRMACO/TERMO BUSCADO: ${medication}
${category ? `CATEGORIA FARMACOLÓGICA: ${categoryLabel}` : ""}
OBJETIVO DA CONSULTA: ${objectiveLabel}
${isProfessional ? `PROFISSIONAL: ${professionalName} — CRMV ${crmv}/${uf}` : "USUÁRIO: Estudante ou profissional não identificado"}

FORNEÇA INFORMAÇÕES COMPLETAS, TÉCNICAS E ORGANIZADAS SEGUINDO ESTA ESTRUTURA:

1. NOME COMERCIAL E SINÔNIMOS
Liste os principais nomes comerciais disponíveis no Brasil e sinônimos conhecidos.

2. PRINCÍPIO ATIVO
Identificação química e farmacológica do princípio ativo.

3. CLASSE FARMACOLÓGICA
Classificação terapêutica detalhada.

4. MECANISMO DE AÇÃO
Explicação resumida e técnica do mecanismo de ação.

5. CONCENTRAÇÕES DISPONÍVEIS
Liste as apresentações e concentrações mais comuns no mercado brasileiro.

6. INDICAÇÕES POR ESPÉCIE
• Cães: indicações específicas
• Gatos: indicações específicas (alertas de toxicidade se aplicável)
• Equinos: indicações específicas
• Ruminantes: quando aplicável
• Aves: quando aplicável
• Animais silvestres: se houver literatura

7. POSOLOGIA DETALHADA
Para cada espécie, forneça:
• Dose (mg/kg)
• Intervalo de administração
• Duração do tratamento
• Via de administração
• Formulações recomendadas

8. CONTRAINDICAÇÕES
Liste todas as contraindicações conhecidas por espécie.

9. INTERAÇÕES MEDICAMENTOSAS
Descreva interações importantes e potencialmente perigosas.

10. EFEITOS ADVERSOS
Liste os efeitos colaterais mais comuns e raros por espécie.

11. CUIDADOS ESPECIAIS E PRECAUÇÕES
Alertas para gestantes, neonatos, geriátricos, hepatopatas, nefropatas.

12. FÁRMACOS SEMELHANTES PARA COMPARAÇÃO
Liste alternativas terapêuticas e compare brevemente.

13. ORIENTAÇÕES DE SEGURANÇA AO TUTOR
Instruções que o veterinário pode repassar ao tutor.

14. REFERÊNCIAS BIBLIOGRÁFICAS
Use exclusivamente:
• Papich MG — Saunders Handbook of Veterinary Drugs
• Plumb DC — Plumb's Veterinary Drug Handbook
• Merck Veterinary Manual
• Bulas MAPA/SINDAN
• AAHA, AAFP, ISFM Guidelines
• Publicações científicas indexadas

REGRAS OBRIGATÓRIAS:
• Jamais inventar informações
• Se não houver dados confiáveis → "Informação não disponível em fontes confiáveis até o momento"
• Resposta técnica, completa, organizada
• Sem asteriscos, hashtags ou emojis
• Use apenas bullets padrão: •, –, →
• Formate títulos como "TÍTULO:" sem markdown`;

      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          question: prompt,
          isProfessional: isProfessional,
          context: "Dicionário Farmacológico Veterinário",
          tool: "dicionario-farmacologico"
        },
      });

      if (error) throw error;

      setResult(data.answer);
      toast({
        title: "Consulta realizada!",
        description: "Informações farmacológicas encontradas com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro ao consultar",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      toast({
        title: "Copiado!",
        description: "Conteúdo copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto.",
        variant: "destructive",
      });
    }
  };

  const dicionarioReferences = [
    "Papich MG — Saunders Handbook of Veterinary Drugs",
    "Plumb DC — Plumb's Veterinary Drug Handbook",
    "Merck Veterinary Manual",
    "MAPA/SINDAN — Compêndio de Produtos Veterinários",
    "AAHA, AAFP, ISFM Guidelines",
    "PubMed — National Library of Medicine"
  ];

  const userInputs: Record<string, string> = {
    "Medicamento/Termo": medication,
  };
  
  if (category) {
    userInputs["Categoria"] = PHARMACOLOGICAL_CATEGORIES.find(c => c.value === category)?.label || "";
  }
  if (objective) {
    userInputs["Objetivo"] = CONSULTATION_OBJECTIVES.find(o => o.value === objective)?.label || "";
  }
  if (isProfessional && professionalName) {
    userInputs["Profissional"] = `${professionalName} — CRMV ${crmv}/${uf}`;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dicionário Farmacológico Veterinário</h1>
            <p className="text-muted-foreground">Consulta completa de fármacos, posologia, indicações e alertas</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Professional Identification Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Identificação Profissional
            </CardTitle>
            <CardDescription>
              Opcional, mas recomendado para respostas personalizadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isProfessional"
                checked={isProfessional}
                onCheckedChange={(checked) => setIsProfessional(checked as boolean)}
              />
              <label
                htmlFor="isProfessional"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
              >
                <Stethoscope className="h-4 w-4" />
                Sou Médico(a) Veterinário(a)
              </label>
            </div>

            {isProfessional && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
                <div>
                  <Label htmlFor="professionalName">Nome Completo *</Label>
                  <Input
                    id="professionalName"
                    placeholder="Dr(a). Nome Sobrenome"
                    value={professionalName}
                    onChange={(e) => setProfessionalName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="crmv">CRMV *</Label>
                  <Input
                    id="crmv"
                    placeholder="00000"
                    value={crmv}
                    onChange={(e) => setCrmv(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                </div>
                <div>
                  <Label htmlFor="uf">Estado (UF) *</Label>
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
            )}
          </CardContent>
        </Card>

        {/* Search Parameters Card */}
        <Card>
          <CardHeader>
            <CardTitle>Parâmetros de Busca</CardTitle>
            <CardDescription>
              Configure a busca para obter informações mais precisas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category Selection */}
            <div>
              <Label htmlFor="category">Categoria Farmacológica (opcional)</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria..." />
                </SelectTrigger>
                <SelectContent>
                  {PHARMACOLOGICAL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Medication Name */}
            <div>
              <Label htmlFor="medication">Nome do Fármaco ou Termo Buscado *</Label>
              <Input
                id="medication"
                placeholder="Digite medicamento, princípio ativo, nome comercial ou sigla..."
                value={medication}
                onChange={(e) => setMedication(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSearch()}
                className="text-base"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Aceita: nomes comerciais, princípios ativos, classes, siglas ou nomes populares
              </p>
            </div>

            {/* Objective Selection */}
            <div>
              <Label htmlFor="objective">Objetivo da Consulta</Label>
              <Select value={objective} onValueChange={setObjective}>
                <SelectTrigger>
                  <SelectValue placeholder="Análise completa (modo avançado)" />
                </SelectTrigger>
                <SelectContent>
                  {CONSULTATION_OBJECTIVES.map((obj) => (
                    <SelectItem key={obj.value} value={obj.value}>
                      {obj.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          disabled={loading}
          size="lg"
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Consultando base farmacológica...
            </>
          ) : (
            <>
              <BookOpen className="mr-2 h-5 w-5" />
              Consultar Fármaco
            </>
          )}
        </Button>

        {/* Result Card */}
        {result && (
          <Card className="border-green-200">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <BookOpen className="h-5 w-5" />
                Informações Farmacológicas — {medication}
              </CardTitle>
              <CardDescription>
                Dados técnicos baseados em referências científicas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Result Display */}
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap bg-muted/50 p-4 rounded-lg text-sm leading-relaxed border">
                  {result}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="flex-1 min-w-[200px]"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-green-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar Relatório (Recomendado)
                    </>
                  )}
                </Button>
                
                <ReportExporter
                  title={`Dicionário Farmacológico — ${medication}`}
                  content={result}
                  toolName="Dicionário Farmacológico Veterinário — VetAgro Sustentável AI"
                  references={dicionarioReferences}
                  userInputs={userInputs}
                  className="flex-1 min-w-[200px]"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dicionario;
