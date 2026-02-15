
-- =============================================
-- ITEM 2: Tabela de anexos para glebas
-- =============================================
CREATE TYPE public.tipo_anexo_gleba AS ENUM ('pesquisa_mercado', 'planilha_viabilidade', 'matricula_imovel');

CREATE TABLE public.gleba_anexos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gleba_id uuid NOT NULL REFERENCES public.glebas(id) ON DELETE CASCADE,
  tipo tipo_anexo_gleba NOT NULL,
  arquivo text NOT NULL,
  nome_arquivo text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid()
);

ALTER TABLE public.gleba_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver anexos" ON public.gleba_anexos
  FOR SELECT USING (true);

CREATE POLICY "Autenticados podem criar anexos" ON public.gleba_anexos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Autenticados podem atualizar anexos" ON public.gleba_anexos
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Apenas admins podem excluir anexos" ON public.gleba_anexos
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket for gleba attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('gleba-anexos', 'gleba-anexos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Autenticados podem fazer upload de anexos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'gleba-anexos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Autenticados podem ver anexos de glebas" ON storage.objects
  FOR SELECT USING (bucket_id = 'gleba-anexos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins podem excluir anexos de glebas" ON storage.objects
  FOR DELETE USING (bucket_id = 'gleba-anexos' AND has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- ITEM 3: Propostas - janela de 15 dias
-- =============================================

-- Drop existing restrictive policies for UPDATE and DELETE
DROP POLICY IF EXISTS "Usuários podem atualizar suas propostas ou admins" ON public.propostas;
DROP POLICY IF EXISTS "Apenas admins podem excluir propostas" ON public.propostas;

-- New UPDATE policy: admin always, or own + within 15 days
CREATE POLICY "Usuários podem atualizar propostas (15 dias) ou admins" ON public.propostas
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      created_by = auth.uid()
      AND created_at > (now() - interval '15 days')
    )
  );

-- New DELETE policy: admin always, or own + within 15 days
CREATE POLICY "Usuários podem excluir propostas (15 dias) ou admins" ON public.propostas
  FOR DELETE USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      created_by = auth.uid()
      AND created_at > (now() - interval '15 days')
    )
  );

-- =============================================
-- ITEM 4: Atividades - janela de 15 dias
-- =============================================

-- Drop existing restrictive policies for UPDATE and DELETE
DROP POLICY IF EXISTS "Usuários podem editar suas próprias atividades" ON public.atividades;
DROP POLICY IF EXISTS "Apenas admins podem excluir atividades" ON public.atividades;

-- New UPDATE policy: admin always, or own + within 15 days
CREATE POLICY "Usuários podem editar atividades (15 dias) ou admins" ON public.atividades
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      responsavel_id = auth.uid()
      AND created_at > (now() - interval '15 days')
    )
  );

-- New DELETE policy: admin always, or own + within 15 days
CREATE POLICY "Usuários podem excluir atividades (15 dias) ou admins" ON public.atividades
  FOR DELETE USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      responsavel_id = auth.uid()
      AND created_at > (now() - interval '15 days')
    )
  );
