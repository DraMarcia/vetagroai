-- Tabela para histórico de ferramentas usadas
CREATE TABLE public.user_tool_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tool_name TEXT NOT NULL,
  tool_route TEXT NOT NULL,
  input_data JSONB,
  output_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para métricas produtivas do usuário
CREATE TABLE public.user_farm_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  metric_unit TEXT,
  category TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para preferências do usuário
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  preferred_segments TEXT[] DEFAULT '{}',
  profile_photo_url TEXT,
  farm_name TEXT,
  role_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para sugestões de ferramentas
CREATE TABLE public.tool_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  suggestion TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_tool_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_farm_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS for user_tool_history
CREATE POLICY "Users can view their own tool history" 
ON public.user_tool_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tool history" 
ON public.user_tool_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS for user_farm_metrics
CREATE POLICY "Users can view their own metrics" 
ON public.user_farm_metrics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metrics" 
ON public.user_farm_metrics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metrics" 
ON public.user_farm_metrics 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own metrics" 
ON public.user_farm_metrics 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS for user_preferences
CREATE POLICY "Users can view their own preferences" 
ON public.user_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" 
ON public.user_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON public.user_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS for tool_suggestions (anyone can insert, only own can view)
CREATE POLICY "Anyone can submit suggestions" 
ON public.tool_suggestions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own suggestions" 
ON public.tool_suggestions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_farm_metrics_updated_at
BEFORE UPDATE ON public.user_farm_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();