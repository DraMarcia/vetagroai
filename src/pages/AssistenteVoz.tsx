import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

const AssistenteVoz = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Assistente de Voz VetAgro (Live)</h1>
            <p className="text-muted-foreground">Converse em tempo real com a IA por voz</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ferramenta em Desenvolvimento</CardTitle>
          <CardDescription>
            Esta ferramenta de IA será integrada em breve para conversas por voz em tempo real.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Em breve você poderá conversar em tempo real com a IA por voz para obter assistência 
            veterinária e agronômica instantânea.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssistenteVoz;
