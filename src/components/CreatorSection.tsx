import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Heart, 
  Instagram, 
  Linkedin, 
  Youtube, 
  GraduationCap,
  Award,
  Leaf,
  ExternalLink
} from "lucide-react";
import creatorPhoto from "@/assets/creator-photo.jpeg";

export function CreatorSection() {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-emerald-500/5">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Heart className="h-5 w-5 text-rose-500" />
          Sobre a Criadora
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Creator Profile */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <Avatar className="h-20 w-20 border-4 border-primary/20 shadow-lg shrink-0">
            <AvatarImage 
              src={creatorPhoto} 
              alt="Dra. Márcia Salgado"
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-600 text-white text-xl">
              MS
            </AvatarFallback>
          </Avatar>
          
          <div className="text-center sm:text-left space-y-2">
            <h3 className="text-lg font-bold text-foreground">
              Dra. Márcia Salgado
            </h3>
            <p className="text-sm text-muted-foreground">
              Pesquisadora e Criadora
            </p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <Badge variant="secondary" className="text-xs">
                <GraduationCap className="h-3 w-3 mr-1" />
                Especialista
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Leaf className="h-3 w-3 mr-1" />
                Sustentabilidade
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Award className="h-3 w-3 mr-1" />
                Bem-estar Animal
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Mission Statement */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground">Nossa Missão</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O VetAgro AI nasceu da necessidade de democratizar ferramentas técnicas 
            de alta qualidade para profissionais do agronegócio. Cada ferramenta 
            foi desenvolvida com base em referências científicas confiáveis, 
            visando facilitar diagnósticos, cálculos e análises do dia a dia.
          </p>
        </div>

        {/* Roadmap Preview */}
        <div className="space-y-3">
          <h4 className="font-semibold text-foreground">Em Desenvolvimento</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Integração com laboratórios
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              App mobile nativo
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Análise de imagens avançada
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Painel de métricas históricas
            </div>
          </div>
        </div>

        <Separator />

        {/* Social Links */}
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="https://www.linkedin.com/in/m%C3%A1rcia-salgado-212193344"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-2">
              <Linkedin className="h-4 w-4 text-blue-600" />
              LinkedIn
            </Button>
          </a>
          <a
            href="https://www.instagram.com/vetagrosustentavel"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-2">
              <Instagram className="h-4 w-4 text-pink-600" />
              Instagram
            </Button>
          </a>
          <a
            href="https://youtube.com/@vetagrosustentavel"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="gap-2">
              <Youtube className="h-4 w-4 text-red-600" />
              YouTube
            </Button>
          </a>
        </div>

        {/* Signature */}
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground italic">
            "Tecnologia a serviço da vida e do campo."
          </p>
          <p className="text-xs text-primary font-medium mt-1">
            — Dra. Márcia Salgado
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
