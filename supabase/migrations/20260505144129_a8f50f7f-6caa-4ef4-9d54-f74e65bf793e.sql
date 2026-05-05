CREATE TABLE public.gleba_status_descricoes (
  status text PRIMARY KEY,
  descricao text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.gleba_status_descricoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read status descriptions"
ON public.gleba_status_descricoes FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Admins can insert status descriptions"
ON public.gleba_status_descricoes FOR INSERT
TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update status descriptions"
ON public.gleba_status_descricoes FOR UPDATE
TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete status descriptions"
ON public.gleba_status_descricoes FOR DELETE
TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_gleba_status_descricoes_updated_at
BEFORE UPDATE ON public.gleba_status_descricoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();