import { useState } from "react";
import { 
  HelpCircle, 
  Stethoscope, 
  CreditCard, 
  AlertTriangle, 
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  Lightbulb,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolSuggestionDialog } from "@/components/ToolSuggestionDialog";
import { Button } from "@/components/ui/button";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

const faqSections: FAQSection[] = [
  {
    title: "Uso Geral do App",
    icon: <HelpCircle className="h-5 w-5" />,
    items: [
      {
        question: "O que é a VetAgro Sustentável AI?",
        answer: "Uma suíte de inteligência artificial especializada em análise agropecuária e veterinária, oferecendo suporte técnico, educacional e decision-support para profissionais e produtores rurais."
      },
      {
        question: "O app substitui atendimento veterinário?",
        answer: "Não. Todas as ferramentas têm caráter educacional e de apoio ao raciocínio clínico ou produtivo. As análises não substituem a avaliação presencial por médico veterinário habilitado."
      },
      {
        question: "Quais ferramentas estão disponíveis?",
        answer: "O app oferece mais de 15 ferramentas nas áreas de medicina veterinária (diagnóstico diferencial, interpretação de exames, calculadora de doses), zootecnia e nutrição (calculadora de ração, análise produtiva), agronomia e sustentabilidade (identificador de plantas, calculadora de GEE, análise climática), e modelagem avançada (simulador de confinamento, modelador de carbono)."
      },
      {
        question: "Como navegar entre as ferramentas?",
        answer: "Use o menu lateral (sidebar) para acessar todas as ferramentas organizadas por categoria. Clique no ícone de menu no canto superior esquerdo para expandir ou recolher o menu."
      }
    ]
  },
  {
    title: "Ferramentas Clínicas",
    icon: <Stethoscope className="h-5 w-5" />,
    items: [
      {
        question: "Os relatórios podem ser usados para segunda opinião?",
        answer: "Sim, os relatórios podem ser utilizados como base para discussão técnica entre profissionais. Porém, não possuem valor legal como laudo veterinário oficial."
      },
      {
        question: "O app entende imagens?",
        answer: "Sim, diversas ferramentas aceitam imagens para análise (mucosa, exames, plantas). A qualidade e precisão das respostas depende diretamente da qualidade e nitidez das imagens enviadas."
      },
      {
        question: "Qual a diferença entre respostas para profissionais e tutores?",
        answer: "Profissionais (com CRMV) recebem análises técnicas aprofundadas com terminologia especializada e referências científicas. Tutores e produtores recebem explicações mais acessíveis com orientações práticas e sempre o lembrete de buscar avaliação presencial."
      },
      {
        question: "Os diagnósticos são confiáveis?",
        answer: "As análises são baseadas em literatura científica atualizada e algoritmos de IA treinados. Contudo, são sugestões de apoio ao raciocínio clínico — o diagnóstico definitivo sempre requer avaliação presencial por profissional habilitado."
      }
    ]
  },
  {
    title: "Assinatura e Créditos",
    icon: <CreditCard className="h-5 w-5" />,
    items: [
      {
        question: "Como vejo meus créditos disponíveis?",
        answer: "Acesse 'Meu Espaço Inteligente' no menu lateral ou a página 'Planos e Assinaturas' para visualizar seus créditos atuais e histórico de uso."
      },
      {
        question: "Como renovam os créditos?",
        answer: "No plano gratuito, os créditos renovam diariamente (10 créditos/dia). Nos planos pagos (Pro e Enterprise), os créditos são ilimitados para ferramentas de texto e renovam mensalmente junto à assinatura."
      },
      {
        question: "O que fazer se meu pagamento for recusado?",
        answer: "Verifique se seu cartão está válido e com limite disponível. Tente novamente com outro método de pagamento ou entre em contato com nosso suporte para assistência."
      },
      {
        question: "Posso cancelar minha assinatura?",
        answer: "Sim, você pode cancelar a qualquer momento através da página 'Planos e Assinaturas'. O acesso premium permanece ativo até o fim do período já pago."
      }
    ]
  },
  {
    title: "Exatidão das Respostas",
    icon: <AlertTriangle className="h-5 w-5" />,
    items: [
      {
        question: "Por que às vezes o relatório parece incompleto?",
        answer: "A qualidade da resposta depende diretamente dos dados fornecidos. Quanto mais detalhes você incluir (espécie, idade, peso, sintomas, histórico), mais completa será a análise. A IA jamais inventa informações ou diagnósticos."
      },
      {
        question: "A IA pode errar?",
        answer: "Como qualquer ferramenta de apoio, as análises têm limitações. Por isso, todas as respostas incluem alertas sobre a necessidade de avaliação presencial. Use as análises como ponto de partida, não como diagnóstico definitivo."
      },
      {
        question: "As informações são atualizadas?",
        answer: "Sim, nossos modelos são treinados com literatura científica atualizada. As referências incluídas nos relatórios indicam as fontes consultadas."
      },
      {
        question: "Posso contribuir com sugestões de melhoria?",
        answer: "Absolutamente! Há um campo dedicado para sugestões no app (botão 'Sugerir Ferramenta' no menu lateral). Seu feedback é essencial para evoluirmos a plataforma."
      }
    ]
  },
  {
    title: "Suporte e Contato",
    icon: <MessageCircle className="h-5 w-5" />,
    items: [
      {
        question: "Como falar com o suporte?",
        answer: "Você pode enviar suas dúvidas através do campo de sugestões no app ou entrar em contato pelo email suporte@vetagroai.com.br. Respondemos em até 48 horas úteis."
      },
      {
        question: "Como sugerir novas ferramentas?",
        answer: "Use o botão 'Sugerir Ferramenta' disponível no menu lateral ou no rodapé de cada ferramenta. Suas sugestões são analisadas pela equipe de desenvolvimento."
      },
      {
        question: "Quando buscar atendimento veterinário presencial?",
        answer: "Sempre que o animal apresentar sinais de urgência (dificuldade respiratória, sangramento, convulsões, apatia extrema), procure atendimento veterinário imediato. O app não substitui emergências veterinárias."
      },
      {
        question: "Meus dados estão seguros?",
        answer: "Sim, utilizamos criptografia e seguimos as melhores práticas de segurança de dados. Suas informações são protegidas e não são compartilhadas com terceiros."
      }
    ]
  }
];

