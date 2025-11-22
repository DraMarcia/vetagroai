import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, ExternalLink, Leaf, Heart, Newspaper } from "lucide-react";

const newsCategories = {
  sustentabilidade: [
    {
      title: "Práticas Sustentáveis na Pecuária Brasileira",
      description: "Como a pecuária sustentável está transformando o agronegócio nacional com foco em preservação ambiental e produtividade.",
      category: "Sustentabilidade",
      source: "Globo Rural",
      url: "https://globorural.globo.com/",
      date: "2024",
    },
    {
      title: "Redução de Emissões de GEE na Agricultura",
      description: "Tecnologias e métodos para reduzir gases de efeito estufa na produção agropecuária moderna.",
      category: "Sustentabilidade",
      source: "Embrapa",
      url: "https://www.embrapa.br/",
      date: "2024",
    },
    {
      title: "Integração Lavoura-Pecuária-Floresta",
      description: "Sistema ILPF como alternativa sustentável para aumentar produtividade e preservar o meio ambiente.",
      category: "Sustentabilidade",
      source: "Canal Rural",
      url: "https://www.canalrural.com.br/",
      date: "2024",
    },
    {
      title: "Agricultura Regenerativa no Brasil",
      description: "Práticas que restauram a saúde do solo e aumentam a biodiversidade nas propriedades rurais.",
      category: "Sustentabilidade",
      source: "AgroLink",
      url: "https://www.agrolink.com.br/",
      date: "2024",
    },
  ],
  bemestar: [
    {
      title: "Bem-Estar Animal na Produção Sustentável",
      description: "Como garantir o bem-estar dos animais de produção mantendo eficiência e lucratividade.",
      category: "Bem-Estar Animal",
      source: "Globo Rural",
      url: "https://globorural.globo.com/",
      date: "2024",
    },
    {
      title: "Protocolos de Bem-Estar em Bovinos",
      description: "Normas e práticas para garantir qualidade de vida e sanidade nos rebanhos bovinos.",
      category: "Bem-Estar Animal",
      source: "MAPA",
      url: "https://www.gov.br/agricultura/",
      date: "2024",
    },
    {
      title: "Enriquecimento Ambiental em Animais de Produção",
      description: "Técnicas para melhorar o ambiente e comportamento natural dos animais em sistemas de criação.",
      category: "Bem-Estar Animal",
      source: "WSPA Brasil",
      url: "https://www.worldanimalprotection.org.br/",
      date: "2024",
    },
  ],
  pets: [
    {
      title: "Nutrição Adequada para Cães e Gatos",
      description: "Guia completo sobre alimentação balanceada e necessidades nutricionais de pets domésticos.",
      category: "Cuidados com Pets",
      source: "Vet Quality",
      url: "https://www.vetquality.com.br/",
      date: "2024",
    },
    {
      title: "Vacinação e Prevenção de Doenças em Pets",
      description: "Calendário de vacinas e cuidados preventivos essenciais para a saúde dos animais de estimação.",
      category: "Cuidados com Pets",
      source: "Conselho Federal de Medicina Veterinária",
      url: "https://www.cfmv.gov.br/",
      date: "2024",
    },
    {
      title: "Comportamento Animal e Adestramento Positivo",
      description: "Técnicas modernas de adestramento baseadas em reforço positivo e bem-estar animal.",
      category: "Cuidados com Pets",
      source: "Portal Vet",
      url: "https://www.portalvet.com.br/",
      date: "2024",
    },
    {
      title: "Medicina Preventiva em Animais de Companhia",
      description: "Importância dos check-ups regulares e exames preventivos para longevidade dos pets.",
      category: "Cuidados com Pets",
      source: "Vet Quality",
      url: "https://www.vetquality.com.br/",
      date: "2024",
    },
  ],
};

const Blog = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Blog VetAgro</h1>
            <p className="text-muted-foreground">
              Notícias, artigos e novidades sobre sustentabilidade, bem-estar animal e cuidados veterinários
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="sustentabilidade" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="sustentabilidade" className="gap-2">
            <Leaf className="h-4 w-4" />
            Sustentabilidade
          </TabsTrigger>
          <TabsTrigger value="bemestar" className="gap-2">
            <Heart className="h-4 w-4" />
            Bem-Estar Animal
          </TabsTrigger>
          <TabsTrigger value="pets" className="gap-2">
            <Newspaper className="h-4 w-4" />
            Cuidados com Pets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sustentabilidade" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {newsCategories.sustentabilidade.map((article, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className="mb-2">
                      {article.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{article.date}</span>
                  </div>
                  <CardTitle className="text-xl">{article.title}</CardTitle>
                  <CardDescription>{article.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Fonte: {article.source}
                    </span>
                    <Button variant="outline" size="sm" asChild>
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="gap-2">
                        Acessar
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bemestar" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {newsCategories.bemestar.map((article, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className="mb-2">
                      {article.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{article.date}</span>
                  </div>
                  <CardTitle className="text-xl">{article.title}</CardTitle>
                  <CardDescription>{article.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Fonte: {article.source}
                    </span>
                    <Button variant="outline" size="sm" asChild>
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="gap-2">
                        Acessar
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pets" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {newsCategories.pets.map((article, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className="mb-2">
                      {article.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{article.date}</span>
                  </div>
                  <CardTitle className="text-xl">{article.title}</CardTitle>
                  <CardDescription>{article.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Fonte: {article.source}
                    </span>
                    <Button variant="outline" size="sm" asChild>
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="gap-2">
                        Acessar
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="mt-8 bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Fontes Recomendadas
          </CardTitle>
          <CardDescription>
            Acesse diretamente os principais portais de notícias do agronegócio e veterinária
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Globo Rural", url: "https://globorural.globo.com/" },
              { name: "Canal Rural", url: "https://www.canalrural.com.br/" },
              { name: "Embrapa", url: "https://www.embrapa.br/" },
              { name: "AgroLink", url: "https://www.agrolink.com.br/" },
              { name: "CFMV", url: "https://www.cfmv.gov.br/" },
              { name: "MAPA", url: "https://www.gov.br/agricultura/" },
            ].map((source) => (
              <Button
                key={source.name}
                variant="outline"
                className="justify-between"
                asChild
              >
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.name}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Blog;
