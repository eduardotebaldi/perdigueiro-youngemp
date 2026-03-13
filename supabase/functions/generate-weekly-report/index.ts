import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReportRecipient {
  id: string;
  email: string;
  nome: string;
}

async function sendEmailsViaResend(
  html: string,
  recipients: ReportRecipient[],
  subject: string
): Promise<{ sent: number; failed: string[] }> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY não configurada");
  }

  const failed: string[] = [];
  let sent = 0;

  for (const recipient of recipients) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Perdigueiro <onboarding@resend.dev>",
          to: [recipient.email],
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error(`Falha ao enviar para ${recipient.email}:`, errBody);
        failed.push(recipient.email);
      } else {
        await res.text();
        sent++;
      }
    } catch (err) {
      console.error(`Erro ao enviar para ${recipient.email}:`, err);
      failed.push(recipient.email);
    }
  }

  return { sent, failed };
}

async function buildReport(supabase: any) {
  const now = new Date();

  // 1. Meta do semestre e progresso
  const currentMonth = now.getMonth();
  const semesterStartMonth = currentMonth < 6 ? 0 : 6;
  const semesterEndMonth = semesterStartMonth + 5;
  const semesterStart = new Date(now.getFullYear(), semesterStartMonth, 1);
  const semesterEnd = new Date(now.getFullYear(), semesterEndMonth + 1, 0);
  const cutoffDate = new Date("2026-03-10T00:00:00");
  const effectiveStart = semesterStart > cutoffDate ? semesterStart : cutoffDate;

  const weeksLeft = Math.ceil(
    (semesterEnd.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );

  const { data: negociosSemestre } = await supabase
    .from("glebas")
    .select("id")
    .eq("status", "negocio_fechado")
    .gte("updated_at", effectiveStart.toISOString());

  const negociosCount = negociosSemestre?.length || 0;

  // 2. Áreas sem atualização (10 dias)
  const tenDaysAgo = new Date(now);
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  const { data: recentActivities } = await supabase
    .from("atividades")
    .select("gleba_id")
    .gte("created_at", tenDaysAgo.toISOString());

  const activeGlebaIds = new Set(
    (recentActivities || []).map((a: any) => a.gleba_id).filter(Boolean)
  );

  const { data: allGlebas } = await supabase
    .from("glebas")
    .select("id, apelido, numero, status");

  const excludedStatuses = ["descartada", "negocio_fechado", "proposta_recusada", "standby"];
  const inactiveGlebas = (allGlebas || []).filter(
    (g: any) =>
      !excludedStatuses.includes(g.status) && !activeGlebaIds.has(g.id)
  );

  // 3. Tarefas na última semana por usuário
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { data: weekActivities } = await supabase
    .from("atividades")
    .select("id, responsavel_id")
    .gte("created_at", oneWeekAgo.toISOString());

  const tasksByUser: Record<string, number> = {};
  (weekActivities || []).forEach((a: any) => {
    tasksByUser[a.responsavel_id] = (tasksByUser[a.responsavel_id] || 0) + 1;
  });

  // Get user names
  const userIds = Object.keys(tasksByUser);
  let userNames: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("user_id, nome")
      .in("user_id", userIds);
    (profiles || []).forEach((p: any) => {
      userNames[p.user_id] = p.nome || p.user_id;
    });
  }

  // 4. Áreas por etapa do kanban
  const statusLabels: Record<string, string> = {
    identificada: "Identificada",
    informacoes_recebidas: "Informações Recebidas",
    visita_realizada: "Visita Realizada",
    proposta_enviada: "Proposta Enviada",
    protocolo_assinado: "Protocolo Assinado",
    descartada: "Descartada",
    proposta_recusada: "Proposta Recusada",
    negocio_fechado: "Negócio Fechado",
    standby: "Standby",
  };

  const glebasByStatus: Record<string, number> = {};
  (allGlebas || []).forEach((g: any) => {
    glebasByStatus[g.status] = (glebasByStatus[g.status] || 0) + 1;
  });

  // Build HTML report
  const reportDate = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; color: #1a1a2e;">
      <h1 style="color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 12px; font-size: 22px;">
        📊 Relatório Semanal — Novos Negócios
      </h1>
      <p style="color: #64748b; font-size: 14px;">${reportDate}</p>

      <div style="background: #f0f9ff; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #2563eb;">
        <h2 style="margin-top: 0; font-size: 16px;">🎯 Meta do Semestre</h2>
        <p style="font-size: 28px; font-weight: 700; margin: 8px 0; color: #2563eb;">${negociosCount} negócio(s) fechado(s)</p>
        <p style="color: #64748b; margin: 4px 0;">⏳ <strong>${weeksLeft}</strong> semana(s) restante(s) no semestre</p>
      </div>

      <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <h2 style="margin-top: 0; font-size: 16px;">⚠️ Áreas sem Atualização (${inactiveGlebas.length})</h2>
        ${
          inactiveGlebas.length === 0
            ? '<p style="color: #64748b;">Todas as áreas estão atualizadas!</p>'
            : `<ul style="padding-left: 20px; margin: 8px 0;">
                ${inactiveGlebas
                  .slice(0, 20)
                  .map(
                    (g: any) =>
                      `<li style="margin: 4px 0;">#${g.numero || "?"} ${g.apelido} <span style="color: #64748b; font-size: 12px;">(${statusLabels[g.status] || g.status})</span></li>`
                  )
                  .join("")}
                ${inactiveGlebas.length > 20 ? `<li style="color: #64748b;">... e mais ${inactiveGlebas.length - 20}</li>` : ""}
              </ul>`
        }
      </div>

      <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #22c55e;">
        <h2 style="margin-top: 0; font-size: 16px;">✅ Tarefas na Última Semana</h2>
        ${
          userIds.length === 0
            ? '<p style="color: #64748b;">Nenhuma tarefa registrada.</p>'
            : `<table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
                <tr style="border-bottom: 1px solid #d1d5db;">
                  <th style="text-align: left; padding: 6px 8px; font-size: 13px; color: #64748b;">Usuário</th>
                  <th style="text-align: right; padding: 6px 8px; font-size: 13px; color: #64748b;">Tarefas</th>
                </tr>
                ${userIds
                  .sort((a, b) => tasksByUser[b] - tasksByUser[a])
                  .map(
                    (uid) =>
                      `<tr><td style="padding: 6px 8px;">${userNames[uid] || uid}</td><td style="text-align: right; padding: 6px 8px; font-weight: 600;">${tasksByUser[uid]}</td></tr>`
                  )
                  .join("")}
              </table>`
        }
      </div>

      <div style="background: #faf5ff; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
        <h2 style="margin-top: 0; font-size: 16px;">📋 Áreas por Etapa do Kanban</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
          <tr style="border-bottom: 1px solid #d1d5db;">
            <th style="text-align: left; padding: 6px 8px; font-size: 13px; color: #64748b;">Etapa</th>
            <th style="text-align: right; padding: 6px 8px; font-size: 13px; color: #64748b;">Qtd</th>
          </tr>
          ${Object.entries(statusLabels)
            .map(
              ([key, label]) =>
                `<tr><td style="padding: 6px 8px;">${label}</td><td style="text-align: right; padding: 6px 8px; font-weight: 600;">${glebasByStatus[key] || 0}</td></tr>`
            )
            .join("")}
        </table>
      </div>

      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 30px;">
        Gerado automaticamente pelo sistema Perdigueiro
      </p>
    </div>
  `;

  return html;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();

    // Ensure report config exists (auto-seed)
    const { data: existingConfig } = await supabase
      .from("report_configs")
      .select("id")
      .eq("report_key", "weekly_new_business")
      .maybeSingle();

    if (!existingConfig) {
      await supabase.from("report_configs").insert({
        report_key: "weekly_new_business",
        nome: "Relatório Semanal - Novos Negócios",
        descricao:
          "Enviado toda segunda-feira às 08:00. Inclui: meta vigente e progresso do semestre, áreas sem atualização, tarefas realizadas por usuário na última semana, e distribuição de áreas por etapa do kanban.",
        ativo: false,
      });
    }

    // Check if report is active
    const { data: config } = await supabase
      .from("report_configs")
      .select("*")
      .eq("report_key", "weekly_new_business")
      .single();

    // Parse request body
    let body: any = {};
    try { body = await req.json(); } catch {}
    const force = body?.force === true;
    const sendEmail = body?.sendEmail === true;

    if (!config?.ativo && !force && !sendEmail) {
      return new Response(
        JSON.stringify({ message: "Relatório desativado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the report
    const html = await buildReport(supabase);

    // Update the config with last report
    await supabase
      .from("report_configs")
      .update({
        ultimo_envio: now.toISOString(),
        ultimo_relatorio_html: html,
      })
      .eq("report_key", "weekly_new_business");

    // Send emails if requested
    let emailResult = null;
    if (sendEmail) {
      const destinatarios = config?.destinatarios || [];
      if (destinatarios.length === 0) {
        return new Response(
          JSON.stringify({ success: true, html, emailResult: { sent: 0, failed: [], message: "Nenhum destinatário configurado" } }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get recipient emails
      const { data: recipientData } = await supabase.rpc("get_user_emails", {
        user_ids: destinatarios,
      });

      if (!recipientData || recipientData.length === 0) {
        return new Response(
          JSON.stringify({ success: true, html, emailResult: { sent: 0, failed: [], message: "Nenhum e-mail encontrado para os destinatários" } }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const subject = `📊 Relatório Semanal — Novos Negócios (${now.toLocaleDateString("pt-BR")})`;
      emailResult = await sendEmailsViaResend(html, recipientData, subject);
    }

    return new Response(
      JSON.stringify({ success: true, html, emailResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
