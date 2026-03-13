import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Loader2, Eye, Send, ChevronDown, Mail, Clock, CalendarClock } from "lucide-react";
import { toast } from "sonner";

function describeCron(expr: string | null): string {
  if (!expr) return "Sem agendamento";
  if (expr === "0 11 * * 1") return "Toda segunda-feira às 08:00 (BRT)";
  const parts = expr.split(" ");
  if (parts.length === 5) {
    const [min, hour] = parts;
    const brHour = ((parseInt(hour) - 3 + 24) % 24).toString().padStart(2, "0");
    return `Cron: ${brHour}:${min.padStart(2, "0")} (BRT) — ${expr}`;
  }
  return expr;
}

interface ReportConfig {
  id: string;
  report_key: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  destinatarios: string[];
  ultimo_envio: string | null;
  ultimo_relatorio_html: string | null;
  cron_expression: string | null;
  cron_ativo: boolean;
}

interface UserWithRole {
  id: string;
  email: string;
  nome: string;
  role: string;
}

export function ReportConfigCard() {
  const queryClient = useQueryClient();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [generatingReport, setGeneratingReport] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const { data: reports, isLoading } = useQuery({
    queryKey: ["report-configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_configs")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as ReportConfig[];
    },
  });

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_all_users_with_roles" as any);
      if (error) throw error;
      return (data || []) as UserWithRole[];
    },
  });

  const updateReport = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ReportConfig> }) => {
      const { error } = await supabase
        .from("report_configs")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report-configs"] });
    },
    onError: () => {
      toast.error("Erro ao atualizar relatório");
    },
  });

  const handleToggleAtivo = (report: ReportConfig) => {
    updateReport.mutate({
      id: report.id,
      updates: { ativo: !report.ativo },
    });
  };

  const handleToggleDestinatario = (report: ReportConfig, userId: string) => {
    const current = report.destinatarios || [];
    const updated = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId];
    updateReport.mutate({
      id: report.id,
      updates: { destinatarios: updated } as any,
    });
  };

  const handleViewLastReport = (report: ReportConfig) => {
    if (report.ultimo_relatorio_html) {
      setPreviewHtml(report.ultimo_relatorio_html);
      setPreviewOpen(true);
    }
  };

  const handleGenerateNow = async (report: ReportConfig) => {
    setGeneratingReport(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-weekly-report", {
        body: { force: true, report_key: report.report_key },
      });
      if (error) throw error;
      if (data?.html) {
        setPreviewHtml(data.html);
        setPreviewOpen(true);
        queryClient.invalidateQueries({ queryKey: ["report-configs"] });
        toast.success("Relatório gerado com sucesso!");
      } else if (data?.message) {
        toast.info(data.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar relatório");
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleSendEmail = async (report: ReportConfig) => {
    if (!report.destinatarios || report.destinatarios.length === 0) {
      toast.error("Nenhum destinatário configurado");
      return;
    }
    setSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-weekly-report", {
        body: { force: true, sendEmail: true, report_key: report.report_key },
      });
      if (error) throw error;
      if (data?.emailResult) {
        const { sent, failed, message } = data.emailResult;
        if (message) {
          toast.info(message);
        } else if (sent > 0 && failed.length === 0) {
          toast.success(`Relatório enviado para ${sent} destinatário(s)!`);
        } else if (sent > 0 && failed.length > 0) {
          toast.warning(`Enviado para ${sent}, falhou para: ${failed.join(", ")}`);
        } else {
          toast.error(`Falha ao enviar: ${failed.join(", ")}`);
        }
        queryClient.invalidateQueries({ queryKey: ["report-configs"] });
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar relatório");
    } finally {
      setSendingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Collapsible defaultOpen>
        <Card>
          <CardHeader>
            <CollapsibleTrigger className="w-full text-left group">
              <CardTitle className="flex items-center gap-2">
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                <FileText className="h-5 w-5" />
                Relatórios
              </CardTitle>
              <CardDescription className="ml-10">
                Configure os relatórios automáticos do sistema
              </CardDescription>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6">
          {(!reports || reports.length === 0) ? (
            <p className="text-sm text-muted-foreground">Nenhum relatório configurado.</p>
          ) : (
            reports.map((report) => (
              <Collapsible key={report.id} defaultOpen={false}>
                <div className="border rounded-lg p-4 space-y-4">
                  {/* Header with toggle */}
                  <div className="flex items-start justify-between gap-4">
                    <CollapsibleTrigger className="flex-1 text-left group">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                        <h3 className="font-semibold text-sm">{report.nome}</h3>
                        <Badge variant={report.ativo ? "default" : "secondary"} className="text-xs">
                          {report.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 ml-6 mt-1">
                        {report.cron_ativo && report.cron_expression ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full px-2.5 py-1">
                            <CalendarClock className="h-3.5 w-3.5" />
                            <span>{describeCron(report.cron_expression)}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-full px-2.5 py-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Sem envio automático</span>
                          </div>
                        )}
                        {report.ultimo_envio && (
                          <span className="text-xs text-muted-foreground">
                            Último envio: {new Date(report.ultimo_envio).toLocaleString("pt-BR")}
                          </span>
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <Switch
                      checked={report.ativo}
                      onCheckedChange={() => handleToggleAtivo(report)}
                    />
                  </div>

                  <CollapsibleContent className="space-y-4">
                    {/* Recipients */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Destinatários</Label>
                      <div className="flex flex-wrap gap-2">
                        {users?.map((user) => (
                          <label
                            key={user.id}
                            className="flex items-center gap-1.5 text-sm cursor-pointer bg-muted/50 rounded-md px-2 py-1 hover:bg-muted transition-colors"
                          >
                            <Checkbox
                              checked={(report.destinatarios || []).includes(user.id)}
                              onCheckedChange={() => handleToggleDestinatario(report, user.id)}
                            />
                            <span>{user.nome || user.email}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateNow(report)}
                        disabled={generatingReport}
                      >
                        {generatingReport ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Gerar Agora
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendEmail(report)}
                        disabled={sendingEmail}
                      >
                        {sendingEmail ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="mr-2 h-4 w-4" />
                        )}
                        Enviar por E-mail
                      </Button>
                      {report.ultimo_relatorio_html && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewLastReport(report)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Último Relatório
                        </Button>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))
          )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Report Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Pré-visualização do Relatório</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh]">
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
