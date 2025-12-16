import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingBag, 
  GraduationCap, 
  Presentation, 
  Leaf, 
  Award,
  BookOpen,
  FileText,
  Sparkles,
  Clock,
  Rocket,
  Lightbulb,
  Target
} from "lucide-react";

const ProdutosServicos = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header Principal */}
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-emerald-600 to-teal-600 flex items-center justify-center shadow-lg">
            <ShoppingBag className="h-7 w-7 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Produtos e Serviços VetAgro IA
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
          Conhecimento técnico, inovação e soluções inteligentes para a medicina veterinária, 
          produção animal e sustentabilidade agropecuária.
        </p>
      </div>

      {/* Serviços Atuais */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Nossos Serviços</h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Orientação TCC */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Orientação de TCC em Medicina Veterinária</CardTitle>
                  <Badge variant="secondary" className="mt-1">Educação</Badge>
                </div>
              </div>
              <CardDescription>
                Suporte especializado para desenvolvimento de trabalhos acadêmicos
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm text-muted-foreground mb-4">
                Oferecemos orientação completa para elaboração de Trabalhos de Conclusão de Curso (TCC) 
                em Medicina Veterinária, incluindo definição de tema, metodologia, análise de dados e 
                revisão bibliográfica.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Definição e delimitação do tema
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Metodologia de pesquisa
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Análise estatística de dados
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Revisão e formatação
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Palestras e Workshops */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-amber-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Presentation className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Palestras e Workshops</CardTitle>
                  <Badge variant="secondary" className="mt-1">Capacitação</Badge>
                </div>
              </div>
              <CardDescription>
                Capacitação e atualização profissional
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm text-muted-foreground mb-4">
                Realizamos palestras e workshops sobre temas relevantes da medicina veterinária e 
                agropecuária, com abordagem prática e atualizada sobre as principais tendências do setor.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Bem-estar animal na produção
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Novas tecnologias veterinárias
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Gestão de clínicas e fazendas
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Práticas sustentáveis
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Consultoria Sustentabilidade */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-emerald-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Leaf className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Consultoria em Sustentabilidade na Pecuária</CardTitle>
                  <Badge variant="secondary" className="mt-1">Sustentabilidade</Badge>
                </div>
              </div>
              <CardDescription>
                Soluções sustentáveis para produção animal
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm text-muted-foreground mb-4">
                Consultoria especializada em práticas sustentáveis para pecuária, focando em eficiência 
                produtiva, redução de impactos ambientais e implementação de sistemas regenerativos.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Gestão de pastagens sustentáveis
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Redução de emissões de gases
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Bem-estar animal na produção
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Certificações ambientais
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Qualidade de Produtos */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Award className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Qualidade de Produtos de Origem Animal</CardTitle>
                  <Badge variant="secondary" className="mt-1">Qualidade</Badge>
                </div>
              </div>
              <CardDescription>
                Controle e garantia de qualidade
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm text-muted-foreground mb-4">
                Serviços de avaliação e consultoria em qualidade de produtos de origem animal, incluindo 
                análises físico-químicas, microbiológicas e implementação de sistemas de gestão da qualidade.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Análises laboratoriais
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Implementação de BPF e APPCC
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Auditoria de qualidade
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Certificação de produtos
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="my-10" />

      {/* Seção "Em Breve" */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Rocket className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Em Breve no VetAgro IA</h2>
            <p className="text-sm text-muted-foreground">Novos produtos em desenvolvimento</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* E-books Técnicos */}
          <Card className="relative overflow-hidden border-dashed border-2 border-purple-300/50 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
            <div className="absolute top-3 right-3">
              <Badge className="bg-purple-500/90 text-white gap-1">
                <Clock className="h-3 w-3" />
                Em breve
              </Badge>
            </div>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground/90">E-books Técnicos</CardTitle>
                  <p className="text-sm text-muted-foreground">Conteúdo especializado</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Material didático aprofundado para profissionais e estudantes da área.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Sustentabilidade na Agropecuária
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Produção Animal de Baixa Emissão
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Bem-estar Animal e Eficiência Produtiva
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Medicina Veterinária Aplicada à Sustentabilidade
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Materiais Exclusivos */}
          <Card className="relative overflow-hidden border-dashed border-2 border-teal-300/50 bg-gradient-to-br from-teal-50/50 to-cyan-50/50 dark:from-teal-950/20 dark:to-cyan-950/20">
            <div className="absolute top-3 right-3">
              <Badge className="bg-teal-500/90 text-white gap-1">
                <Clock className="h-3 w-3" />
                Em breve
              </Badge>
            </div>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/30 to-cyan-500/30 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground/90">Materiais Exclusivos</CardTitle>
                  <p className="text-sm text-muted-foreground">Para assinantes</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Recursos práticos para aplicação imediata no dia a dia profissional.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lightbulb className="h-4 w-4 text-teal-500" />
                  Guias técnicos ilustrados
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lightbulb className="h-4 w-4 text-teal-500" />
                  Checklists profissionais
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lightbulb className="h-4 w-4 text-teal-500" />
                  Conteúdos científicos traduzidos para a prática
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lightbulb className="h-4 w-4 text-teal-500" />
                  Planilhas e templates prontos
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action sutil */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Fique atento às novidades! Novos produtos serão anunciados em breve.
          </p>
        </div>
      </section>
    </div>
  );
};

export default ProdutosServicos;
