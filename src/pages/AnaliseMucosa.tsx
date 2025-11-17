import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";

const AnaliseMucosa = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Eye className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analisador de Mucosa Ocular e Sinais Clínicos</h1>
            <p className="text-muted-foreground">Envie uma foto da mucosa ocular para análise de suporte</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ferramenta em Desenvolvimento</CardTitle>
          <CardDescription>
            Esta ferramenta de IA será integrada em breve para análise de imagens de mucosa ocular.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Em breve você poderá enviar fotos de mucosa ocular e dados do animal para receber 
            uma análise de suporte baseada em IA.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnaliseMucosa;
