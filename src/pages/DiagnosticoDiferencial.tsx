import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope } from "lucide-react";

const DiagnosticoDiferencial = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Diagnóstico Diferencial Inteligente</h1>
            <p className="text-muted-foreground">Gere hipóteses diagnósticas com base em sinais clínicos</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ferramenta em Desenvolvimento</CardTitle>
          <CardDescription>
            Esta ferramenta de IA será integrada em breve para auxiliar no diagnóstico diferencial veterinário.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Em breve você poderá inserir sinais clínicos e receber hipóteses diagnósticas diferenciadas 
            baseadas em inteligência artificial avançada.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiagnosticoDiferencial;
