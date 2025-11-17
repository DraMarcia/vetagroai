import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pill } from "lucide-react";

const Receituario = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Pill className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerador de Receituário Veterinário</h1>
            <p className="text-muted-foreground">Emita prescrições padronizadas a partir dos dados do paciente</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ferramenta em Desenvolvimento</CardTitle>
          <CardDescription>
            Esta ferramenta de IA será integrada em breve para geração automática de receituários veterinários.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Em breve você poderá gerar receituários veterinários padronizados automaticamente 
            com base nos dados do paciente e tratamento prescrito.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Receituario;
