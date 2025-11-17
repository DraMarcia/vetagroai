import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video } from "lucide-react";

const GeradorVideos = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <Video className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerador de Vídeos (Veo)</h1>
            <p className="text-muted-foreground">Produza vídeos curtos sobre temas complexos</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ferramenta em Desenvolvimento</CardTitle>
          <CardDescription>
            Esta ferramenta de IA será integrada em breve para geração de vídeos a partir de texto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Em breve você poderá produzir vídeos curtos sobre temas complexos usando IA avançada 
            para explicar conceitos veterinários e agrícolas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeradorVideos;
