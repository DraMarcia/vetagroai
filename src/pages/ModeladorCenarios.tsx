import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from "lucide-react";

const ModeladorCenarios = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Modelador de Cenários Complexos</h1>
            <p className="text-muted-foreground">Analise cenários complexos com raciocínio avançado</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ferramenta em Desenvolvimento</CardTitle>
          <CardDescription>
            Esta ferramenta de IA será integrada em breve para modelagem de cenários complexos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Em breve você poderá modelar e analisar cenários complexos com raciocínio avançado 
            de IA para tomada de decisões estratégicas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModeladorCenarios;
