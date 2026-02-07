-- Remover política restritiva e criar políticas separadas
DROP POLICY IF EXISTS "Apenas admins podem gerenciar configurações" ON public.system_config;

-- Admins podem inserir
CREATE POLICY "Admins podem inserir configurações"
ON public.system_config FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins podem atualizar
CREATE POLICY "Admins podem atualizar configurações"
ON public.system_config FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins podem deletar
CREATE POLICY "Admins podem deletar configurações"
ON public.system_config FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));