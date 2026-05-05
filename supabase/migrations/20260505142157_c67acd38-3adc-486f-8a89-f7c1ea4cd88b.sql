
-- Allow any authenticated user to delete pesquisas
DROP POLICY IF EXISTS "Admin delete pesquisas_mercado" ON public.pesquisas_mercado;
CREATE POLICY "Authenticated delete pesquisas_mercado"
  ON public.pesquisas_mercado FOR DELETE TO authenticated USING (true);

-- Add image column to terrenos
ALTER TABLE public.pesquisa_mercado_terrenos
  ADD COLUMN IF NOT EXISTS imagem_url text;

-- Storage bucket for pesquisa images
INSERT INTO storage.buckets (id, name, public)
VALUES ('pesquisa-imagens', 'pesquisa-imagens', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read pesquisa-imagens"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pesquisa-imagens');

CREATE POLICY "Authenticated upload pesquisa-imagens"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pesquisa-imagens');

CREATE POLICY "Authenticated update pesquisa-imagens"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'pesquisa-imagens');

CREATE POLICY "Authenticated delete pesquisa-imagens"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'pesquisa-imagens');
