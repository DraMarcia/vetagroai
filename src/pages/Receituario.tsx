import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pill, Loader2 } from "lucide-react";
import { ResponseActionButtons } from "@/components/ResponseActionButtons";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UFS, useCrmvValidation, SPECIES_OPTIONS } from "@/hooks/useCrmvValidation";
import { exportToPDF, exportToDocx } from "@/lib/reportExport";
import { cleanTextForDisplay } from "@/lib/textUtils";

const Receituario = () => {
  const { toast } = useToast();
  const { validateAndNotify } = useCrmvValidation();
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);
  
  // Veterinarian data
  const [vetName, setVetName] = useState("");
  const [crmv, setCrmv] = useState("");
  const [uf, setUf] = useState("");
  
  // Owner data
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  
  // Animal data
  const [animalName, setAnimalName] = useState("");
  const [animalSpecies, setAnimalSpecies] = useState("");
  const [animalBreed, setAnimalBreed] = useState("");
  const [animalAge, setAnimalAge] = useState("");
  const [animalSex, setAnimalSex] = useState("");
  const [animalWeight, setAnimalWeight] = useState("");
  
  // Prescription
  const [prescription, setPrescription] = useState("");
  const [result, setResult] = useState("");

  const handleCopyResult = async () => {
    try {
      await navigator.clipboard.writeText(result);
      toast({
        title: "Copiado!",
        description: "Receituário copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto.",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
    if (!result) return;
    setExportingPdf(true);
    try {
      await exportToPDF({
        title: "Receituário Veterinário",
        content: result,
        toolName: "Receituário Veterinário — VetAgro Sustentável AI",
        references: receituarioReferences,
        userInputs: {
          "Médico Veterinário": vetName,
          "CRMV": `${crmv}-${uf}`,
          "Proprietário": ownerName || "Não informado",
          "Paciente": animalName,
          "Espécie": animalSpecies,
          "Raça": animalBreed || "Não informado",
          "Idade": animalAge || "Não informado",
          "Sexo": animalSex || "Não informado",
          "Peso": animalWeight ? `${animalWeight} kg` : "Não informado"
        }
      });
      toast({
        title: "PDF gerado!",
        description: "O receituário foi salvo em PDF.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar PDF",
        description: "PDF temporariamente indisponível — utilize Copiar Relatório.",
        variant: "destructive",
      });
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportDocx = async () => {
    if (!result) return;
    setExportingDocx(true);
    try {
      await exportToDocx({
        title: "Receituário Veterinário",
        content: result,
        toolName: "Receituário Veterinário — VetAgro Sustentável AI",
        references: receituarioReferences,
        userInputs: {
          "Médico Veterinário": vetName,
          "CRMV": `${crmv}-${uf}`,
          "Proprietário": ownerName || "Não informado",
          "Paciente": animalName,
          "Espécie": animalSpecies,
          "Raça": animalBreed || "Não informado",
          "Idade": animalAge || "Não informado",
          "Sexo": animalSex || "Não informado",
          "Peso": animalWeight ? `${animalWeight} kg` : "Não informado"
        }
      });
      toast({
        title: "DOCX gerado!",
        description: "O receituário foi salvo em Word.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar DOCX",
        description: "DOCX temporariamente indisponível — utilize Copiar Relatório.",
        variant: "destructive",
      });
    } finally {
      setExportingDocx(false);
    }
  };

  const handleGenerate = async () => {
    // Prevent double-click
    if (loading) return;

    // Validate veterinarian fields - MANDATORY
    const validation = validateAndNotify(true, crmv, uf);
    if (!validation.isValid) {
      return;
    }

    if (!vetName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome completo do médico veterinário.",
        variant: "destructive",
      });
      return;
    }

    if (!animalName || !animalSpecies || !prescription) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome do animal, espécie e prescrição.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          tool: "receituario",
          isProfessional: true,
          data: {
            vetName,
            crmv: `${crmv}-${uf}`,
            ownerName: ownerName || "Não informado",
            ownerPhone: ownerPhone || "Não informado",
            ownerAddress: ownerAddress || "Não informado",
            animalName,
            animalSpecies,
            animalBreed: animalBreed || "SRD",
            animalAge: animalAge || "Não informado",
            animalSex: animalSex || "Não informado",
            animalWeight: animalWeight || "Não informado",
            prescription
          }
        },
      });

      if (error) throw error;

      if (!data?.answer) {
        throw new Error("Resposta vazia do servidor");
      }

      // Clean the result
      const cleanedResult = cleanTextForDisplay(data.answer);
      setResult(cleanedResult);
      
      toast({
        title: "Receituário gerado!",
        description: "O receituário está pronto para download.",
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro ao gerar receituário",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const receituarioReferences = [
    "Papich MG - Saunders Handbook of Veterinary Drugs",
    "Merck Veterinary Manual",
    "CFMV - Conselho Federal de Medicina Veterinária",
    "MAPA - Ministério da Agricultura, Pecuária e Abastecimento",
    "Lei 5.517/1968 - Regulamentação da Profissão de Médico Veterinário"
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Pill className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerador de Receituário Veterinário</h1>
            <p className="text-muted-foreground">Emita prescrições padronizadas conforme legislação vigente</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl">
        {/* Veterinarian Data - MANDATORY */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-primary">Dados do Médico Veterinário</CardTitle>
            <CardDescription>
              Campos obrigatórios para emissão do receituário
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div>
              <Label htmlFor="vetName">Nome Completo *</Label>
              <Input
                id="vetName"
                placeholder="Dr(a). Nome Completo"
                value={vetName}
                onChange={(e) => setVetName(e.target.value)}
                className="border-primary/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="crmv">Número do CRMV *</Label>
                <Input
                  id="crmv"
                  placeholder="Ex: 12345"
                  value={crmv}
                  onChange={(e) => setCrmv(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="border-primary/30"
                />
              </div>
              <div>
                <Label htmlFor="uf">Estado (UF) *</Label>
                <Select value={uf} onValueChange={setUf}>
                  <SelectTrigger className="border-primary/30">
                    <SelectValue placeholder="Selecione UF" />
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
          </CardContent>
        </Card>

        {/* Owner Data */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Proprietário</CardTitle>
            <CardDescription>
              Informações do responsável pelo animal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ownerName">Nome do Proprietário</Label>
              <Input
                id="ownerName"
                placeholder="Nome completo do responsável"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ownerPhone">Telefone</Label>
                <Input
                  id="ownerPhone"
                  placeholder="(00) 00000-0000"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ownerAddress">Endereço</Label>
                <Input
                  id="ownerAddress"
                  placeholder="Cidade - UF"
                  value={ownerAddress}
                  onChange={(e) => setOwnerAddress(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Animal Data */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Paciente</CardTitle>
            <CardDescription>
              Informações do animal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="animalName">Nome do Animal *</Label>
                <Input
                  id="animalName"
                  placeholder="Nome do animal"
                  value={animalName}
                  onChange={(e) => setAnimalName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="animalSpecies">Espécie *</Label>
                <Select value={animalSpecies} onValueChange={setAnimalSpecies}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione espécie" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIES_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.label}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="animalBreed">Raça</Label>
                <Input
                  id="animalBreed"
                  placeholder="Ex: Poodle, SRD"
                  value={animalBreed}
                  onChange={(e) => setAnimalBreed(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="animalAge">Idade</Label>
                <Input
                  id="animalAge"
                  placeholder="Ex: 5 anos"
                  value={animalAge}
                  onChange={(e) => setAnimalAge(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="animalSex">Sexo</Label>
                <Select value={animalSex} onValueChange={setAnimalSex}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Macho">Macho</SelectItem>
                    <SelectItem value="Fêmea">Fêmea</SelectItem>
                    <SelectItem value="Macho castrado">Macho castrado</SelectItem>
                    <SelectItem value="Fêmea castrada">Fêmea castrada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="animalWeight">Peso (kg)</Label>
              <Input
                id="animalWeight"
                placeholder="Ex: 8.5"
                value={animalWeight}
                onChange={(e) => setAnimalWeight(e.target.value)}
                type="number"
                step="0.1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Prescription */}
        <Card>
          <CardHeader>
            <CardTitle>Prescrição</CardTitle>
            <CardDescription>
              Medicamentos e orientações de tratamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="prescription">Prescrição *</Label>
              <Textarea
                id="prescription"
                placeholder="Ex: Cefalexina 500mg para infecção cutânea..."
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Informe medicamento, indicação, dose desejada e observações relevantes.
              </p>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleGenerate}
          disabled={loading}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Gerando Receituário...
            </>
          ) : (
            <>
              <Pill className="mr-2 h-5 w-5" />
              Gerar Receituário
            </>
          )}
        </Button>

        {result && (
          <Card className="border-2 border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-800">Receituário Gerado</CardTitle>
              <CardDescription>
                Revise o receituário antes de baixar ou imprimir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm font-mono">
                  {result}
                </div>
              </div>

              {/* Action Buttons - Padrão Global */}
              <div className="pt-4 border-t">
                <ResponseActionButtons
                  content={result}
                  title="Receituário Veterinário"
                  toolName="Gerador de Receituário Veterinário"
                />
              </div>

              {/* Legal disclaimer */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-4">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>⚠ AVISO LEGAL:</strong> Este documento foi gerado por inteligência artificial para fins de apoio. 
                  A validade oficial depende da assinatura do médico veterinário responsável, conforme legislação profissional 
                  vigente (Lei 5.517/1968 e Resoluções CFMV).
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Receituario;