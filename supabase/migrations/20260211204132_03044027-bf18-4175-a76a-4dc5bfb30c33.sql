
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  nome text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies (use IF NOT EXISTS pattern via DO block)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Todos autenticados podem ver perfis') THEN
    CREATE POLICY "Todos autenticados podem ver perfis" ON public.user_profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Admins podem gerenciar perfis') THEN
    CREATE POLICY "Admins podem gerenciar perfis" ON public.user_profiles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Usuários podem atualizar próprio perfil') THEN
    CREATE POLICY "Usuários podem atualizar próprio perfil" ON public.user_profiles FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;

-- Trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, nome)
  VALUES (NEW.id, '');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_profile();

-- Seed existing users
INSERT INTO public.user_profiles (user_id, nome)
SELECT id, '' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
