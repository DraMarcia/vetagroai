import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf } from "lucide-react";

const IdentificadorPlantas = () => {
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

      <Card>
        <CardHeader>
          <CardTitle>Ferramenta em Desenvolvimento</CardTitle>
          <CardDescription>
            Esta ferramenta de IA será integrada em breve para identificação de plantas e análise de toxicidade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Em breve você poderá identificar plantas através de imagens ou descrições e verificar 
            sua toxicidade para animais.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default IdentificadorPlantas;
