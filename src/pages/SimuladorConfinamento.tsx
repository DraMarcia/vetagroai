import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Warehouse } from "lucide-react";

const SimuladorConfinamento = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Warehouse className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Simulador de Confinamento Sustentável</h1>
            <p className="text-muted-foreground">Projeção de GMD, emissões, custo/arroba e eficiência</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Em Desenvolvimento</CardTitle>
          <CardDescription>
            Esta ferramenta está sendo desenvolvida e estará disponível em breve.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            O Simulador de Confinamento Sustentável permitirá projetar GMD, emissões, custo por arroba e eficiência para operações de confinamento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimuladorConfinamento;
