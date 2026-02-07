-- ===============================
-- 1. ENUM E TABELA DE ROLES
-- ===============================

-- Enum para roles de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Tabela de roles
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função security definer para verificar role (evita recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies para user_roles
CREATE POLICY "Usuários podem ver seus próprios roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Apenas admins podem gerenciar roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ===============================
-- 2. ENUM DE STATUS DA GLEBA
-- ===============================

CREATE TYPE public.gleba_status AS ENUM (
    'identificada',
    'informacoes_recebidas',
    'visita_realizada',
    'proposta_enviada',
    'protocolo_assinado',
    'descartada',
    'proposta_recusada',
    'negocio_fechado',
    'standby'
);

-- ===============================
-- 3. TABELA DE MOTIVOS DE DESCARTE
-- ===============================

CREATE TABLE public.motivos_descarte (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL UNIQUE,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.motivos_descarte ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver motivos"
ON public.motivos_descarte FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Apenas admins podem gerenciar motivos"
ON public.motivos_descarte FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ===============================
-- 4. TABELA DE CIDADES
-- ===============================

CREATE TABLE public.cidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL UNIQUE,
    planos_diretores TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver cidades"
ON public.cidades FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Todos autenticados podem criar/editar cidades"
ON public.cidades FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Todos autenticados podem atualizar cidades"
ON public.cidades FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Apenas admins podem excluir cidades"
ON public.cidades FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ===============================
-- 5. TABELA DE IMOBILIÁRIAS
-- ===============================

CREATE TABLE public.imobiliarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    contato_nome TEXT,
    telefone TEXT,
    link_social TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.imobiliarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver imobiliárias"
ON public.imobiliarias FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Todos autenticados podem criar imobiliárias"
ON public.imobiliarias FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Todos autenticados podem atualizar imobiliárias"
ON public.imobiliarias FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Apenas admins podem excluir imobiliárias"
ON public.imobiliarias FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ===============================
-- 6. TABELA DE GLEBAS (PRINCIPAL)
-- ===============================

CREATE TABLE public.glebas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apelido TEXT NOT NULL,
    cidade_id UUID REFERENCES public.cidades(id) ON DELETE SET NULL,
    tamanho_m2 NUMERIC,
    proprietario_nome TEXT,
    imobiliaria_id UUID REFERENCES public.imobiliarias(id) ON DELETE SET NULL,
    preco NUMERIC,
    percentual_permuta NUMERIC,
    aceita_permuta BOOLEAN DEFAULT false,
    zona_plano_diretor TEXT,
    tamanho_lote_minimo NUMERIC,
    responsavel_analise UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status gleba_status NOT NULL DEFAULT 'identificada',
    prioridade BOOLEAN NOT NULL DEFAULT false,
    comentarios TEXT,
    data_visita DATE,
    motivo_descarte_id UUID REFERENCES public.motivos_descarte(id) ON DELETE SET NULL,
    descricao_descarte TEXT,
    standby_motivo TEXT,
    standby_inicio DATE,
    arquivo_protocolo TEXT,
    arquivo_contrato TEXT,
    arquivo_kmz TEXT,
    poligono_geojson JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.glebas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver glebas"
ON public.glebas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Todos autenticados podem criar glebas"
ON public.glebas FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Todos autenticados podem atualizar glebas"
ON public.glebas FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Apenas admins podem excluir glebas"
ON public.glebas FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ===============================
-- 7. TABELA DE PROPOSTAS
-- ===============================

CREATE TABLE public.propostas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gleba_id UUID REFERENCES public.glebas(id) ON DELETE CASCADE NOT NULL,
    data_proposta DATE NOT NULL DEFAULT CURRENT_DATE,
    descricao TEXT,
    arquivo_carta TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver propostas"
ON public.propostas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Todos autenticados podem criar propostas"
ON public.propostas FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Todos autenticados podem atualizar propostas"
ON public.propostas FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Apenas admins podem excluir propostas"
ON public.propostas FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ===============================
-- 8. TABELA DE ATIVIDADES
-- ===============================

CREATE TABLE public.atividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gleba_id UUID REFERENCES public.glebas(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos autenticados podem ver atividades"
ON public.atividades FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Todos autenticados podem criar atividades"
ON public.atividades FOR INSERT
TO authenticated
WITH CHECK (responsavel_id = auth.uid());

CREATE POLICY "Usuários podem editar suas próprias atividades"
ON public.atividades FOR UPDATE
TO authenticated
USING (responsavel_id = auth.uid());

CREATE POLICY "Apenas admins podem excluir atividades"
ON public.atividades FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ===============================
-- 9. FUNÇÃO PARA ATUALIZAR updated_at
-- ===============================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_cidades_updated_at
    BEFORE UPDATE ON public.cidades
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_imobiliarias_updated_at
    BEFORE UPDATE ON public.imobiliarias
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_glebas_updated_at
    BEFORE UPDATE ON public.glebas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_propostas_updated_at
    BEFORE UPDATE ON public.propostas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ===============================
-- 10. INSERIR MOTIVOS DE DESCARTE PADRÃO
-- ===============================

INSERT INTO public.motivos_descarte (nome) VALUES
    ('Preço inviável'),
    ('Localização inadequada'),
    ('Problemas documentais'),
    ('Área insuficiente'),
    ('Topografia desfavorável'),
    ('Zoneamento incompatível'),
    ('Proprietário desistiu'),
    ('Outro');