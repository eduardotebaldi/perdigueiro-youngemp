INSERT INTO public.report_configs (report_key, nome, descricao, ativo)
VALUES (
  'weekly_directorate',
  'Relatório Semanal - Diretoria',
  'Glebas em Proposta Enviada e Visita Realizada com detalhes de propostas, histórico de atividades e meta do semestre.',
  false
)
ON CONFLICT DO NOTHING;