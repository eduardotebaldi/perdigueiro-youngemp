
DROP FUNCTION IF EXISTS public.get_user_emails(uuid[]);
DROP FUNCTION IF EXISTS public.get_all_users_with_roles();

CREATE FUNCTION public.get_user_emails(user_ids uuid[])
RETURNS TABLE(id uuid, email text, nome text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT au.id, au.email::text, COALESCE(up.nome, '') as nome
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON up.user_id = au.id
  WHERE au.id = ANY(user_ids);
END;
$$;

CREATE FUNCTION public.get_all_users_with_roles()
RETURNS TABLE(id uuid, email text, role app_role, created_at timestamp with time zone, nome text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem listar usuários.';
  END IF;

  RETURN QUERY
  SELECT 
    au.id,
    au.email::text,
    COALESCE(ur.role, 'user'::app_role) as role,
    au.created_at,
    COALESCE(up.nome, '') as nome
  FROM auth.users au
  LEFT JOIN public.user_roles ur ON ur.user_id = au.id
  LEFT JOIN public.user_profiles up ON up.user_id = au.id
  ORDER BY au.created_at DESC;
END;
$$;
