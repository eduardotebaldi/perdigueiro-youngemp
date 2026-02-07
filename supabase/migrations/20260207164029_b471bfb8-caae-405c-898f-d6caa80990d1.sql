-- Create a sequence for gleba numbers
CREATE SEQUENCE IF NOT EXISTS glebas_numero_seq START 1;

-- Add numero column with auto-generated values
ALTER TABLE public.glebas 
ADD COLUMN numero INTEGER UNIQUE DEFAULT nextval('glebas_numero_seq');

-- Set existing glebas to have sequential numbers based on creation date
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM public.glebas
)
UPDATE public.glebas g
SET numero = n.rn
FROM numbered n
WHERE g.id = n.id;

-- Update sequence to continue after the last number
SELECT setval('glebas_numero_seq', COALESCE((SELECT MAX(numero) FROM public.glebas), 0) + 1, false);