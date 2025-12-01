import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Linkedin, Instagram, Youtube, Facebook } from "lucide-react";

const MeuPerfil = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex flex-col items-center gap-3 mb-4 text-center">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <User className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
            <p className="text-muted-foreground">Gerencie suas informações e preferências</p>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🌿 Sobre o VetAgro Sustentável AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            O <strong>VetAgro Sustentável AI</strong> nasceu da ideia de unir ciência, tecnologia e sustentabilidade em um único ambiente digital.
          </p>
          <p>
            Inspirado na rotina intensa dos profissionais do agro, o aplicativo foi criado para otimizar tempo, apoiar decisões técnicas e facilitar análises complexas — sem jamais substituir o papel essencial do conhecimento humano.
          </p>
          <p className="flex items-start gap-2">
            <span>💡</span>
            <span>
              <strong>A proposta é clara:</strong> usar a inteligência artificial como uma aliada da prática veterinária, zootécnica, agronômica e áreas afins.
            </span>
          </p>
          <p>
            Aqui, a tecnologia atua como um suporte para diagnósticos, cálculos, análises e geração de conteúdo, sempre com foco em eficiência, bem-estar animal e sustentabilidade.
          </p>
          <p>
            O VetAgro Sustentável AI foi desenvolvido para profissionais, pesquisadores e tutores de animais que buscam soluções práticas, inteligentes e responsáveis.
          </p>
          <p className="flex items-start gap-2">
            <span>🌱</span>
            <span>
              Cada ferramenta foi projetada para ajudar — <strong>não substituir</strong> — a experiência, a ética e a sensibilidade que tornam o trabalho humano insubstituível.
            </span>
          </p>
          <p>
            Ao integrar inovação e responsabilidade, o VetAgro Sustentável AI contribui para uma agropecuária mais eficiente, sustentável e alinhada aos desafios climáticos do século XXI.
          </p>
          <div className="pt-4 border-t">
            <p className="italic">Com propósito e gratidão,</p>
            <p className="font-semibold">Márcia Salgado</p>
            <p className="text-sm">Criadora e Pesquisadora</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contatos</CardTitle>
          <CardDescription>
            Conecte-se com o VetAgro Sustentável AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <a
              href="https://www.linkedin.com/in/m%C3%A1rcia-salgado-212193344?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <Linkedin className="h-5 w-5 text-blue-600" />
              <span>LinkedIn - Márcia Salgado</span>
            </a>
            <a
              href="https://www.instagram.com/vetagrosustentavel?igsh=dTR0ZjJ1eHRpc3lv"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <Instagram className="h-5 w-5 text-pink-600" />
              <span>Instagram - @vetagrosustentavel</span>
            </a>
            <a
              href="https://youtube.com/@vetagrosustentavel?si=9Vi5YA4FKXwqZv4t"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <Youtube className="h-5 w-5 text-red-600" />
              <span>YouTube - @vetagrosustentavel</span>
            </a>
            <a
              href="https://www.facebook.com/share/1Bn76mwVMx/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <Facebook className="h-5 w-5 text-blue-700" />
              <span>Facebook - VetAgro Sustentável</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MeuPerfil;
