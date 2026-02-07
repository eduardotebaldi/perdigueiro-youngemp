-- Create enum for aceita_permuta
CREATE TYPE public.permuta_status AS ENUM ('incerto', 'nao', 'sim');

-- Add new column with enum type
ALTER TABLE public.glebas ADD COLUMN aceita_permuta_new permuta_status DEFAULT 'incerto';

-- Migrate existing data
UPDATE public.glebas SET aceita_permuta_new = 
  CASE 
    WHEN aceita_permuta = true THEN 'sim'::permuta_status
    WHEN aceita_permuta = false THEN 'nao'::permuta_status
    ELSE 'incerto'::permuta_status
  END;

-- Drop old column and rename new one
ALTER TABLE public.glebas DROP COLUMN aceita_permuta;
ALTER TABLE public.glebas RENAME COLUMN aceita_permuta_new TO aceita_permuta;