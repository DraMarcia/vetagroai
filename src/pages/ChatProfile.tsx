import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Upload, Sparkles, Loader2, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AuthDialog } from "@/components/AuthDialog";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

interface ProfileChatData {
  title: string;
  greeting: string;
  subtitle: string;
  placeholder: string;
  disclaimer: string;
  chipLabel: string;
  chips: string[];
}

const profilesChatData: Record<string, ProfileChatData> = {
  veterinario: {
    title: "Veterinários",
    greeting: "Olá! Como posso te ajudar na prática clínica hoje?",
    subtitle: "Descreva seu caso, envie exames ou peça orientações. A IA analisa e responde como especialista.",
    placeholder: "Descreva um caso clínico, sintomas ou envie exames...",
    disclaimer: "O VetAgro IA apoia suas decisões clínicas com base em dados. Sempre utilize seu julgamento profissional.",
    chipLabel: "Clínica Veterinária",
    chips: [
      "Diagnóstico clínico inteligente",
      "Interpretação de exames",
      "Protocolos terapêuticos",
      "Cálculo de dose veterinária",
      "Análise de casos complexos",
      "Referência farmacológica",
    ],
  },
  zootecnista: {
    title: "Zootecnistas",
    greeting: "Olá! Vamos otimizar seu sistema produtivo hoje?",
    subtitle: "Descreva sua realidade, objetivos ou envie dados. Eu te ajudo com análise e recomendações.",
    placeholder: "Descreva o sistema produtivo, dieta ou dados do rebanho...",
    disclaimer: "O VetAgro IA fornece análises para apoio técnico. Avalie conforme a realidade do sistema produtivo.",
    chipLabel: "Gestão Produtiva",
    chips: [
      "Formulação de dietas",
      "Análise produtiva",
      "Escore corporal (ECC)",
      "Eficiência alimentar",
      "Planejamento nutricional",
      "Simulação produtiva",
    ],
  },
  agronomo: {
    title: "Agrônomos",
    greeting: "Olá! Como posso ajudar na sua produção agrícola?",
    subtitle: "Descreva a cultura, solo, região ou envie imagens para análise.",
    placeholder: "Descreva a cultura, solo, região ou envie imagens...",
    disclaimer: "O VetAgro IA oferece recomendações baseadas em dados. Considere as condições locais antes de decidir.",
    chipLabel: "Produção Agrícola",
    chips: [
      "Identificação de plantas",
      "Cálculo de emissões (GEE)",
      "Análise climática",
      "Consulta geoespacial",
      "Sustentabilidade",
      "Planejamento ambiental",
    ],
  },
  produtor: {
    title: "Produtor Rural",
    greeting: "Olá! Vamos melhorar os resultados da sua propriedade hoje?",
    subtitle: "Descreva sua propriedade, rebanho ou dúvida. A IA analisa e te orienta.",
    placeholder: "Descreva sua propriedade, rebanho ou dúvida...",
    disclaimer: "O VetAgro IA ajuda com análises e sugestões. Avalie o que faz mais sentido para sua realidade.",
    chipLabel: "Gestão da Propriedade",
    chips: [
      "Simulação de confinamento",
      "Modelagem de carbono",
      "Análise econômica",
      "Planejamento da propriedade",
      "Eficiência produtiva",
      "Decisão estratégica",
    ],
  },
  pesquisador: {
    title: "Pesquisador",
    greeting: "Olá! Vamos gerar análises científicas e insights avançados hoje?",
    subtitle: "Descreva o objetivo da pesquisa, variáveis ou envie dados para análise.",
    placeholder: "Descreva o objetivo da pesquisa, variáveis ou envie dados...",
    disclaimer: "As análises são baseadas em modelos e dados disponíveis. Recomenda-se validação técnica e científica.",
    chipLabel: "Análise Científica",
    chips: [
      "Cálculo de GEE (IPCC)",
      "Modelagem de carbono",
      "Análise climática",
      "Consulta geoespacial",
      "Análise científica",
      "Relatórios técnicos",
    ],
  },
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/profile-chat`;

async function streamChat({
  messages,
  profileId,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  profileId: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    onError("Sessão expirada. Faça login novamente.");
    return;
  }

  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ messages, profileId }),
  });

  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    onError(errData.error || `Erro ${resp.status}`);
    return;
  }

  if (!resp.body) {
    onError("Resposta vazia do servidor.");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        onDone();
        return;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // Flush remaining
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

export default function ChatProfile() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!data) {
    navigate("/");
    return null;
  }

  const personalGreeting = userName
    ? data.greeting.replace("Olá!", `Olá, ${userName}.`)
    : data.greeting;

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Msg = { role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    let assistantSoFar = "";

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    await streamChat({
      messages: updatedMessages,
      profileId: profileId!,
      onDelta: (chunk) => upsertAssistant(chunk),
      onDone: () => setIsLoading(false),
      onError: (err) => {
        toast.error(err);
        setIsLoading(false);
      },
    });
  };

  const handleChipClick = (chip: string) => {
    setInputValue(chip);
    textareaRef.current?.focus();
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)]">
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />

      {/* Messages / Welcome area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6">
        {!hasMessages ? (
          /* Welcome screen */
          <div className="flex flex-col items-center justify-center h-full py-8">
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

            {/* Smart chips */}
            <div className="max-w-2xl w-full">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {data.chips.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => handleChipClick(chip)}
                    className="px-3 py-3 rounded-xl border border-border bg-card text-sm text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-primary/30 transition-all text-left leading-snug"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Message list */
          <div className="max-w-3xl mx-auto py-6 space-y-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-li:my-0.5 prose-headings:my-2">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-background px-4 py-3">
        <div className="max-w-3xl mx-auto">
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
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={data.placeholder}
              rows={1}
              className="flex-1 resize-none bg-transparent border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[36px] max-h-[120px] py-2"
              style={{ fieldSizing: "content" } as any}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(inputValue);
                }
              }}
              disabled={isLoading}
            />
            <Button
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              disabled={!inputValue.trim() || isLoading}
              onClick={() => sendMessage(inputValue)}
              title="Enviar"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2 leading-relaxed">
            {data.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
