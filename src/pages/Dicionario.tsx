import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Loader2, User, Stethoscope, Search, BookMarked, FlaskConical, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MarkdownTableRenderer } from "@/components/MarkdownTableRenderer";
import { ResponseActionButtons } from "@/components/ResponseActionButtons";
import { useCrmvValidation, UFS } from "@/hooks/useCrmvValidation";
import { cleanTextForDisplay } from "@/lib/textUtils";

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

  const handleExampleFill = () => {
    setMedication("Meloxicam");
    setCategory("aines");
    setObjective("completa");
    toast({
      title: "Exemplo carregado",
      description: "Dados de exemplo preenchidos. Clique em Consultar.",
    });
  };

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

      const prompt = `DICIONÁRIO VETERINÁRIO — VetAgro Sustentável AI

Você é o Dicionário Veterinário VetAgro AI, uma ferramenta de consulta técnica rápida e confiável para médicos veterinários, estudantes e profissionais da área.

TERMO/FÁRMACO CONSULTADO: ${medication}
${category ? `CATEGORIA: ${categoryLabel}` : ""}
OBJETIVO: ${objectiveLabel}
${isProfessional ? `PROFISSIONAL: ${professionalName} — CRMV ${crmv}/${uf}` : "USUÁRIO: Estudante ou profissional não identificado"}

ESTRUTURA OBRIGATÓRIA DA RESPOSTA (seguir rigorosamente):

1. TERMO TÉCNICO:
Nome completo do termo ou fármaco consultado. Se for medicamento, incluir nome comercial principal.

2. DEFINIÇÃO TÉCNICA:
Definição objetiva, precisa e profissional do termo. Para fármacos: classe farmacológica, mecanismo de ação resumido, apresentações disponíveis.

3. APLICAÇÃO NA MEDICINA VETERINÁRIA:
Onde e como o termo/fármaco é usado na prática clínica, zootécnica ou sanitária. Para fármacos: indicações por espécie (cães, gatos, equinos, ruminantes), posologia resumida, vias de administração.

4. OBSERVAÇÕES TÉCNICAS IMPORTANTES:
Pontos de atenção, confusões comuns, limitações do conceito. Para fármacos: contraindicações principais, efeitos adversos relevantes, interações medicamentosas importantes.

5. SINÔNIMOS OU TERMOS RELACIONADOS:
Lista de termos relacionados, nomes comerciais alternativos, ou conceitos associados.

6. REFERÊNCIAS TÉCNICAS:
Citar apenas fontes reconhecidas em formato de lista:
– Papich MG — Saunders Handbook of Veterinary Drugs
– Plumb DC — Plumb's Veterinary Drug Handbook
– Merck Veterinary Manual
– Manuais EMBRAPA
– FAO / OIE / MAPA (quando pertinente)

REGRAS OBRIGATÓRIAS:
– Linguagem técnica, clara e direta
– Sem tom didático infantilizado
– Sem asteriscos, hashtags ou emojis
– Use apenas bullets padrão: –, •
– Formate títulos como "TÍTULO:" em maiúsculas
– Jamais inventar informações — se não houver dados confiáveis, informar claramente
– Resposta estruturada e organizada, fácil de consultar rapidamente`;

      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          question: prompt,
          isProfessional: isProfessional,
          context: "Dicionário Veterinário",
          tool: "dicionario-veterinario"
        },
      });

      if (error) throw error;

      const cleanedResult = cleanTextForDisplay(data.answer);
      setResult(cleanedResult);
      toast({
        title: "Consulta realizada",
        description: "Informações encontradas com sucesso.",
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Institucional */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-lg">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dicionário Veterinário</h1>
            <p className="text-muted-foreground">Consulta técnica rápida de termos, fármacos e conceitos</p>
          </div>
        </div>

        {/* Bloco Conceitual */}
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-6">
            <p className="text-foreground leading-relaxed mb-4">
              Ferramenta de referência técnica para consulta rápida de termos veterinários, fármacos, conceitos clínicos e zootécnicos. Baseada em literatura científica reconhecida e manuais de referência.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookMarked className="h-4 w-4 text-emerald-600" />
                <span>Termos técnicos</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FlaskConical className="h-4 w-4 text-emerald-600" />
                <span>Farmacologia</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Search className="h-4 w-4 text-emerald-600" />
                <span>Consulta rápida</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-emerald-600" />
                <span>Alertas clínicos</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Botão de Exemplo */}
        <div className="flex justify-start">
          <Button
            variant="outline"
            onClick={handleExampleFill}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Usar exemplo: Meloxicam (AINE)
          </Button>
        </div>

        {/* Professional Identification Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-emerald-600" />
              Identificação Profissional
            </CardTitle>
            <CardDescription>
              Opcional — recomendado para respostas personalizadas
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
                  <Label htmlFor="professionalName">Nome Completo</Label>
                  <Input
                    id="professionalName"
                    placeholder="Dr(a). Nome Sobrenome"
                    value={professionalName}
                    onChange={(e) => setProfessionalName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="crmv">CRMV</Label>
                  <Input
                    id="crmv"
                    placeholder="00000"
                    value={crmv}
                    onChange={(e) => setCrmv(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                </div>
                <div>
                  <Label htmlFor="uf">Estado (UF)</Label>
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
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5 text-emerald-600" />
              Parâmetros de Busca
            </CardTitle>
            <CardDescription>
              Configure a busca para obter informações precisas
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
              <Label htmlFor="medication">Termo ou Fármaco Consultado *</Label>
              <Input
                id="medication"
                placeholder="Digite medicamento, princípio ativo, termo técnico..."
                value={medication}
                onChange={(e) => setMedication(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleSearch()}
                className="text-base"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Aceita: nomes comerciais, princípios ativos, termos clínicos, siglas
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
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Consultando base de dados...
            </>
          ) : (
            <>
              <Search className="mr-2 h-5 w-5" />
              Consultar Termo
            </>
          )}
        </Button>

        {/* Result Card */}
        {result && (
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <BookOpen className="h-5 w-5" />
                Resultado da Consulta — {medication}
              </CardTitle>
              <CardDescription>
                Informações técnicas baseadas em referências científicas
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Result Display */}
              <div className="prose prose-sm max-w-none">
                <MarkdownTableRenderer 
                  content={result}
                  className="bg-muted/30 p-6 rounded-lg text-sm leading-relaxed border"
                />
              </div>

              {/* Action Buttons */}
              <ResponseActionButtons
                content={result}
                title={`Dicionário Veterinário — ${medication}`}
                toolName="Dicionário Veterinário"
                className="mt-6 pt-4 border-t"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dicionario;
