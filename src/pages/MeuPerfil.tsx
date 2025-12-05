import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  User, Linkedin, Instagram, Youtube, Facebook, 
  Sparkles, Leaf, Lightbulb, Heart, Target, 
  Settings, CheckCircle2, Quote
} from "lucide-react";
import { toast } from "sonner";

const MeuPerfil = () => {
  const handleEditProfile = () => {
    toast.info("Funcionalidade em breve!", {
      description: "A edição de perfil e preferências estará disponível em uma próxima atualização."
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header Principal */}
      <div className="mb-10 text-center">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              ✨ Meu Perfil
            </h1>
            <p className="text-xl text-primary font-medium">
              Bem-vindo ao seu espaço dentro da VetAgro AI
            </p>
          </div>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Aqui você gerencia suas informações, preferências e acompanha sua jornada de evolução no agro inteligente.
        </p>
      </div>

      {/* Card: Quem Somos */}
      <Card className="mb-6 border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Leaf className="h-6 w-6 text-primary" />
            Quem Somos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            O <strong className="text-foreground">VetAgro Sustentável AI</strong> nasceu da união entre ciência aplicada, inteligência artificial e propósito.
          </p>
          <p>
            Criamos este ambiente para que profissionais, produtores, tutores e pesquisadores tenham acesso a análises confiáveis, apoio à decisão técnica e ferramentas que transformam informação em impacto real — no campo, no laboratório, na clínica e na gestão.
          </p>
          <p>Somos movidos por um princípio simples:</p>
          
          {/* Blockquote destacado */}
          <blockquote className="border-l-4 border-primary bg-muted/50 p-4 rounded-r-lg italic text-foreground">
            <Quote className="h-5 w-5 text-primary mb-2" />
            "Tecnologia deve servir às pessoas — não substituí-las."
          </blockquote>
        </CardContent>
      </Card>

      {/* Card: Nosso Propósito */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Lightbulb className="h-6 w-6 text-amber-500" />
            Nosso Propósito
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Capacitar quem cuida da vida, oferecendo ferramentas que:
          </p>
          
          <div className="grid gap-3 pl-2">
            {[
              "economizam tempo",
              "melhoram decisões",
              "reduzem erros",
              "promovem bem-estar animal",
              "fortalecem sustentabilidade ambiental"
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
          
          <p className="text-muted-foreground pt-2 font-medium">
            Tudo de forma simples, prática e ética.
          </p>
        </CardContent>
      </Card>

      {/* Card: O Que Nos Guia */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Heart className="h-6 w-6 text-rose-500" />
            O Que Nos Guia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Cada função do app foi construída com base em três pilares:
          </p>
          
          <div className="flex flex-wrap gap-3 py-2">
            <Badge variant="secondary" className="px-4 py-2 text-sm bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
              📌 Eficiência produtiva
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              📌 Bem-estar animal
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              📌 Responsabilidade ambiental
            </Badge>
          </div>
          
          <Separator className="my-4" />
          
          <p className="text-muted-foreground">
            A IA aqui analisa, calcula, projeta e sugere —
          </p>
          <p className="text-foreground font-semibold">
            mas você continua sendo o profissional que decide.
          </p>
        </CardContent>
      </Card>

      {/* Card: Quem Está Por Trás */}
      <Card className="mb-6 bg-gradient-to-br from-card to-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <User className="h-6 w-6 text-indigo-500" />
            Quem Está Por Trás
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="h-20 w-20 border-4 border-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground text-2xl font-bold">
                MS
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold text-foreground mb-1">
                Márcia Salgado
              </h3>
              <p className="text-primary font-medium mb-3">
                Médica Veterinária • Pesquisadora • Desenvolvedora da plataforma
              </p>
              <p className="text-muted-foreground">
                Criadora apaixonada pela transformação sustentável do agro
                e pelo poder das pessoas quando têm conhecimento acessível nas mãos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card: Conecte-se */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            📬 Conecte-se com a VetAgro AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <a
              href="https://www.linkedin.com/in/m%C3%A1rcia-salgado-212193344?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors group"
            >
              <Linkedin className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="text-foreground">💼 LinkedIn — Márcia Salgado</span>
            </a>
            <a
              href="https://www.instagram.com/vetagrosustentavel?igsh=dTR0ZjJ1eHRpc3lv"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors group"
            >
              <Instagram className="h-5 w-5 text-pink-600 group-hover:scale-110 transition-transform" />
              <span className="text-foreground">📸 Instagram — @vetagrosustentavel</span>
            </a>
            <a
              href="https://youtube.com/@vetagrosustentavel?si=9Vi5YA4FKXwqZv4t"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors group"
            >
              <Youtube className="h-5 w-5 text-red-600 group-hover:scale-110 transition-transform" />
              <span className="text-foreground">▶ YouTube — @vetagrosustentavel</span>
            </a>
            <a
              href="https://www.facebook.com/share/1Bn76mwVMx/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors group"
            >
              <Facebook className="h-5 w-5 text-blue-700 group-hover:scale-110 transition-transform" />
              <span className="text-foreground">📘 Facebook — VetAgro Sustentável</span>
            </a>
          </div>
          
          <p className="text-muted-foreground text-center mt-4 italic">
            Queremos estar perto de quem faz o agro acontecer.
          </p>
        </CardContent>
      </Card>

      {/* Card: Seu Perfil, Seu Progresso */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Target className="h-6 w-6 text-primary" />
            ✨ Seu Perfil, Seu Progresso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Gerencie seus dados, acompanhe sua assinatura, personalize sua experiência
            e mantenha seu painel atualizado com suas preferências.
          </p>
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-foreground font-medium text-center">
              Bem-vindo ao centro da sua jornada de inovação.
            </p>
            <p className="text-primary text-center mt-1">
              Aqui, ciência, campo e futuro se encontram — com você no comando.
            </p>
          </div>
          
          <div className="flex justify-center pt-2">
            <Button 
              onClick={handleEditProfile}
              className="gap-2"
              size="lg"
            >
              <Settings className="h-4 w-4" />
              Editar meu Perfil / Preferências
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MeuPerfil;
