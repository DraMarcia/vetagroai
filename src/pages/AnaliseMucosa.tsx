import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AnaliseMucosa = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isProfessional, setIsProfessional] = useState<string>("");
  const [animalData, setAnimalData] = useState("");
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
        description: "Pronto para análise.",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!isProfessional) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe se você é um profissional da área.",
        variant: "destructive",
      });
      return;
    }

    if (!image || !animalData.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Envie uma imagem e forneça os dados do animal.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-equine", {
        body: {
          images: [image],
          breed: "Análise de mucosa",
          age: animalData,
          purpose: "Avaliação clínica de mucosa ocular",
        },
      });

      if (error) throw error;

      let finalResult = data.resenha;
      if (isProfessional === "nao") {
        finalResult += "\n\n⚠️ Esta é uma análise preliminar. Recomendamos fortemente consultar um médico veterinário para diagnóstico e tratamento adequados.";
      }

      setResult(finalResult);
      toast({
        title: "Análise concluída!",
        description: "A mucosa foi analisada com sucesso.",
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Eye className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analisador de Mucosa Ocular e Sinais Clínicos</h1>
            <p className="text-muted-foreground">Envie uma foto da mucosa ocular para análise de suporte</p>
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
            <CardTitle>Imagem da Mucosa</CardTitle>
            <CardDescription>
              Envie uma foto clara da mucosa ocular do animal
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
            <CardTitle>Dados do Animal</CardTitle>
            <CardDescription>
              Forneça informações relevantes sobre o animal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="animalData">Descrição *</Label>
                <Textarea
                  id="animalData"
                  placeholder="Ex: Cão, 7 anos, raça Labrador, apresentando letargia e diminuição do apetite..."
                  value={animalData}
                  onChange={(e) => setAnimalData(e.target.value)}
                  className="min-h-[100px]"
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
              <Eye className="mr-2 h-5 w-5" />
              Analisar Mucosa
            </>
          )}
        </Button>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado da Análise</CardTitle>
              <CardDescription>
                Avaliação baseada na imagem fornecida
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

export default AnaliseMucosa;
