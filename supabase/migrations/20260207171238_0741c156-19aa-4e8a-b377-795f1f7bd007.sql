-- Fix remaining permissive UPDATE policies

-- Fix glebas UPDATE - require authentication
DROP POLICY IF EXISTS "Todos autenticados podem atualizar glebas" ON public.glebas;

CREATE POLICY "Autenticados podem atualizar glebas"
ON public.glebas
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Fix imobiliarias UPDATE - require authentication  
DROP POLICY IF EXISTS "Todos autenticados podem atualizar imobiliárias" ON public.imobiliarias;

CREATE POLICY "Autenticados podem atualizar imobiliárias"
ON public.imobiliarias
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Fix cidades UPDATE - require authentication
DROP POLICY IF EXISTS "Todos autenticados podem atualizar cidades" ON public.cidades;

CREATE POLICY "Autenticados podem atualizar cidades"
ON public.cidades
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Fix glebas INSERT - require authentication
DROP POLICY IF EXISTS "Todos autenticados podem criar glebas" ON public.glebas;

CREATE POLICY "Autenticados podem criar glebas"
ON public.glebas
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix imobiliarias INSERT - require authentication
DROP POLICY IF EXISTS "Todos autenticados podem criar imobiliárias" ON public.imobiliarias;

CREATE POLICY "Autenticados podem criar imobiliárias"
ON public.imobiliarias
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);