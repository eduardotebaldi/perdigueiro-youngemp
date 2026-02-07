-- Add new fields to propostas table
ALTER TABLE public.propostas 
ADD COLUMN IF NOT EXISTS preco_ha numeric NULL,
ADD COLUMN IF NOT EXISTS percentual_proposto numeric NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.propostas.preco_ha IS 'Preço por hectare em R$ (para propostas de compra)';
COMMENT ON COLUMN public.propostas.percentual_proposto IS 'Percentual proposto (para propostas de parceria/permuta)';