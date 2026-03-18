import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Leaf, Loader2, Upload, X, ImageIcon, User, AlertTriangle, MapPin, Microscope, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { resilientInvoke, extractAnswer } from "@/lib/resilientInvoke";
import { fileToCompressedDataUrl } from "@/lib/imageDataUrl";
import { UFS } from "@/hooks/useCrmvValidation";
import { MarkdownTableRenderer } from "@/components/MarkdownTableRenderer";
import { ResponseActionButtons } from "@/components/ResponseActionButtons";
import { cleanTextForDisplay } from "@/lib/textUtils";
import { supabase } from "@/integrations/supabase/client";
import { AuthDialog } from "@/components/AuthDialog";

const COUNCIL_TYPES = [
  { value: "CREA", label: "CREA - Engenharia e Agronomia" },
  { value: "CRBio", label: "CRBio - Biologia" },
  { value: "CFTA", label: "CFTA - Técnicos Agrícolas" },
  { value: "CRMV", label: "CRMV - Medicina Veterinária" },
  { value: "Outro", label: "Outro" },
];

const MAX_IMAGES = 5;

const IdentificadorPlantas = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isProfessional, setIsProfessional] = useState<string>("");
  const [councilType, setCouncilType] = useState("");
  const [councilNumber, setCouncilNumber] = useState("");
  const [councilUF, setCouncilUF] = useState("");
  const [description, setDescription] = useState("");
  const [sintomas, setSintomas] = useState("");
  const [regiao, setRegiao] = useState("");
  const [estado, setEstado] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [result, setResult] = useState("");
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleExampleFill = () => {
    setDescription("Planta de mandioca (Manihot esculenta) em lavoura familiar no Amapá.");
    setSintomas("Brotações finas e excessivas nos ramos superiores, aspecto de vassoura. Folhas amarelando e secando da ponta para a base. Redução de entrenós e nanismo em parte das plantas. Observado em cerca de 30% da lavoura nos últimos 15 dias.");
    setRegiao("Macapá");
    setEstado("AP");
    toast({
      title: "Exemplo carregado",
      description: "Dados de exemplo preenchidos com caso suspeito de vassoura-de-bruxa.",
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > MAX_IMAGES) {
      toast({ title: "Limite de imagens", description: `Máximo de ${MAX_IMAGES} imagens.`, variant: "destructive" });
      return;
    }

    const newImages: string[] = [];
    let skipped = 0;

    for (let i = 0; i < files.length && images.length + newImages.length < MAX_IMAGES; i++) {
      try {
        const { dataUrl } = await fileToCompressedDataUrl(files[i], {
          maxDimension: 1600,
          quality: 0.85,
          mimeType: "image/jpeg",
        });
        newImages.push(dataUrl);
      } catch {
        skipped++;
      }
    }

    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages]);
      toast({ title: "Imagens carregadas", description: `${newImages.length} imagem(ns) adicionada(s).` });
    } else if (skipped > 0) {
      toast({ title: "Erro ao processar imagem", description: "Tente com outra imagem.", variant: "destructive" });
    }
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleIdentify = async () => {
    console.log("[IdentificadorPlantas] handleIdentify TRIGGERED");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: "Faça login para continuar", description: "Entre ou crie uma conta para utilizar a ferramenta.", variant: "destructive" });
      setShowAuthDialog(true);
      return;
    }

    if (!isProfessional) {
      toast({ title: "Campo obrigatório", description: "Informe se você é profissional da área.", variant: "destructive" });
      return;
    }

    if (isProfessional === "sim" && (!councilType || !councilNumber.trim() || !councilUF)) {
      toast({ title: "Campos obrigatórios", description: "Informe o tipo de conselho, número e UF.", variant: "destructive" });
      return;
    }

    if (images.length === 0 && !description.trim() && !sintomas.trim()) {
      toast({ title: "Dados insuficientes", description: "Envie pelo menos uma imagem ou descreva a planta/sintomas.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const prompt = buildPrompt();

      const res = await resilientInvoke("plant-handler", {
        tool: "identificador-plantas",
        question: prompt,
        images: images.length > 0 ? images : undefined,
        description: description || "Sem descrição adicional",
        sintomas: sintomas || undefined,
        regiao: regiao || undefined,
        estado: estado || undefined,
        isProfessional: isProfessional === "sim",
        councilType: isProfessional === "sim" ? councilType : undefined,
        councilNumber: isProfessional === "sim" ? councilNumber : undefined,
        councilUF: isProfessional === "sim" ? councilUF : undefined,
      }, { hasImages: images.length > 0 });

      if (!res.ok) {
        toast({ title: "Atenção", description: res.friendlyError || "Tente novamente.", variant: "destructive" });
        return;
      }

      const answer = extractAnswer(res.data);
      if (!answer) {
        toast({ title: "Resposta vazia", description: "O servidor não retornou dados. Tente novamente.", variant: "destructive" });
        return;
      }

      setResult(cleanTextForDisplay(answer));
      toast({ title: "Análise concluída", description: "Relatório fitossanitário gerado com sucesso." });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({ title: "Atenção", description: "Ocorreu um problema temporário. Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const buildPrompt = () => {
    const locationInfo = regiao || estado
      ? `LOCALIZAÇÃO: ${regiao || "Não informada"}, ${estado || "UF não informado"}`
      : "LOCALIZAÇÃO: Não informada";

    return `IDENTIFICADOR DE PLANTAS — DIAGNÓSTICO FITOTOXICOLÓGICO E FITOSSANITÁRIO INTEGRADO
VetAgro Sustentável AI

Você é o sistema integrado de identificação botânica e diagnóstico fitossanitário da VetAgro AI. Sua função é analisar plantas com foco em toxicidade animal, manejo de pastagens e avaliação fitossanitária completa com diagnósticos diferenciais.

DADOS DO CASO:
DESCRIÇÃO DA PLANTA: ${description || "Sem descrição — analisar apenas imagens"}
SINTOMAS OBSERVADOS: ${sintomas || "Nenhum sintoma adicional informado"}
${locationInfo}
NÚMERO DE IMAGENS: ${images.length}
${isProfessional === "sim" ? `PROFISSIONAL: ${councilType} ${councilNumber}/${councilUF}` : "USUÁRIO: Não profissional da área"}

ESTRUTURA OBRIGATÓRIA DO RELATÓRIO (seguir rigorosamente):

1. IDENTIFICAÇÃO DA PLANTA ANALISADA:
– Nome popular (quando possível identificar)
– Nome científico provável
– Família botânica
– Nível de confiança da identificação: ALTO / MODERADO / BAIXO

2. CARACTERÍSTICAS MORFOLÓGICAS OBSERVADAS:
– Folhas: formato, cor, textura, nervação
– Caule: tipo, cor, presença de pelos ou espinhos
– Flores: cor, formato, disposição (se visíveis)
– Frutos: tipo, cor, formato (se visíveis)
– Raízes: características (se informadas)

3. DIAGNÓSTICO PRINCIPAL:
– Descrever o problema mais provável identificado com base em:
  • Padrões visuais observados nas imagens
  • Sintomas descritos pelo usuário
  • Literatura agronômica e fitossanitária relevante
– Explicar o agente causal quando identificável
– Classificar gravidade: BAIXA / MODERADA / ALTA / CRÍTICA

4. DIAGNÓSTICOS DIFERENCIAIS (OBRIGATÓRIO — MÍNIMO 3, MÁXIMO 4):
Para cada hipótese diagnóstica, incluir:
– Nome da doença ou problema fitossanitário
– Agente causal (fungo, bactéria, vírus, deficiência nutricional, estresse abiótico, etc.)
– Sintomas característicos que justificam a hipótese
– Nível de probabilidade: ALTA / MODERADA / BAIXA
– Ordenar do mais provável ao menos provável

5. DETECÇÃO DE VASSOURA-DE-BRUXA DA MANDIOCA:
Se a planta for identificada como mandioca (Manihot esculenta) OU se os sintomas forem compatíveis:
– Verificar especificamente sinais de vassoura-de-bruxa (Ceratobasidium theobromae)
– Indicadores a considerar: brotações anormais e finas ("efeito vassoura"), redução de entrenós, deformação de ramos, proliferação de brotos, crescimento anormal da maniva, nanismo, seca apical, clorose e necrose
– Se compatível: emitir ALERTA DE SUSPEITA FITOSSANITÁRIA com destaque
– Referenciar: Embrapa, MAPA, CIRAD, CIAT, FAO
– Contextualizar risco para segurança alimentar regional (especialmente região amazônica)
– NUNCA confundir com vassoura-de-bruxa do cacau (Moniliophthora perniciosa)

6. IMPORTÂNCIA VETERINÁRIA (TOXICIDADE ANIMAL):
– Planta tóxica: SIM / NÃO / POTENCIALMENTE
– Espécies animais mais afetadas
– Princípio tóxico (se conhecido)
– Principais sinais clínicos em caso de intoxicação
– Dose tóxica aproximada (se disponível na literatura)

7. RECOMENDAÇÕES PARA PRODUTOR RURAL:
– Medidas imediatas a adotar
– Manejo preventivo da lavoura/pastagem
– Necessidade de isolamento da área afetada
– Quando buscar assistência técnica
– Medidas para evitar intoxicação animal
– Manejo fitossanitário integrado básico

8. RECOMENDAÇÕES PARA PROFISSIONAL TÉCNICO (Agrônomo / Extensionista):
– Procedimentos de diagnóstico confirmatório
– Protocolo de coleta de amostras para laboratório
– Encaminhamento a laboratório de referência
– Medidas de controle recomendadas (culturais, biológicas)
– Procedimentos de quarentena vegetal quando aplicável
– Notificação a órgãos de defesa sanitária vegetal (MAPA, agências estaduais)
– Evitar movimentação de material vegetal suspeito
– Higienizar ferramentas e equipamentos

9. NÍVEL DE CONFIANÇA DA ANÁLISE:
– Classificar: ALTO / MODERADO / BAIXO
– Justificar com base na qualidade dos dados fornecidos (imagens, descrição, localização)

10. AVISO TÉCNICO:
"A identificação por imagem e descrição é indicativa e não substitui avaliação botânica ou fitossanitária laboratorial especializada. Em casos de suspeita de intoxicação animal ou doença vegetal emergente, procure assistência técnica imediata e notifique os órgãos competentes de defesa agropecuária."

11. REFERÊNCIAS TÉCNICAS:
– EMBRAPA — Plantas Tóxicas do Brasil e notas técnicas fitossanitárias
– Tokarnia CH, Döbereiner J, Peixoto PV — Plantas Tóxicas do Brasil (2a ed.)
– MAPA — Programa Nacional de Prevenção e Controle de Pragas
– Instituições internacionais: CIRAD, CIAT, FAO (quando aplicável)
– Universidades brasileiras — herbários e estudos regionais

REGRAS OBRIGATÓRIAS:
– Linguagem técnica, clara e objetiva
– Sem asteriscos, hashtags ou emojis
– Use apenas bullets padrão: –, •, →
– Formate títulos como "TÍTULO:" em maiúsculas
– Se não for possível identificar com segurança, informar claramente
– Não inventar características não observáveis nas imagens ou descrição
– Não sugerir fungicidas ou defensivos específicos sem validação oficial
– SEMPRE gerar diagnósticos diferenciais mesmo com dados parciais`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <Leaf className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Identificador de Plantas (Toxicologia Vegetal)</h1>
            <p className="text-muted-foreground">Identificação botânica, diagnóstico fitossanitário e toxicidade animal</p>
          </div>
        </div>

        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="pt-6">
            <p className="text-foreground leading-relaxed mb-4">
              Sistema integrado de análise fitotoxicológica e fitossanitária. Identifica plantas, avalia toxicidade veterinária, diagnostica doenças vegetais com diagnósticos diferenciais e inclui detecção de vassoura-de-bruxa da mandioca.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Microscope className="h-4 w-4 text-primary" />
                <span>Identificação botânica</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <span>Toxicidade animal</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <span>Diagnóstico fitossanitário</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Leaf className="h-4 w-4 text-primary" />
                <span>Diagnósticos diferenciais</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 max-w-3xl">
        {/* Botão de Exemplo */}
        <div className="flex justify-start">
          <Button variant="outline" onClick={handleExampleFill}>
            <Leaf className="mr-2 h-4 w-4" />
            Usar exemplo: Suspeita de vassoura-de-bruxa
          </Button>
        </div>

        {/* Identificação Profissional */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Identificação Profissional
            </CardTitle>
            <CardDescription>Profissionais: agrônomos, engenheiros florestais, biólogos, veterinários</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={isProfessional} onValueChange={setIsProfessional}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id="prof-sim" />
                <Label htmlFor="prof-sim">Sou profissional da área</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id="prof-nao" />
                <Label htmlFor="prof-nao">Não sou profissional da área</Label>
              </div>
            </RadioGroup>

            {isProfessional === "sim" && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Tipo de Conselho *</Label>
                  <Select value={councilType} onValueChange={setCouncilType}>
                    <SelectTrigger><SelectValue placeholder="Selecione o conselho" /></SelectTrigger>
                    <SelectContent>
                      {COUNCIL_TYPES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Número do Registro *</Label>
                    <Input placeholder="Ex: 12345" value={councilNumber} onChange={(e) => setCouncilNumber(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>UF *</Label>
                    <Select value={councilUF} onValueChange={setCouncilUF}>
                      <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                      <SelectContent>
                        {UFS.map((uf) => (
                          <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Localização */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              Localização
            </CardTitle>
            <CardDescription>Informe a região para contextualizar a análise fitossanitária</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Região / Município</Label>
                <Input placeholder="Ex: Macapá, Serra do Navio..." value={regiao} onChange={(e) => setRegiao(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Estado (UF)</Label>
                <Select value={estado} onValueChange={setEstado}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {UFS.map((uf) => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload de Imagens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImageIcon className="h-5 w-5 text-primary" />
              Imagens da Planta / Lavoura
            </CardTitle>
            <CardDescription>Envie até {MAX_IMAGES} fotos: folhas, caule, ramos, flores, frutos ou visão geral da lavoura</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Input type="file" accept="image/*" multiple onChange={handleImageUpload} className="flex-1" disabled={images.length >= MAX_IMAGES} />
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>

            {images.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">{images.length} de {MAX_IMAGES} imagens</span>
                <div className="grid grid-cols-5 gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img} alt={`Imagem ${i + 1}`} className="w-full h-16 object-cover rounded border" />
                      <button onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {images.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                <span>Nenhuma imagem carregada</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Descrição da Planta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Leaf className="h-5 w-5 text-primary" />
              Descrição da Planta
            </CardTitle>
            <CardDescription>Descreva características, local, bioma e contexto agrícola</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Ex: Planta com folhas verdes escuras, formato de coração, encontrada em pastagem de bovinos no Cerrado. Caule ereto, flores amareladas..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* Sintomas Observados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="h-5 w-5 text-primary" />
              Sintomas Observados
            </CardTitle>
            <CardDescription>Descreva sintomas na planta, lavoura ou em animais após contato/ingestão</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Ex: Brotações finas e excessivas nos ramos, aspecto de vassoura. Folhas amarelando. Animais com salivação excessiva após ingestão..."
              value={sintomas}
              onChange={(e) => setSintomas(e.target.value)}
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* Botão */}
        <Button onClick={handleIdentify} disabled={loading} size="lg" className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Leaf className="mr-2 h-5 w-5" />
              Analisar Planta
            </>
          )}
        </Button>

        {/* Resultado */}
        {result && (
          <Card className="border-primary/30">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Leaf className="h-5 w-5" />
                Relatório Fitotoxicológico e Fitossanitário
              </CardTitle>
              <CardDescription>Diagnóstico integrado com identificação botânica, toxicidade e análise fitossanitária</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <MarkdownTableRenderer
                content={result}
                className="bg-muted/30 p-6 rounded-lg text-sm leading-relaxed border"
              />

              <div className="mt-6 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-3 italic">
                  Relatório gerado via VetAgro Sustentável AI — Identificação Botânica e Diagnóstico Fitossanitário Integrado © 2025
                </p>
                <ResponseActionButtons
                  content={result}
                  title="Identificador de Plantas - Relatório Fitossanitário"
                  toolName="Identificador de Plantas (Toxicologia Vegetal)"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </div>
  );
};

export default IdentificadorPlantas;
