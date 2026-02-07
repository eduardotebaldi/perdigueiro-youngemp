-- ===============================
-- STORAGE BUCKETS
-- ===============================

-- Bucket para arquivos KMZ das glebas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('glebas-kmz', 'glebas-kmz', true);

-- Bucket para protocolos assinados
INSERT INTO storage.buckets (id, name, public) 
VALUES ('protocolos', 'protocolos', false);

-- Bucket para contratos finalizados
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contratos', 'contratos', false);

-- Bucket para cartas de proposta
INSERT INTO storage.buckets (id, name, public) 
VALUES ('propostas', 'propostas', false);

-- Bucket para planos diretores das cidades
INSERT INTO storage.buckets (id, name, public) 
VALUES ('planos-diretores', 'planos-diretores', true);

-- ===============================
-- RLS POLICIES PARA STORAGE
-- ===============================

-- KMZ: Todos autenticados podem ver e fazer upload
CREATE POLICY "KMZ são públicos para leitura"
ON storage.objects FOR SELECT
USING (bucket_id = 'glebas-kmz');

CREATE POLICY "Autenticados podem fazer upload de KMZ"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'glebas-kmz');

CREATE POLICY "Autenticados podem atualizar KMZ"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'glebas-kmz');

CREATE POLICY "Admins podem deletar KMZ"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'glebas-kmz' AND public.has_role(auth.uid(), 'admin'));

-- Protocolos: Apenas autenticados podem acessar
CREATE POLICY "Autenticados podem ver protocolos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'protocolos');

CREATE POLICY "Autenticados podem fazer upload de protocolos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'protocolos');

CREATE POLICY "Autenticados podem atualizar protocolos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'protocolos');

CREATE POLICY "Admins podem deletar protocolos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'protocolos' AND public.has_role(auth.uid(), 'admin'));

-- Contratos: Apenas autenticados podem acessar
CREATE POLICY "Autenticados podem ver contratos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'contratos');

CREATE POLICY "Autenticados podem fazer upload de contratos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contratos');

CREATE POLICY "Autenticados podem atualizar contratos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'contratos');

CREATE POLICY "Admins podem deletar contratos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'contratos' AND public.has_role(auth.uid(), 'admin'));

-- Propostas: Apenas autenticados podem acessar
CREATE POLICY "Autenticados podem ver propostas"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'propostas');

CREATE POLICY "Autenticados podem fazer upload de propostas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'propostas');

CREATE POLICY "Autenticados podem atualizar propostas"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'propostas');

CREATE POLICY "Admins podem deletar propostas"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'propostas' AND public.has_role(auth.uid(), 'admin'));

-- Planos Diretores: Públicos para leitura
CREATE POLICY "Planos diretores são públicos"
ON storage.objects FOR SELECT
USING (bucket_id = 'planos-diretores');

CREATE POLICY "Autenticados podem fazer upload de planos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'planos-diretores');

CREATE POLICY "Autenticados podem atualizar planos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'planos-diretores');

CREATE POLICY "Admins podem deletar planos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'planos-diretores' AND public.has_role(auth.uid(), 'admin'));