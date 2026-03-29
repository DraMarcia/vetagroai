import { useEffect, useState, useRef, useCallback } from "react";
import { trackStartChat, trackSendMessage } from "@/lib/analytics";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Send, Plus, Sparkles, Loader2, User, Bot, Mic, ChevronLeft, ChevronRight } from "lucide-react";
import { ChatResponseActions } from "@/components/ChatResponseActions";
import { AnalysisVisual } from "@/components/AnalysisVisual";
import { LowCreditBanner, ZeroCreditBlock, CreditAlertMessage } from "@/components/CreditAlerts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AuthDialog } from "@/components/AuthDialog";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useConversations } from "@/hooks/useConversations";
import {
  type UserContext, type ConversationStage,
  createEmptyContext, extractContextFromMessage,
  isContextComplete, requiresConsultativeFlow, serializeContext,
} from "@/lib/userContextExtractor";

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

async function streamChat({ messages, profileId, conversationStage, userContext, onDelta, onDone, onError }: {
  messages: Msg[]; profileId: string; conversationStage?: ConversationStage; userContext?: Record<string, string>; onDelta: (text: string) => void; onDone: () => void; onError: (err: string) => void;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { onError("Sessão expirada. Faça login novamente."); return; }

  // Timeout de 60 segundos para evitar spinner infinito
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ messages, profileId, conversationStage, userContext }),
      signal: controller.signal,
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
        if (jsonStr === "[DONE]") { clearTimeout(timeoutId); onDone(); return; }
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
    clearTimeout(timeoutId);
    onDone();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === "AbortError") {
      onError("A resposta demorou demais. Tente novamente.");
    } else {
      onError("Falha na conexão. Verifique sua internet e tente novamente.");
    }
  }
}

function handleFileUpload(onFileSelected: (file: File) => void) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt";
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) onFileSelected(file);
  };
  input.click();
}

function ChatInput({ inputValue, setInputValue, isLoading, onSend, placeholder, textareaRef, onFileUpload }: {
  inputValue: string; setInputValue: (v: string) => void; isLoading: boolean; onSend: (text: string) => void; placeholder: string; textareaRef: React.RefObject<HTMLTextAreaElement>; onFileUpload: () => void;
}) {
  return (
    <div className="relative flex items-end gap-1.5 rounded-2xl border border-border bg-card p-2 shadow-md focus-within:border-primary/40 focus-within:shadow-lg transition-all">
      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground flex-shrink-0" title="Anexar arquivo" onClick={onFileUpload}>
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
      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground flex-shrink-0" title="Gravar áudio" onClick={() => toast.info("Gravação de áudio em breve!")}>
        <Mic className="w-4 h-4" />
      </Button>
      <Button size="icon" className="h-9 w-9 flex-shrink-0" disabled={!inputValue.trim() || isLoading} onClick={() => onSend(inputValue)} title="Enviar">
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </Button>
    </div>
  );
}

