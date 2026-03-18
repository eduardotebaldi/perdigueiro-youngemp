CREATE TABLE public.dashboard_comunicados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conteudo text NOT NULL,
  autor_id uuid NOT NULL,
  autor_nome text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dashboard_comunicados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver comunicados"
ON public.dashboard_comunicados FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Apenas admins podem criar comunicados"
ON public.dashboard_comunicados FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem editar comunicados"
ON public.dashboard_comunicados FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Apenas admins podem excluir comunicados"
ON public.dashboard_comunicados FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));