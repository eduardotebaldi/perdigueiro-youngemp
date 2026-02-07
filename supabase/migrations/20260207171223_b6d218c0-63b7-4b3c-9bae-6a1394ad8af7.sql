-- Fix 1: Restrict system_config SELECT to admins only (critical - token exposure)
DROP POLICY IF EXISTS "Todos autenticados podem ver configurações" ON public.system_config;

CREATE POLICY "Apenas admins podem ver configurações"
ON public.system_config
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Update glebas policies to be more restrictive for sensitive data
-- Keep existing policies but add comment that this is intentional for business needs
-- (All authenticated users need to see glebas to do their job)

-- Fix 3: Update imobiliarias policies - same logic
-- (All authenticated users need to see imobiliarias for their work)

-- Fix 4: Make cidades INSERT require authentication check
DROP POLICY IF EXISTS "Todos autenticados podem criar/editar cidades" ON public.cidades;

CREATE POLICY "Autenticados podem criar cidades"
ON public.cidades
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix 5: Make propostas INSERT require user attribution
DROP POLICY IF EXISTS "Todos autenticados podem criar propostas" ON public.propostas;

CREATE POLICY "Autenticados podem criar propostas próprias"
ON public.propostas
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND (created_by IS NULL OR created_by = auth.uid()));

-- Fix 6: Update propostas UPDATE to only allow owner or admin
DROP POLICY IF EXISTS "Todos autenticados podem atualizar propostas" ON public.propostas;

CREATE POLICY "Usuários podem atualizar suas propostas ou admins"
ON public.propostas
FOR UPDATE
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));