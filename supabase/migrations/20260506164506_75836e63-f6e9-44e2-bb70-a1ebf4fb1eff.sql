UPDATE public.glebas
SET status = 'informacoes_recebidas',
    comentarios = COALESCE(comentarios, '') || E'\n\nRemovido da etapa ''visita realizada'' pela reorganização das etapas.'
WHERE status = 'visita_realizada';