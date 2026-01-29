-- Corrigir a view tool_suggestions_admin_view para acesso restrito a admins
-- PostgreSQL views não suportam RLS diretamente, então precisamos usar uma abordagem diferente

-- 1. Revogar acesso SELECT direto da view para usuários autenticados
REVOKE SELECT ON public.tool_suggestions_admin_view FROM authenticated;

-- 2. Criar uma função SECURITY DEFINER que verifica se o usuário é admin antes de retornar dados
CREATE OR REPLACE FUNCTION public.get_admin_tool_suggestions()
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  category text,
  status text,
  suggestion text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário é admin
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado: somente administradores podem acessar esta função';
  END IF;
  
  -- Retornar os dados da view para admins
  RETURN QUERY SELECT 
    v.id,
    v.created_at,
    v.category,
    v.status,
    v.suggestion
  FROM public.tool_suggestions_admin_view v;
END;
$$;

-- 3. Conceder permissão de execução apenas para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_admin_tool_suggestions() TO authenticated;