function ChipsRow({ chips, chipColor, onChipClick }: { chips: string[]; chipColor: string; onChipClick: (chip: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = containerRef.current;
    if (el) el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => { el?.removeEventListener("scroll", checkScroll); window.removeEventListener("resize", checkScroll); };
  }, [checkScroll]);

  const scroll = (dir: "left" | "right") => {
    containerRef.current?.scrollBy({ left: dir === "left" ? -160 : 160, behavior: "smooth" });
  };

  return (
    <div className="relative w-full">
      {canScrollLeft && (
        <button onClick={() => scroll("left")} className="absolute left-0 top-0 bottom-2 z-10 w-8 flex items-center justify-center bg-gradient-to-r from-background to-transparent">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
      <div ref={containerRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
        {chips.map((chip, i) => (
          <button key={i} onClick={() => onChipClick(chip)} className={`flex-shrink-0 px-3 py-2 rounded-full border text-xs font-semibold transition-all whitespace-nowrap active:scale-95 ${chipColor}`}>
            {chip}
          </button>
        ))}
      </div>
      {canScrollRight && (
        <button onClick={() => scroll("right")} className="absolute right-0 top-0 bottom-2 z-10 w-8 flex items-center justify-center bg-gradient-to-l from-background to-transparent">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

/* ── Auto-generate title from first user message ── */
function generateTitle(firstMessage: string): string {
  const cleaned = firstMessage.replace(/\n/g, " ").trim();
  if (cleaned.length <= 50) return cleaned;
  return cleaned.slice(0, 47) + "...";
}

/* ──── Main page ──── */
export default function ChatProfile() {
  const { profileId } = useParams<{ profileId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { credits, hasUnlimited, useCredit, refreshSubscription } = useSubscription();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [titleGenerated, setTitleGenerated] = useState(false);
  const [convStage, setConvStage] = useState<ConversationStage>("idle");
  const [userCtx, setUserCtx] = useState<UserContext>(() => createEmptyContext(profileId || "produtor"));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendingRef = useRef(false);

  const { conversations, createConversation, updateTitle, saveMessage, loadMessages, toggleFavorite } = useConversations(profileId);

  const isOutOfCredits = !hasUnlimited && credits <= 0;

  const data = profileId ? profilesChatData[profileId] : null;

  // Load conversation from URL param
  const conversationIdFromUrl = searchParams.get("conv");
  const isNewChat = searchParams.get("new") === "1";
  const autoLoadAttemptedRef = useRef<string | null>(null);
  const skipAutoLoadProfileRef = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/"); return; }
      const meta = session.user.user_metadata;
      const firstName = (meta?.full_name || meta?.name || "").split(" ")[0];
      setUserName(firstName || "");
    });
  }, [navigate]);

  // Reset chat completely when profileId changes
  useEffect(() => {
    setMessages([]);
    setActiveConversationId(null);
    setTitleGenerated(false);
    setInputValue("");
    setIsLoading(false);
    setConvStage("idle");
    setUserCtx(createEmptyContext(profileId || "produtor"));
    autoLoadAttemptedRef.current = null;
  }, [profileId]);

  // Explicit "new chat" mode: keep blank state and block immediate auto-restore
  useEffect(() => {
    if (!isNewChat) return;

    setMessages([]);
    setActiveConversationId(null);
    setTitleGenerated(false);
    setInputValue("");
    setIsLoading(false);
    setConvStage("idle");
    setUserCtx(createEmptyContext(profileId || "produtor"));

    autoLoadAttemptedRef.current = profileId || null;
    skipAutoLoadProfileRef.current = profileId || null;

    // Clean URL but keep blank-state lock for this profile
    setSearchParams({}, { replace: true });
  }, [isNewChat, profileId, setSearchParams]);

  // Load existing conversation from URL param
  useEffect(() => {
    if (conversationIdFromUrl && conversationIdFromUrl !== activeConversationId) {
      skipAutoLoadProfileRef.current = null;
      setActiveConversationId(conversationIdFromUrl);
      setTitleGenerated(true);
      autoLoadAttemptedRef.current = profileId || null;
      loadMessages(conversationIdFromUrl).then((msgs) => {
        setMessages(msgs.map(m => ({ role: m.role as "user" | "assistant", content: m.content })));
      });
    }
  }, [conversationIdFromUrl, activeConversationId, loadMessages, profileId]);

  // Auto-load last conversation when arriving without ?conv= param
  useEffect(() => {
    if (conversationIdFromUrl) return; // already loading from URL
    if (activeConversationId) return; // already have active conv
    if (skipAutoLoadProfileRef.current === profileId) return; // explicit new chat state
    if (autoLoadAttemptedRef.current === profileId) return; // already attempted for this profile
    if (!conversations.length) return; // no conversations yet

    const lastConv = conversations[0]; // already sorted by updated_at desc
    autoLoadAttemptedRef.current = profileId || null;
    setActiveConversationId(lastConv.id);
    setTitleGenerated(true);
    setSearchParams({ conv: lastConv.id }, { replace: true });
    loadMessages(lastConv.id).then((msgs) => {
      setMessages(msgs.map(m => ({ role: m.role as "user" | "assistant", content: m.content })));
    });
  }, [conversations, conversationIdFromUrl, activeConversationId, profileId, loadMessages, setSearchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Track start_chat on mount
  useEffect(() => {
    trackStartChat(profileId);
  }, [profileId]);

  if (!data) { navigate("/"); return null; }

  const personalGreeting = userName
    ? `Olá, ${userName}. ${data.greeting}`
    : `Olá! ${data.greeting}`;

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || sendingRef.current) return;

    // ── Credit check before sending (block only at 0) ──
    if (!hasUnlimited) {
      console.log("[credits] before send:", credits);
      if (credits <= 0) {
        console.log("[credits] BLOCKED — no credits remaining");
        // Don't use toast — the ZeroCreditBlock UI handles this
        return;
      }
    }

    trackSendMessage(profileId);
    sendingRef.current = true;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    // ── Stage + context management ──
    let currentCtx = extractContextFromMessage(text.trim(), userCtx);
    let currentStage = convStage;

    // Determine stage transitions
    if (currentStage === "idle" || currentStage === "final") {
      if (requiresConsultativeFlow(text.trim())) {
        currentStage = "diagnostico";
      }
    }

    if (currentStage === "diagnostico" && isContextComplete(currentCtx)) {
      currentStage = "analise";
    }

    setUserCtx(currentCtx);
    setConvStage(currentStage);

    // Create conversation if needed
    let convId = activeConversationId;
    if (!convId) {
      convId = await createConversation(generateTitle(text.trim()));
      if (!convId) {
        toast.error("Erro ao criar conversa");
        setIsLoading(false);
        sendingRef.current = false;
        return;
      }
      setActiveConversationId(convId);
      setTitleGenerated(true);
      skipAutoLoadProfileRef.current = null;
      setSearchParams({ conv: convId }, { replace: true });
    }

    // Save user message
    await saveMessage(convId, "user", text.trim());

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    const REPORT_CTA = `\n\n---\n\nSe você quiser uma análise mais aprofundada e estruturada deste caso, posso gerar um **relatório técnico completo** com:\n\n• Diagnóstico detalhado e causas prováveis\n• Estratégias recomendadas com base científica\n• Protocolo de ação passo a passo\n• Avaliação de riscos e impacto produtivo\n• Referências técnicas confiáveis\n\nBasta clicar em **"Gerar relatório"**.\n\nApós isso, você poderá baixar um PDF profissional ou compartilhar o conteúdo.\n\nCaso seus créditos acabem, você pode adquirir mais créditos para continuar utilizando a plataforma.`;

    const finalConvId = convId;
    const stageForRequest = currentStage;

    await streamChat({
      messages: updatedMessages,
      profileId: profileId!,
      conversationStage: stageForRequest,
      userContext: serializeContext(currentCtx),
      onDelta: (chunk) => upsertAssistant(chunk),
      onDone: async () => {
        if (assistantSoFar) {
          if (stageForRequest === "analise") {
            assistantSoFar += REPORT_CTA;
            setConvStage("final");
          }
          setMessages((prev) =>
            prev.map((m, i) => i === prev.length - 1 && m.role === "assistant" ? { ...m, content: assistantSoFar } : m)
          );
          await saveMessage(finalConvId, "assistant", assistantSoFar);
        }

        // ── Consume credit AFTER response is delivered ──
        if (!hasUnlimited) {
          console.log("[credits] before consumption:", credits);
          const success = await useCredit();
          console.log("[credits] use_credit result:", success);
          await refreshSubscription();

          const { data: creditsSnapshot, error: creditsSnapshotError } = await supabase.rpc("check_credits");
          if (creditsSnapshotError) {
            console.error("[credits] failed to read post-response credits:", creditsSnapshotError);
          } else if (creditsSnapshot && typeof creditsSnapshot === "object" && !Array.isArray(creditsSnapshot)) {
            const currentCredits = Number((creditsSnapshot as Record<string, unknown>).credits);
            console.log("[credits] after consumption:", Number.isFinite(currentCredits) ? currentCredits : "indisponível");
          }
        }

        setIsLoading(false);
        sendingRef.current = false;
        if (updatedMessages.length === 1) {
          await updateTitle(finalConvId, generateTitle(text.trim()));
        }
      },
      onError: (err) => { toast.error(err); setIsLoading(false); sendingRef.current = false; },
    });
  };

  const handleChipClick = (chip: string) => {
    setInputValue(chip);
    textareaRef.current?.focus();
  };

  const handleFileBtn = () => {
    handleFileUpload((file) => {
      toast.success(`Arquivo "${file.name}" selecionado.`);
    });
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveConversationId(null);
    setTitleGenerated(false);
    setConvStage("idle");
    setUserCtx(createEmptyContext(profileId || "produtor"));
    autoLoadAttemptedRef.current = profileId || null;
    skipAutoLoadProfileRef.current = profileId || null;
    setSearchParams({}, { replace: true });
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />

      {/* Messages / Welcome area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6">
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
            </div>

            <div className="max-w-2xl w-full mb-3">
              <ChatInput inputValue={inputValue} setInputValue={setInputValue} isLoading={isLoading} onSend={sendMessage} placeholder={data.placeholder} textareaRef={textareaRef} onFileUpload={handleFileBtn} />
            </div>

            <div className="max-w-2xl w-full">
              <ChipsRow chips={data.chips} chipColor={data.chipColor} onChipClick={handleChipClick} />
            </div>

            <p className="text-[10px] text-muted-foreground text-center mt-2 max-w-md leading-relaxed">
              {data.disclaimer}
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-4 space-y-4">
            {messages.map((msg, i) => {
              const isLastAssistant = msg.role === "assistant" && !isLoading &&
                (i === messages.length - 1 || messages.slice(i + 1).every(m => m.role === "user"));
              return (
                <div key={i}>
                  <div className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="w-3.5 h-3.5 text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-li:my-0.5 prose-headings:my-2">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      )}
                      {msg.role === "assistant" && !isLoading && (
                        <>
                          <AnalysisVisual content={msg.content} profileId={profileId} />
                          <ChatResponseActions
                            content={msg.content}
                            profileTitle={data.title}
                            userQuestion={(() => {
                              for (let j = i - 1; j >= 0; j--) {
                                if (messages[j].role === "user") return messages[j].content;
                              }
                              return "";
                            })()}
                          />
                        </>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  {/* Persistent skill chips after last assistant message */}
                  {isLastAssistant && (
                    <div className="mt-3 ml-10">
                      <ChipsRow chips={data.chips} chipColor={data.chipColor} onChipClick={handleChipClick} />
                    </div>
                  )}
                  {/* In-chat credit alert after last assistant message */}
                  {isLastAssistant && !hasUnlimited && (
                    <div className="mt-3">
                      <CreditAlertMessage credits={credits} />
                    </div>
                  )}
                </div>
              );
            })}
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

      {/* Bottom input when conversation is active */}
      {hasMessages && (
        <div className="border-t border-border bg-background px-3 sm:px-4 py-2 space-y-2">
          <div className="max-w-3xl mx-auto space-y-2">
            {!hasUnlimited && <LowCreditBanner credits={credits} />}
            {isOutOfCredits ? (
              <ZeroCreditBlock />
            ) : (
              <ChatInput inputValue={inputValue} setInputValue={setInputValue} isLoading={isLoading} onSend={sendMessage} placeholder={data.placeholder} textareaRef={textareaRef} onFileUpload={handleFileBtn} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
