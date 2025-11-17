import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const ConsultaGeoespacial = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Consulta Geoespacial Sustentável</h1>
            <p className="text-muted-foreground">Pergunte sobre biomas, regiões e práticas sustentáveis</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ferramenta em Desenvolvimento</CardTitle>
          <CardDescription>
            Esta ferramenta de IA será integrada em breve para consultas geoespaciais sobre sustentabilidade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Em breve você poderá fazer consultas sobre biomas, regiões específicas e práticas 
            sustentáveis com base em dados geoespaciais.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsultaGeoespacial;
