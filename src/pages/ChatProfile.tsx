import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Plus, Sparkles, Loader2, User, Bot, Mic, ChevronRight } from "lucide-react";
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
  chipColor: string;
  chips: string[];
}

const profilesChatData: Record<string, ProfileChatData> = {
  veterinario: {
    title: "Veterinários",
    greeting: "Como posso te ajudar na prática clínica hoje?",
    subtitle: "Descreva seu caso ou objetivo. A IA analisa e apoia sua decisão profissional.",
    placeholder: "Descreva um caso clínico, sintomas ou envie exames...",
    disclaimer: "O VetAgro IA apoia suas decisões clínicas com base em dados. Sempre utilize seu julgamento profissional.",
    chipLabel: "Clínica Veterinária",
    chipColor: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    chips: ["Diagnóstico clínico inteligente", "Interpretação de exames", "Protocolos terapêuticos", "Cálculo de dose veterinária", "Análise de casos complexos", "Referência farmacológica"],
  },
  zootecnista: {
    title: "Zootecnistas",
    greeting: "Vamos otimizar seu sistema produtivo hoje?",
    subtitle: "Descreva seu caso ou objetivo. A IA analisa e apoia sua decisão profissional.",
    placeholder: "Descreva o sistema produtivo, dieta ou dados do rebanho...",
    disclaimer: "O VetAgro IA fornece análises para apoio técnico. Avalie conforme a realidade do sistema produtivo.",
    chipLabel: "Gestão Produtiva",
    chipColor: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
    chips: ["Formulação de dietas", "Análise produtiva", "Escore corporal (ECC)", "Eficiência alimentar", "Planejamento nutricional", "Simulação produtiva"],
  },
  agronomo: {
    title: "Agrônomos",
    greeting: "Como posso ajudar na sua produção agrícola?",
    subtitle: "Descreva seu caso ou objetivo. A IA analisa e apoia sua decisão profissional.",
    placeholder: "Descreva a cultura, solo, região ou envie imagens...",
    disclaimer: "O VetAgro IA oferece recomendações baseadas em dados. Considere as condições locais antes de decidir.",
    chipLabel: "Produção Agrícola",
    chipColor: "bg-lime-50 text-lime-700 border-lime-200 hover:bg-lime-100",
    chips: ["Identificação de plantas", "Cálculo de emissões (GEE)", "Análise climática", "Consulta geoespacial", "Sustentabilidade", "Planejamento ambiental"],
  },
  produtor: {
    title: "Produtor Rural",
    greeting: "Vamos melhorar os resultados da sua propriedade hoje?",
    subtitle: "Descreva seu caso ou objetivo. A IA analisa e apoia sua decisão profissional.",
    placeholder: "Descreva sua propriedade, rebanho ou dúvida...",
    disclaimer: "O VetAgro IA ajuda com análises e sugestões. Avalie o que faz mais sentido para sua realidade.",
    chipLabel: "Gestão da Propriedade",
    chipColor: "bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
    chips: ["Simulação de confinamento", "Modelagem de carbono", "Análise econômica", "Planejamento da propriedade", "Eficiência produtiva", "Decisão estratégica"],
  },
  pesquisador: {
    title: "Pesquisador",
    greeting: "Vamos gerar análises científicas e insights avançados hoje?",
    subtitle: "Descreva seu caso ou objetivo. A IA analisa e apoia sua decisão profissional.",
    placeholder: "Descreva o objetivo da pesquisa, variáveis ou envie dados...",
    disclaimer: "As análises são baseadas em modelos e dados disponíveis. Recomenda-se validação técnica e científica.",
    chipLabel: "Análise Científica",
    chipColor: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100",
    chips: ["Cálculo de GEE (IPCC)", "Modelagem de carbono", "Análise climática", "Consulta geoespacial", "Análise científica", "Relatórios técnicos"],
  },
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/profile-chat`;

async function streamChat({ messages, profileId, onDelta, onDone, onError }: {
  messages: Msg[]; profileId: string; onDelta: (text: string) => void; onDone: () => void; onError: (err: string) => void;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { onError("Sessão expirada. Faça login novamente."); return; }

  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ messages, profileId }),
  });

  if (!resp.ok) { const errData = await resp.json().catch(() => ({})); onError(errData.error || `Erro ${resp.status}`); return; }
  if (!resp.body) { onError("Resposta vazia do servidor."); return; }

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
      if (jsonStr === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { textBuffer = line + "\n" + textBuffer; break; }
    }
  }

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

function ChatInput({ inputValue, setInputValue, isLoading, onSend, placeholder, textareaRef }: {
  inputValue: string; setInputValue: (v: string) => void; isLoading: boolean; onSend: (text: string) => void; placeholder: string; textareaRef: React.RefObject<HTMLTextAreaElement>;
}) {
  return (
    <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-md focus-within:border-primary/40 focus-within:shadow-lg transition-all">
      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground flex-shrink-0" title="Anexar arquivo">
        <Plus className="w-5 h-5" />
      </Button>
      <textarea
        ref={textareaRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        rows={1}
        className="flex-1 resize-none bg-transparent border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[36px] max-h-[100px] py-2"
        style={{ fieldSizing: "content" } as any}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(inputValue); } }}
        disabled={isLoading}
      />
      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground flex-shrink-0" title="Gravar áudio">
        <Mic className="w-4 h-4" />
      </Button>
      <Button size="icon" className="h-9 w-9 flex-shrink-0" disabled={!inputValue.trim() || isLoading} onClick={() => onSend(inputValue)} title="Enviar">
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </Button>
    </div>
  );
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
  const chipsContainerRef = useRef<HTMLDivElement>(null);
  const [showChipsArrow, setShowChipsArrow] = useState(false);

  const data = profileId ? profilesChatData[profileId] : null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/"); return; }
      const meta = session.user.user_metadata;
      const name = meta?.full_name || meta?.name || session.user.email?.split("@")[0] || "";
      setUserName(name);
    });
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check if chips overflow for scroll indicator
  useEffect(() => {
    const el = chipsContainerRef.current;
    if (el) {
      setShowChipsArrow(el.scrollWidth > el.clientWidth);
    }
  }, [data]);

  if (!data) { navigate("/"); return null; }

  const personalGreeting = userName
    ? `Olá, ${userName}. ${data.greeting}`
    : `Olá! ${data.greeting}`;

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
        if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    await streamChat({
      messages: updatedMessages, profileId: profileId!,
      onDelta: (chunk) => upsertAssistant(chunk),
      onDone: () => setIsLoading(false),
      onError: (err) => { toast.error(err); setIsLoading(false); },
    });
  };

  const handleChipClick = (chip: string) => {
    setInputValue(chip);
    textareaRef.current?.focus();
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3rem)]">
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6">
        {!hasMessages ? (
          <div className="flex flex-col items-center justify-center h-full py-4">
            <div className="max-w-2xl w-full text-center mb-4">
              <div className="inline-flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wide">
                  {data.chipLabel}
                </Badge>
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-1">
                {personalGreeting}
              </h1>
              <p className="text-xs text-muted-foreground">
                {data.subtitle}
              </p>
            </div>

            {/* Input */}
            <div className="max-w-2xl w-full mb-3">
              <ChatInput
                inputValue={inputValue}
                setInputValue={setInputValue}
                isLoading={isLoading}
                onSend={sendMessage}
                placeholder={data.placeholder}
                textareaRef={textareaRef}
              />
            </div>

            {/* Horizontal chips with scroll indicator */}
            <div className="max-w-2xl w-full relative">
              <div ref={chipsContainerRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {data.chips.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => handleChipClick(chip)}
                    className={`flex-shrink-0 px-3 py-2 rounded-full border text-xs font-semibold transition-all whitespace-nowrap active:scale-95 ${data.chipColor}`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
              {showChipsArrow && (
                <div className="absolute right-0 top-0 bottom-2 w-8 flex items-center justify-center bg-gradient-to-l from-background to-transparent pointer-events-none">
                  <ChevronRight className="w-4 h-4 text-muted-foreground animate-pulse" />
                </div>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground text-center mt-2 max-w-md leading-relaxed">
              {data.disclaimer}
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-li:my-0.5 prose-headings:my-2">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-primary" />
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

      {/* Bottom input when conversation active */}
      {hasMessages && (
        <div className="border-t border-border bg-background px-4 py-2">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              inputValue={inputValue}
              setInputValue={setInputValue}
              isLoading={isLoading}
              onSend={sendMessage}
              placeholder={data.placeholder}
              textareaRef={textareaRef}
            />
            <p className="text-[9px] text-muted-foreground text-center mt-1.5 leading-relaxed">
              {data.disclaimer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
