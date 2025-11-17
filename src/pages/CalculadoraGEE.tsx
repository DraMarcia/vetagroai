import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud } from "lucide-react";

const CalculadoraGEE = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center">
            <Cloud className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Calculadora de Emissões de GEE</h1>
            <p className="text-muted-foreground">Estime emissões de GEE e descubra práticas de mitigação</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ferramenta em Desenvolvimento</CardTitle>
          <CardDescription>
            Esta ferramenta de IA será integrada em breve para cálculo de emissões de gases de efeito estufa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Em breve você poderá estimar as emissões de GEE de suas atividades e descobrir 
            práticas de mitigação baseadas em IA.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalculadoraGEE;
