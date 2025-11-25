import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, GraduationCap, Presentation, Leaf, Award } from "lucide-react";

const ProdutosServicos = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Produtos e Serviços</h1>
            <p className="text-muted-foreground">Conheça nossos produtos e serviços especializados</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Orientação de TCC em Medicina Veterinária</CardTitle>
            </div>
            <CardDescription>
              Suporte especializado para desenvolvimento de trabalhos acadêmicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Oferecemos orientação completa para elaboração de Trabalhos de Conclusão de Curso (TCC) 
              em Medicina Veterinária, incluindo definição de tema, metodologia, análise de dados e 
              revisão bibliográfica.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Definição e delimitação do tema</li>
              <li>• Metodologia de pesquisa</li>
              <li>• Análise estatística de dados</li>
              <li>• Revisão e formatação</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Presentation className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Palestras e Workshops</CardTitle>
            </div>
            <CardDescription>
              Capacitação e atualização profissional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Realizamos palestras e workshops sobre temas relevantes da medicina veterinária e 
              agropecuária, com abordagem prática e atualizada sobre as principais tendências do setor.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Bem-estar animal na produção</li>
              <li>• Novas tecnologias veterinárias</li>
              <li>• Gestão de clínicas e fazendas</li>
              <li>• Práticas sustentáveis</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Leaf className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Consultoria em Sustentabilidade na Pecuária</CardTitle>
            </div>
            <CardDescription>
              Soluções sustentáveis para produção animal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Consultoria especializada em práticas sustentáveis para pecuária, focando em eficiência 
              produtiva, redução de impactos ambientais e implementação de sistemas regenerativos.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Gestão de pastagens sustentáveis</li>
              <li>• Redução de emissões de gases</li>
              <li>• Bem-estar animal na produção</li>
              <li>• Certificações ambientais</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Qualidade de Produtos de Origem Animal</CardTitle>
            </div>
            <CardDescription>
              Controle e garantia de qualidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Serviços de avaliação e consultoria em qualidade de produtos de origem animal, incluindo 
              análises físico-químicas, microbiológicas e implementação de sistemas de gestão da qualidade.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Análises laboratoriais</li>
              <li>• Implementação de BPF e APPCC</li>
              <li>• Auditoria de qualidade</li>
              <li>• Certificação de produtos</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProdutosServicos;
