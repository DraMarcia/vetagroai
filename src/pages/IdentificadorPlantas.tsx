import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Leaf, Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const IdentificadorPlantas = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isProfessional, setIsProfessional] = useState<string>("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string>("");
  const [result, setResult] = useState("");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      toast({
        title: "Imagem carregada",
        description: "Pronto para identificação.",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleIdentify = async () => {
    if (!isProfessional) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe se você é um profissional da área.",
        variant: "destructive",
      });
      return;
    }

    if (!image && !description.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Envie uma imagem ou forneça uma descrição da planta.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("veterinary-consultation", {
        body: {
          tool: "identificador-plantas",
          images: image ? [image] : [],
          description: description || "Sem descrição adicional",
          isProfessional: isProfessional === "sim",
        },
      });

      if (error) throw error;

      let finalResult = data.answer;
      if (isProfessional === "nao") {
        finalResult += "\n\n⚠️ Esta é uma identificação preliminar. Para segurança do seu animal, consulte um médico veterinário antes de qualquer ação.";
      }

      setResult(finalResult);
      toast({
        title: "Identificação concluída!",
        description: "A planta foi identificada com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro:", error);
      toast({
        title: "Erro ao identificar",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center">
            <Leaf className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Identificador de Plantas e Toxicidade</h1>
            <p className="text-muted-foreground">Identifique plantas por imagem ou descrição e verifique sua toxicidade</p>
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
                <Label htmlFor="prof-nao">Não sou profissional da área</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imagem da Planta (Opcional)</CardTitle>
            <CardDescription>
              Envie uma foto clara da planta para melhor identificação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="flex-1"
              />
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Descrição da Planta (Opcional)</CardTitle>
            <CardDescription>
              Ou descreva as características da planta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Características</Label>
                <Textarea
                  id="description"
                  placeholder="Ex: Planta com folhas verdes escuras, formato de coração, flores brancas pequenas, encontrada no jardim..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleIdentify}
          disabled={loading || !isProfessional}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Identificando...
            </>
          ) : (
            <>
              <Leaf className="mr-2 h-5 w-5" />
              Identificar Planta
            </>
          )}
        </Button>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado da Identificação</CardTitle>
              <CardDescription>
                Informações sobre a planta e sua toxicidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
                  {result}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default IdentificadorPlantas;
