-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Add schedule columns to report_configs
ALTER TABLE public.report_configs
  ADD COLUMN IF NOT EXISTS cron_expression text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cron_ativo boolean DEFAULT false;