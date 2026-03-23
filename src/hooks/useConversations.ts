import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Conversation {
  id: string;
  user_id: string;
  profile_id: string;
  title: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export function useConversations(profileId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!profileId) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("profile_id", profileId)
      .order("updated_at", { ascending: false });

    if (!error && data) setConversations(data as Conversation[]);
    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Realtime subscription
  useEffect(() => {
    if (!profileId) return;
    const channel = supabase
      .channel(`conversations-${profileId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        fetchConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profileId, fetchConversations]);

  const createConversation = useCallback(async (title: string = "Nova conversa"): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !profileId) return null;

    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: session.user.id, profile_id: profileId, title })
      .select("id")
      .single();

    if (error || !data) return null;
    await fetchConversations();
    return data.id;
  }, [profileId, fetchConversations]);

  const updateTitle = useCallback(async (conversationId: string, title: string) => {
    await supabase.from("conversations").update({ title }).eq("id", conversationId);
  }, []);

  const toggleFavorite = useCallback(async (conversationId: string) => {
    const conv = conversations.find(c => c.id === conversationId);
    if (!conv) return;
    await supabase.from("conversations").update({ is_favorite: !conv.is_favorite }).eq("id", conversationId);
    await fetchConversations();
  }, [conversations, fetchConversations]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    await supabase.from("conversations").delete().eq("id", conversationId);
    await fetchConversations();
  }, [fetchConversations]);

  const loadMessages = useCallback(async (conversationId: string): Promise<ConversationMessage[]> => {
    const { data, error } = await supabase
      .from("conversation_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data as ConversationMessage[];
  }, []);

  const saveMessage = useCallback(async (conversationId: string, role: "user" | "assistant", content: string) => {
    await supabase.from("conversation_messages").insert({ conversation_id: conversationId, role, content });
  }, []);

  const searchConversations = useCallback(async (query: string): Promise<Conversation[]> => {
    if (!profileId || !query.trim()) return conversations;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    // Search in conversation titles
    const { data: titleMatches } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("profile_id", profileId)
      .ilike("title", `%${query}%`)
      .order("updated_at", { ascending: false });

    // Search in message contents
    const { data: msgMatches } = await supabase
      .from("conversation_messages")
      .select("conversation_id")
      .ilike("content", `%${query}%`);

    const msgConvIds = new Set((msgMatches || []).map(m => m.conversation_id));
    
    const allIds = new Set([
      ...(titleMatches || []).map(c => c.id),
      ...msgConvIds,
    ]);

    // Filter from already loaded or fetch
    if (allIds.size === 0) return [];
    
    const { data: results } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("profile_id", profileId)
      .in("id", Array.from(allIds))
      .order("updated_at", { ascending: false });

    return (results || []) as Conversation[];
  }, [profileId, conversations]);

  // Group conversations by date
  const groupedConversations = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const groups: { label: string; items: Conversation[] }[] = [
      { label: "Hoje", items: [] },
      { label: "Últimos 7 dias", items: [] },
      { label: "Anteriores", items: [] },
    ];

    conversations.forEach(conv => {
      const d = new Date(conv.updated_at);
      if (d >= today) groups[0].items.push(conv);
      else if (d >= weekAgo) groups[1].items.push(conv);
      else groups[2].items.push(conv);
    });

    return groups.filter(g => g.items.length > 0);
  }, [conversations]);

  return {
    conversations,
    loading,
    groupedConversations,
    createConversation,
    updateTitle,
    toggleFavorite,
    deleteConversation,
    loadMessages,
    saveMessage,
    searchConversations,
    fetchConversations,
  };
}
