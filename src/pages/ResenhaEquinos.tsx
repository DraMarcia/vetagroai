import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

const ResenhaEquinos = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerador de Resenha de Equinos</h1>
            <p className="text-muted-foreground">Gere resenhas técnicas a partir de fotos com exportação para PDF</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ferramenta em Desenvolvimento</CardTitle>
          <CardDescription>
            Esta ferramenta de IA será integrada em breve para geração automática de resenhas de equinos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Em breve você poderá enviar fotos de equinos e gerar resenhas técnicas completas 
            com opção de edição e exportação para PDF.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResenhaEquinos;
