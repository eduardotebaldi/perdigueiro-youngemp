
ALTER TYPE public.gleba_status ADD VALUE IF NOT EXISTS 'analise_interna_realizada';
ALTER TYPE public.gleba_status ADD VALUE IF NOT EXISTS 'minuta_enviada';

UPDATE public.glebas
SET status = 'informacoes_recebidas',
    comentarios = CASE
      WHEN comentarios IS NULL OR comentarios = '' THEN 'Removido da etapa ''visita realizada'' pela reorganização das etapas.'
      ELSE comentarios || E'\n\nRemovido da etapa ''visita realizada'' pela reorganização das etapas.'
    END
WHERE status = 'visita_realizada';
