import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf } from "lucide-react";

const ModeladorCarbono = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Leaf className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Modelador de Carbono e Créditos Ambientais</h1>
            <p className="text-muted-foreground">Elegibilidade em mercados de carbono e projeção de receita</p>
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
            O Modelador de Carbono calculará redução de emissões, elegibilidade em mercados, projeção de receita anual e documentação necessária para créditos de carbono.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModeladorCarbono;
