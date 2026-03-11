
-- Drop the existing admin-only delete policy
DROP POLICY IF EXISTS "Apenas admins podem excluir anexos" ON public.gleba_anexos;

-- Create new policy: users can delete their own anexos within 15 days, admins can delete any
CREATE POLICY "Usuários podem excluir anexos (15 dias) ou admins"
ON public.gleba_anexos
FOR DELETE
TO public
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (
    created_by = auth.uid()
    AND created_at > (now() - interval '15 days')
  )
);
