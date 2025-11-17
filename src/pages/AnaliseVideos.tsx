import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video } from "lucide-react";

const AnaliseVideos = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <Video className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analisador de Vídeos Curtos</h1>
            <p className="text-muted-foreground">Extraia informações e análises de clipes de vídeo</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ferramenta em Desenvolvimento</CardTitle>
          <CardDescription>
            Esta ferramenta de IA será integrada em breve para análise de vídeos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Em breve você poderá fazer upload de vídeos curtos e extrair informações e análises 
            assistidas por IA.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnaliseVideos;
