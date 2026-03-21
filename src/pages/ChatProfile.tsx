import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Upload, Mic, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AuthDialog } from "@/components/AuthDialog";
import type { UserProfile } from "@/contexts/ProfileContext";

interface ProfileChatData {
  title: string;
  greeting: string;
  subtitle: string;
  placeholder: string;
  disclaimer: string;
  chipLabel: string;
  suggestions: string[];
}

const profilesChatData: Record<string, ProfileChatData> = {
  veterinario: {
    title: "Veterinários",
    greeting: "Olá! Como posso te ajudar na prática clínica hoje?",
    subtitle: "Descreva sua realidade, objetivos ou envie dados. Eu te ajudo com análise e recomendações.",
    placeholder: "Descreva um caso clínico, sintomas ou envie exames...",
    disclaimer: "O VetAgro IA apoia suas decisões clínicas com base em dados. Sempre utilize seu julgamento profissional.",
    chipLabel: "Clínica Veterinária",
    suggestions: [
      "Diagnóstico clínico",
      "Interpretação de exames",
      "Prescrição",
      "Protocolos terapêuticos",
    ],
  },
  zootecnista: {
    title: "Zootecnistas",
    greeting: "Olá! Vamos otimizar seu sistema produtivo hoje?",
    subtitle: "Descreva sua realidade, objetivos ou envie dados. Eu te ajudo com análise e recomendações.",
    placeholder: "Descreva o sistema produtivo, dieta ou dados do rebanho...",
    disclaimer: "O VetAgro IA fornece análises para apoio técnico. Avalie conforme a realidade do sistema produtivo.",
    chipLabel: "Gestão Produtiva",
    suggestions: [
      "Formulação de ração",
      "Eficiência produtiva",
      "Emissões de metano",
      "Conversão alimentar",
    ],
  },
  agronomo: {
    title: "Agrônomos",
    greeting: "Olá! Como posso ajudar na sua produção agrícola?",
    subtitle: "Descreva sua realidade, objetivos ou envie dados. Eu te ajudo com análise e recomendações.",
    placeholder: "Descreva a cultura, solo, região ou envie imagens...",
    disclaimer: "O VetAgro IA oferece recomendações baseadas em dados. Considere as condições locais antes de decidir.",
    chipLabel: "Produção Agrícola",
    suggestions: [
      "Sustentabilidade",
      "Solo e clima",
      "Análise ambiental",
      "Identificação de plantas",
    ],
  },
  produtor: {
    title: "Produtor Rural",
    greeting: "Olá! Vamos melhorar os resultados da sua propriedade hoje?",
    subtitle: "Descreva sua realidade, objetivos ou envie dados. Eu te ajudo com análise e recomendações.",
    placeholder: "Descreva sua propriedade, rebanho ou dúvida...",
    disclaimer: "O VetAgro IA ajuda com análises e sugestões. Avalie o que faz mais sentido para sua realidade.",
    chipLabel: "Gestão da Propriedade",
    suggestions: [
      "Rentabilidade",
      "Gestão da propriedade",
      "Crédito rural",
      "Custos de produção",
    ],
  },
  pesquisador: {
    title: "Pesquisador",
    greeting: "Olá! Vamos gerar análises científicas e insights avançados hoje?",
    subtitle: "Descreva sua realidade, objetivos ou envie dados. Eu te ajudo com análise e recomendações.",
    placeholder: "Descreva o objetivo da pesquisa, variáveis ou envie dados...",
    disclaimer: "As análises são baseadas em modelos e dados disponíveis. Recomenda-se validação técnica e científica.",
    chipLabel: "Análise Científica",
    suggestions: [
      "Modelagem de carbono",
      "Análise de dados",
      "Relatórios técnicos",
      "Emissões de GEE",
    ],
  },
};

export default function ChatProfile() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [userName, setUserName] = useState("");

  const data = profileId ? profilesChatData[profileId] : null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/");
        return;
      }
      const name = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "";
      setUserName(name);
    });
  }, [navigate]);

  if (!data) {
    navigate("/");
    return null;
  }

  const personalGreeting = userName
    ? data.greeting.replace("Olá!", `Olá, ${userName}.`)
    : data.greeting;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)]">
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />

      {/* Chat content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6 overflow-y-auto">
        <div className="max-w-2xl w-full text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <Badge variant="secondary" className="text-xs font-medium">
              {data.chipLabel}
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">
            {personalGreeting}
          </h1>
          <p className="text-sm text-muted-foreground">
            {data.subtitle}
          </p>
        </div>

        {/* Suggestion chips */}
        <div className="max-w-2xl w-full">
          <div className="flex flex-wrap gap-2 justify-center">
            {data.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setInputValue(s)}
                className="px-4 py-2.5 rounded-full border border-border bg-card text-sm text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-primary/30 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-background px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:border-primary/40 focus-within:shadow-md transition-all">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground flex-shrink-0"
              title="Upload arquivo ou imagem"
            >
              <Upload className="w-4 h-4" />
            </Button>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={data.placeholder}
              rows={1}
              className="flex-1 resize-none bg-transparent border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[36px] max-h-[120px] py-2"
              style={{ fieldSizing: "content" } as any}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  // TODO: send message via AI
                }
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground flex-shrink-0"
              title="Microfone"
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              disabled={!inputValue.trim()}
              title="Enviar"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-3 leading-relaxed">
            {data.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
