
-- Tipos de Atividade
CREATE TABLE public.tipos_atividade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.tipos_atividade ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read tipos_atividade" ON public.tipos_atividade FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage tipos_atividade" ON public.tipos_atividade FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.tipos_atividade (nome) VALUES
  ('Reunião presencial'), ('Reunião por vídeo'), ('Visita na gleba'), ('Ligação telefônica');

ALTER TABLE public.atividades ADD COLUMN tipo_atividade_id uuid REFERENCES public.tipos_atividade(id);

-- Tipos de Arquivo
CREATE TABLE public.tipos_arquivo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.tipos_arquivo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read tipos_arquivo" ON public.tipos_arquivo FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage tipos_arquivo" ON public.tipos_arquivo FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.tipos_arquivo (nome) VALUES
  ('Pesquisa de Mercado'), ('Planilha de Viabilidade'), ('Matrícula do Imóvel');

ALTER TABLE public.gleba_anexos ADD COLUMN tipo_arquivo_id uuid REFERENCES public.tipos_arquivo(id);

-- Pesquisas de Mercado
CREATE TABLE public.pesquisas_mercado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cidade_id uuid REFERENCES public.cidades(id),
  data_pesquisa date NOT NULL DEFAULT CURRENT_DATE,
  observacoes text,
  kmz_file text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.pesquisas_mercado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read pesquisas_mercado" ON public.pesquisas_mercado FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert pesquisas_mercado" ON public.pesquisas_mercado FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update pesquisas_mercado" ON public.pesquisas_mercado FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin delete pesquisas_mercado" ON public.pesquisas_mercado FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.pesquisa_mercado_terrenos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pesquisa_id uuid REFERENCES public.pesquisas_mercado(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  preco numeric,
  tamanho_m2 numeric,
  condicoes_pagamento text,
  tipo_terreno text,
  observacoes text,
  url_anuncio text,
  latitude numeric,
  longitude numeric,
  placemark_name text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.pesquisa_mercado_terrenos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read pesquisa_terrenos" ON public.pesquisa_mercado_terrenos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert pesquisa_terrenos" ON public.pesquisa_mercado_terrenos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update pesquisa_terrenos" ON public.pesquisa_mercado_terrenos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete pesquisa_terrenos" ON public.pesquisa_mercado_terrenos FOR DELETE TO authenticated USING (true);

-- Google Drive folder ID na glebas
ALTER TABLE public.glebas ADD COLUMN google_drive_folder_id text;
