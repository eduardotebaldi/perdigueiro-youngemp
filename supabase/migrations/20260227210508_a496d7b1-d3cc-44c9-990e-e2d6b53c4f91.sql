
-- Add cover image column to glebas
ALTER TABLE public.glebas ADD COLUMN IF NOT EXISTS imagem_capa text;

-- Create storage bucket for gleba images
INSERT INTO storage.buckets (id, name, public)
VALUES ('gleba-imagens', 'gleba-imagens', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for gleba images
CREATE POLICY "Authenticated users can upload gleba images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'gleba-imagens' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view gleba images"
ON storage.objects FOR SELECT
USING (bucket_id = 'gleba-imagens');

CREATE POLICY "Authenticated users can update gleba images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'gleba-imagens' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete gleba images"
ON storage.objects FOR DELETE
USING (bucket_id = 'gleba-imagens' AND auth.uid() IS NOT NULL);
