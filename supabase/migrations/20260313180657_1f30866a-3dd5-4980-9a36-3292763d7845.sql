-- Schedule weekly report: Novos Negócios (Monday 08:00 BRT = 11:00 UTC)
SELECT cron.schedule(
  'weekly-report-new-business',
  '0 11 * * 1',
  $$
  SELECT net.http_post(
    url:='https://vvtympzatclvjaqucebr.supabase.co/functions/v1/generate-weekly-report',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dHltcHphdGNsdmphcXVjZWJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NTI1NzYsImV4cCI6MjA4NjAyODU3Nn0.C8vWcljx6veAQ0hCi0ms7Ixm6NxhSdWBDeRgUy2Kz50"}'::jsonb,
    body:='{"sendEmail": true, "report_key": "weekly_new_business"}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule weekly report: Diretoria (Monday 08:00 BRT = 11:00 UTC)
SELECT cron.schedule(
  'weekly-report-directorate',
  '0 11 * * 1',
  $$
  SELECT net.http_post(
    url:='https://vvtympzatclvjaqucebr.supabase.co/functions/v1/generate-weekly-report',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dHltcHphdGNsdmphcXVjZWJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NTI1NzYsImV4cCI6MjA4NjAyODU3Nn0.C8vWcljx6veAQ0hCi0ms7Ixm6NxhSdWBDeRgUy2Kz50"}'::jsonb,
    body:='{"sendEmail": true, "report_key": "weekly_directorate"}'::jsonb
  ) AS request_id;
  $$
);

-- Update report configs with schedule info
UPDATE public.report_configs SET cron_expression = '0 11 * * 1', cron_ativo = true WHERE report_key = 'weekly_new_business';
UPDATE public.report_configs SET cron_expression = '0 11 * * 1', cron_ativo = true WHERE report_key = 'weekly_directorate';