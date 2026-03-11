
-- Report configurations table
CREATE TABLE public.report_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_key text NOT NULL UNIQUE,
  nome text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  ativo boolean NOT NULL DEFAULT false,
  destinatarios uuid[] NOT NULL DEFAULT '{}',
  ultimo_envio timestamp with time zone,
  ultimo_relatorio_html text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.report_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas admins podem ver relatórios" ON public.report_configs
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Apenas admins podem gerenciar relatórios" ON public.report_configs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger updated_at
CREATE TRIGGER update_report_configs_updated_at
  BEFORE UPDATE ON public.report_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