function FAQAccordion({ section }: { section: FAQSection }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          {section.icon}
          {section.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {section.items.map((item, index) => (
          <div
            key={index}
            className="border-b border-border/30 last:border-0"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between py-3 text-left hover:text-primary transition-colors"
            >
              <span className="font-medium text-sm pr-4">{item.question}</span>
              {openIndex === index ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </button>
            {openIndex === index && (
              <div className="pb-4 text-sm text-muted-foreground leading-relaxed animate-in fade-in-0 slide-in-from-top-2">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function FAQ() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="bg-primary/5 border-b border-border/50">
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            FAQ – Perguntas Frequentes
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Encontre respostas para as dúvidas mais comuns sobre a VetAgro Sustentável AI.
            Não encontrou o que procura? Entre em contato conosco.
          </p>
        </div>
      </div>

      {/* FAQ Sections */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {faqSections.map((section, index) => (
            <FAQAccordion key={index} section={section} />
          ))}
        </div>

        {/* Contact & Suggestion Section */}
        <div className="max-w-3xl mx-auto mt-12">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Não encontrou sua resposta?
                </h2>
                <p className="text-muted-foreground text-sm">
                  Estamos aqui para ajudar. Entre em contato ou sugira melhorias para o app.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <a
                  href="mailto:suporte@vetagroai.com.br"
                  className="flex items-center gap-3 p-4 rounded-lg bg-background border border-border/50 hover:border-primary/50 hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Fale Conosco</p>
                    <p className="text-xs text-muted-foreground">suporte@vetagroai.com.br</p>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                </a>

                <ToolSuggestionDialog
                  trigger={
                    <button className="flex items-center gap-3 p-4 rounded-lg bg-background border border-border/50 hover:border-primary/50 hover:shadow-md transition-all w-full">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Lightbulb className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">Sugerir Melhoria</p>
                        <p className="text-xs text-muted-foreground">Sua opinião é importante</p>
                      </div>
                    </button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Institutional Footer */}
        <div className="text-center mt-12 pb-8">
          <p className="text-xs text-muted-foreground">
            VetAgro Sustentável AI — Inteligência aplicada à saúde, produção e bem-estar animal.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            © {new Date().getFullYear()} Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
