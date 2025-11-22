import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

const Blog = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Blog</h1>
            <p className="text-muted-foreground">Artigos e novidades sobre veterinária e agropecuária</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conteúdo em Breve</CardTitle>
          <CardDescription>
            Esta seção será preenchida com artigos e novidades.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Em breve você encontrará aqui artigos especializados, dicas práticas 
            e as últimas novidades em medicina veterinária e agropecuária.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Blog;
