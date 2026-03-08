import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Loader2, Shield, Stethoscope, ClipboardList, AlertTriangle } from "lucide-react";
import { ResponseActionButtons } from "@/components/ResponseActionButtons";
import { useToast } from "@/hooks/use-toast";
import { UFS, useCrmvValidation, SPECIES_OPTIONS } from "@/hooks/useCrmvValidation";
import { invokeEdgeFunction } from "@/lib/edgeInvoke";

// Simple cleaning for prescription - preserve line breaks
const cleanPrescriptionText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s*/g, '')
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .trim();
};
const Receituario = () => {
  const { toast } = useToast();
  const { validateAndNotify } = useCrmvValidation();
  const [loading, setLoading] = useState(false);
  
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

  const handleUseExample = () => {
    setVetName("Dr(a). Maria Silva");
    setCrmv("12345");
    setUf("RR");
    setOwnerName("João da Silva");
    setOwnerPhone("(95) 99999-0000");
    setOwnerAddress("Boa Vista - RR");
    setAnimalName("Rex");
    setAnimalSpecies("Canino");
    setAnimalBreed("SRD");
    setAnimalAge("5 anos");
    setAnimalSex("Macho");
    setAnimalWeight("12");
    setPrescription("Amoxicilina + Clavulanato para tratamento de infecção cutânea bacteriana. Via oral, 10 dias de tratamento.");
    
    toast({
      title: "Exemplo carregado",
      description: "Dados de exemplo preenchidos. Você pode editar antes de gerar.",
    });
  };

  const handleGenerate = async () => {
    if (loading) return;

    const validation = validateAndNotify(true, crmv, uf);
    if (!validation.isValid) return;

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
      const res = await invokeEdgeFunction<{ answer: string }>("vet-clinical-handler", {
        tool: "receituario",
        
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
          prescription,
        },
      });

      if (!res.ok) {
        toast({
          title: "Atenção",
          description: (res.error as any)?.friendlyError || "Ocorreu um problema temporário. Por favor, tente novamente.",
          variant: "destructive",
        });
        return;
      }

      if (!res.data?.answer) {
        toast({
          title: "Resposta vazia",
          description: "O servidor não retornou dados. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      const cleanedResult = cleanPrescriptionText(res.data.answer);
      setResult(cleanedResult);
      
      toast({
        title: "Receituário gerado",
        description: "Documento pronto para cópia ou compartilhamento.",
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Atenção",
        description: "Ocorreu um problema temporário. Por favor, tente novamente.",
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
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shadow-lg">
            <FileText className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Receituário Veterinário</h1>
            <p className="text-muted-foreground">Documento técnico-profissional padronizado</p>
          </div>
        </div>

        {/* Bloco Conceitual */}
        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 mb-6">
          <CardContent className="pt-6">
            <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed mb-4">
              Gere receituários veterinários profissionais, padronizados conforme a legislação brasileira vigente. 
              O documento gerado está pronto para impressão ou envio digital, necessitando apenas da assinatura do médico veterinário responsável.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                <Shield className="h-4 w-4" />
                <span>Lei 5.517/1968</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                <Stethoscope className="h-4 w-4" />
                <span>CRMV Obrigatório</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                <ClipboardList className="h-4 w-4" />
                <span>Formato Oficial</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                <FileText className="h-4 w-4" />
                <span>Pronto para Uso</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão de Exemplo */}
        <Button
          variant="outline"
          onClick={handleUseExample}
          className="mb-6 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-950"
        >
          <ClipboardList className="mr-2 h-4 w-4" />
          Usar exemplo de receituário (Roraima)
        </Button>
      </div>

      <div className="grid gap-6 max-w-3xl">
        {/* Veterinarian Data - MANDATORY */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-primary flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Dados do Médico Veterinário
            </CardTitle>
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
            <CardTitle>Dados do Proprietário / Responsável</CardTitle>
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
              Medicamentos e tratamento (apenas dados objetivos)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="prescription">Prescrição *</Label>
              <Textarea
                id="prescription"
                placeholder="Ex: Amoxicilina 500mg, via oral, a cada 12 horas, por 7 dias..."
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Informe: medicamento, dose, via de administração, frequência e duração.
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
              <FileText className="mr-2 h-5 w-5" />
              Gerar Receituário
            </>
          )}
        </Button>

        {/* Resultado - Documento Oficial */}
        {result && (
          <Card className="border-2 border-green-300 dark:border-green-700">
            <CardHeader className="bg-green-50 dark:bg-green-950/30 border-b border-green-200 dark:border-green-800">
              <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Receituário Veterinário
              </CardTitle>
              <CardDescription>
                Documento pronto para uso — revise antes de assinar
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Documento com aparência oficial */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800 dark:text-gray-200 leading-relaxed">
                  {result}
                </pre>
              </div>

              {/* Botões Padrão - Copiar e Compartilhar */}
              <div className="pt-6 border-t border-green-200 dark:border-green-800 mt-6">
                <ResponseActionButtons
                  content={result}
                  title="Receituário Veterinário"
                  toolName="Receituário Veterinário"
                />
              </div>

              {/* Aviso Legal */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                      AVISO LEGAL
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Este documento foi gerado por inteligência artificial para fins de apoio profissional. 
                      A validade legal depende da assinatura e responsabilidade do médico veterinário, 
                      conforme a Lei nº 5.517/1968 e resoluções do CFMV.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Receituario;
