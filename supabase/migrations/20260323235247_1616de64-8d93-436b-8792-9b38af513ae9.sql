
-- Conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nova conversa',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Messages table
CREATE TABLE public.conversation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Profile memory table (contextual memory per profile)
CREATE TABLE public.profile_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id TEXT NOT NULL,
  memory_key TEXT NOT NULL,
  memory_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, profile_id, memory_key)
);

-- Reports placeholder table
CREATE TABLE public.conversation_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  profile_id TEXT NOT NULL,
  title TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'tecnico',
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_reports ENABLE ROW LEVEL SECURITY;

-- RLS: conversations
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS: conversation_messages (via conversation ownership)
CREATE POLICY "Users can view own messages" ON public.conversation_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can insert own messages" ON public.conversation_messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can delete own messages" ON public.conversation_messages FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

-- RLS: profile_memory
CREATE POLICY "Users can manage own memory" ON public.profile_memory FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS: conversation_reports
CREATE POLICY "Users can manage own reports" ON public.conversation_reports FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_conversations_user_profile ON public.conversations(user_id, profile_id, created_at DESC);
CREATE INDEX idx_conversation_messages_conv ON public.conversation_messages(conversation_id, created_at);
CREATE INDEX idx_profile_memory_user ON public.profile_memory(user_id, profile_id);

-- Enable realtime for conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Updated_at trigger for conversations
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profile_memory_updated_at BEFORE UPDATE ON public.profile_memory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
