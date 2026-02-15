
-- Step 1: Remap glebas to the oldest (keeper) imobiliaria per name
WITH keepers AS (
  SELECT DISTINCT ON (nome) id, nome
  FROM imobiliarias
  ORDER BY nome, created_at ASC
),
remaps AS (
  SELECT i.id as dup_id, k.id as keeper_id
  FROM imobiliarias i
  JOIN keepers k ON k.nome = i.nome
  WHERE i.id != k.id
)
UPDATE glebas g
SET imobiliaria_id = r.keeper_id
FROM remaps r
WHERE g.imobiliaria_id = r.dup_id;

-- Step 2: Delete duplicate imobiliarias (keep the oldest per name)
DELETE FROM imobiliarias
WHERE id NOT IN (
  SELECT DISTINCT ON (nome) id
  FROM imobiliarias
  ORDER BY nome, created_at ASC
);

-- Step 3: Add unique constraint to prevent future duplicates
ALTER TABLE imobiliarias ADD CONSTRAINT imobiliarias_nome_unique UNIQUE (nome);
