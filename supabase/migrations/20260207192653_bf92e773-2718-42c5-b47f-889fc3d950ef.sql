-- Adicionar coluna de população às cidades
ALTER TABLE public.cidades ADD COLUMN IF NOT EXISTS populacao integer;

-- Adicionar coluna de código IBGE para referência
ALTER TABLE public.cidades ADD COLUMN IF NOT EXISTS codigo_ibge integer;