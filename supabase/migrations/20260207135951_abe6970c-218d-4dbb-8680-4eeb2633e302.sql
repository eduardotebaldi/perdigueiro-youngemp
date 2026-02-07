-- Adicionar colunas para sincronização com Google Earth/Drive
ALTER TABLE public.glebas
ADD COLUMN IF NOT EXISTS kml_id TEXT,
ADD COLUMN IF NOT EXISTS google_drive_file_id TEXT,
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE;

-- Criar índice único para evitar duplicatas na importação
CREATE UNIQUE INDEX IF NOT EXISTS idx_glebas_kml_id ON public.glebas (kml_id) WHERE kml_id IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.glebas.kml_id IS 'ID único do Placemark vindo do KML para evitar duplicatas';
COMMENT ON COLUMN public.glebas.google_drive_file_id IS 'ID do arquivo no Google Drive de onde a gleba foi importada';
COMMENT ON COLUMN public.glebas.last_sync_at IS 'Data da última sincronização via Google Drive';