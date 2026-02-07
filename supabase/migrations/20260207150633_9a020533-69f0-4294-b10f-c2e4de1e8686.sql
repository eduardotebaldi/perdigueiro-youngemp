-- Atualizar role do usuário para admin
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = 'fb37f75d-124d-43d0-bf79-c49c6e01720f';