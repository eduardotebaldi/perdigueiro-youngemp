-- Criar função RPC para admins obterem lista de usuários com roles
CREATE OR REPLACE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE (
  id uuid,
  email text,
  role app_role,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário solicitante é admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem listar usuários.';
  END IF;

  RETURN QUERY
  SELECT 
    au.id,
    au.email::text,
    COALESCE(ur.role, 'user'::app_role) as role,
    au.created_at
  FROM auth.users au
  LEFT JOIN public.user_roles ur ON ur.user_id = au.id
  ORDER BY au.created_at DESC;
END;
$$;

-- Dar permissão para usuários autenticados executarem a função
GRANT EXECUTE ON FUNCTION public.get_all_users_with_roles() TO authenticated;