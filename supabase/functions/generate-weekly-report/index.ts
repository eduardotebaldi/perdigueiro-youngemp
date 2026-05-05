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
          from: "Perdigueiro <noreply@youngempreendimentos.com.br>",
          to: [recipient.email],
          subject,
          html,
        }),
      });

      const resBody = await res.text();
      console.log(`Resend response for ${recipient.email}: status=${res.status} body=${resBody}`);
      if (!res.ok) {
        console.error(`Falha ao enviar para ${recipient.email}: ${resBody}`);
        failed.push(recipient.email);
      } else {
        sent++;
      }
    } catch (err) {
      console.error(`Erro ao enviar para ${recipient.email}:`, err);
      failed.push(recipient.email);
    }
  }

  return { sent, failed };
}

// ─── Semester goal helper ───────────────────────────────────────────
function getSemesterGoalData(now: Date) {
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
  return { effectiveStart, weeksLeft };
}

function renderGoalSection(negociosCount: number, weeksLeft: number): string {
  return `
    <div style="background: #f0f9ff; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #2563eb;">
      <h2 style="margin-top: 0; font-size: 16px;">🎯 Meta do Semestre</h2>
      <p style="font-size: 28px; font-weight: 700; margin: 8px 0; color: #2563eb;">${negociosCount} negócio(s) fechado(s)</p>
      <p style="color: #64748b; margin: 4px 0;">⏳ <strong>${weeksLeft}</strong> semana(s) restante(s) no semestre</p>
    </div>`;
}

// ─── Report: weekly_new_business ────────────────────────────────────
async function buildNewBusinessReport(supabase: any): Promise<string> {
  const now = new Date();
  const { effectiveStart, weeksLeft } = getSemesterGoalData(now);

  const { data: negociosSemestre } = await supabase
    .from("glebas").select("id").eq("status", "negocio_fechado")
    .gte("data_fechamento", effectiveStart.toISOString().split("T")[0]);
  const negociosCount = negociosSemestre?.length || 0;

  const tenDaysAgo = new Date(now);
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
  const { data: recentActivities } = await supabase
    .from("atividades").select("gleba_id").gte("created_at", tenDaysAgo.toISOString());
  const activeGlebaIds = new Set((recentActivities || []).map((a: any) => a.gleba_id).filter(Boolean));

  const { data: allGlebas } = await supabase.from("glebas").select("id, apelido, numero, status");
  const excludedStatuses = ["descartada", "negocio_fechado", "proposta_recusada", "standby"];
  const inactiveGlebas = (allGlebas || []).filter(
    (g: any) => !excludedStatuses.includes(g.status) && !activeGlebaIds.has(g.id)
  );

  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const { data: weekActivities } = await supabase
    .from("atividades").select("id, responsavel_id").gte("created_at", oneWeekAgo.toISOString());
  const tasksByUser: Record<string, number> = {};
  (weekActivities || []).forEach((a: any) => {
    tasksByUser[a.responsavel_id] = (tasksByUser[a.responsavel_id] || 0) + 1;
  });
  const userIds = Object.keys(tasksByUser);
  let userNames: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from("user_profiles").select("user_id, nome").in("user_id", userIds);
    (profiles || []).forEach((p: any) => { userNames[p.user_id] = p.nome || p.user_id; });
  }

  const statusLabels: Record<string, string> = {
    identificada: "Identificada", analise_interna_realizada: "Análise Interna Realizada",
    informacoes_recebidas: "Informações Recebidas",
    visita_realizada: "Visita Realizada", proposta_enviada: "Proposta Enviada",
    minuta_enviada: "Minuta Enviada",
    protocolo_assinado: "Protocolo Assinado", descartada: "Descartada",
    proposta_recusada: "Proposta Recusada", negocio_fechado: "Negócio Fechado", standby: "Standby",
  };
  const glebasByStatus: Record<string, number> = {};
  (allGlebas || []).forEach((g: any) => { glebasByStatus[g.status] = (glebasByStatus[g.status] || 0) + 1; });

  const reportDate = now.toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; color: #1a1a2e;">
      <h1 style="color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 12px; font-size: 22px;">📊 Relatório Semanal — Novos Negócios</h1>
      <p style="color: #64748b; font-size: 14px;">${reportDate}</p>
      ${renderGoalSection(negociosCount, weeksLeft)}
      <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <h2 style="margin-top: 0; font-size: 16px;">⚠️ Áreas sem Atualização (${inactiveGlebas.length})</h2>
        ${inactiveGlebas.length === 0
          ? '<p style="color: #64748b;">Todas as áreas estão atualizadas!</p>'
          : `<ul style="padding-left: 20px; margin: 8px 0;">${inactiveGlebas.slice(0, 20).map((g: any) => `<li style="margin: 4px 0;">#${g.numero || "?"} ${g.apelido} <span style="color: #64748b; font-size: 12px;">(${statusLabels[g.status] || g.status})</span></li>`).join("")}${inactiveGlebas.length > 20 ? `<li style="color: #64748b;">... e mais ${inactiveGlebas.length - 20}</li>` : ""}</ul>`}
      </div>
      <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #22c55e;">
        <h2 style="margin-top: 0; font-size: 16px;">✅ Tarefas na Última Semana</h2>
        ${userIds.length === 0
          ? '<p style="color: #64748b;">Nenhuma tarefa registrada.</p>'
          : `<table style="width: 100%; border-collapse: collapse; margin-top: 8px;"><tr style="border-bottom: 1px solid #d1d5db;"><th style="text-align: left; padding: 6px 8px; font-size: 13px; color: #64748b;">Usuário</th><th style="text-align: right; padding: 6px 8px; font-size: 13px; color: #64748b;">Tarefas</th></tr>${userIds.sort((a, b) => tasksByUser[b] - tasksByUser[a]).map((uid) => `<tr><td style="padding: 6px 8px;">${userNames[uid] || uid}</td><td style="text-align: right; padding: 6px 8px; font-weight: 600;">${tasksByUser[uid]}</td></tr>`).join("")}</table>`}
      </div>
      <div style="background: #faf5ff; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
        <h2 style="margin-top: 0; font-size: 16px;">📋 Áreas por Etapa do Kanban</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px;"><tr style="border-bottom: 1px solid #d1d5db;"><th style="text-align: left; padding: 6px 8px; font-size: 13px; color: #64748b;">Etapa</th><th style="text-align: right; padding: 6px 8px; font-size: 13px; color: #64748b;">Qtd</th></tr>${Object.entries(statusLabels).map(([key, label]) => `<tr><td style="padding: 6px 8px;">${label}</td><td style="text-align: right; padding: 6px 8px; font-weight: 600;">${glebasByStatus[key] || 0}</td></tr>`).join("")}</table>
      </div>
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 30px;">Gerado automaticamente pelo sistema Perdigueiro</p>
    </div>`;
}

// ─── Report: weekly_directorate ─────────────────────────────────────
async function buildDirectorateReport(supabase: any): Promise<string> {
  const now = new Date();
  const { effectiveStart, weeksLeft } = getSemesterGoalData(now);

  // Semester goal
  const { data: negociosSemestre } = await supabase
    .from("glebas").select("id").eq("status", "negocio_fechado")
    .gte("data_fechamento", effectiveStart.toISOString().split("T")[0]);
  const negociosCount = negociosSemestre?.length || 0;

  // Glebas in target statuses
  const { data: glebas } = await supabase
    .from("glebas")
    .select("id, apelido, numero, status, tamanho_m2, preco, cidade_id, updated_at, created_at, proprietario_nome")
    .in("status", ["proposta_enviada", "visita_realizada"])
    .order("status", { ascending: true });

  const glebaIds = (glebas || []).map((g: any) => g.id);

  // Fetch proposals for these glebas
  let propostas: any[] = [];
  if (glebaIds.length > 0) {
    const { data } = await supabase
      .from("propostas")
      .select("id, gleba_id, tipo, data_proposta, preco_ha, percentual_proposto, descricao")
      .in("gleba_id", glebaIds)
      .order("data_proposta", { ascending: false });
    propostas = data || [];
  }

  // Fetch activities for these glebas
  let atividades: any[] = [];
  if (glebaIds.length > 0) {
    const { data } = await supabase
      .from("atividades")
      .select("id, gleba_id, descricao, data, responsavel_id")
      .in("gleba_id", glebaIds)
      .order("data", { ascending: false });
    atividades = data || [];
  }

  // Get user names for activities
  const responsavelIds = [...new Set(atividades.map((a: any) => a.responsavel_id).filter(Boolean))];
  let userNames: Record<string, string> = {};
  if (responsavelIds.length > 0) {
    const { data: profiles } = await supabase.from("user_profiles").select("user_id, nome").in("user_id", responsavelIds);
    (profiles || []).forEach((p: any) => { userNames[p.user_id] = p.nome || p.user_id; });
  }

  // Fetch city names
  const cidadeIds = [...new Set((glebas || []).map((g: any) => g.cidade_id).filter(Boolean))];
  let cidadeNames: Record<string, string> = {};
  if (cidadeIds.length > 0) {
    const { data: cidades } = await supabase.from("cidades").select("id, nome").in("id", cidadeIds);
    (cidades || []).forEach((c: any) => { cidadeNames[c.id] = c.nome; });
  }

  const statusLabels: Record<string, string> = {
    visita_realizada: "Visita Realizada",
    proposta_enviada: "Proposta Enviada",
  };
  const tipoLabels: Record<string, string> = {
    compra: "Compra", parceria: "Parceria", mista: "Mista",
  };

  const reportDate = now.toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  // Build gleba sections
  const glebasSections = (glebas || []).map((g: any) => {
    const glebaPropostas = propostas.filter((p: any) => p.gleba_id === g.id);
    const glebaAtividades = atividades.filter((a: any) => a.gleba_id === g.id);
    const cidade = g.cidade_id ? cidadeNames[g.cidade_id] || "" : "";
    const areaHa = g.tamanho_m2 ? (g.tamanho_m2 / 10000).toFixed(1) : "—";

    const propostasHtml = glebaPropostas.length === 0
      ? '<p style="color: #94a3b8; font-size: 13px; margin: 4px 0;">Nenhuma proposta registrada.</p>'
      : `<table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 4px;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <th style="text-align: left; padding: 4px 6px; color: #64748b;">Data</th>
            <th style="text-align: left; padding: 4px 6px; color: #64748b;">Tipo</th>
            <th style="text-align: right; padding: 4px 6px; color: #64748b;">R$/ha</th>
            <th style="text-align: right; padding: 4px 6px; color: #64748b;">Permuta %</th>
          </tr>
          ${glebaPropostas.map((p: any) => `<tr>
            <td style="padding: 4px 6px;">${new Date(p.data_proposta).toLocaleDateString("pt-BR")}</td>
            <td style="padding: 4px 6px;">${tipoLabels[p.tipo] || p.tipo}</td>
            <td style="text-align: right; padding: 4px 6px;">${p.preco_ha ? p.preco_ha.toLocaleString("pt-BR") : "—"}</td>
            <td style="text-align: right; padding: 4px 6px;">${p.percentual_proposto != null ? p.percentual_proposto + "%" : "—"}</td>
          </tr>`).join("")}
        </table>`;

    const atividadesHtml = glebaAtividades.length === 0
      ? '<p style="color: #94a3b8; font-size: 13px; margin: 4px 0;">Nenhuma atividade registrada.</p>'
      : `<ul style="padding-left: 16px; margin: 4px 0; font-size: 13px;">
          ${glebaAtividades.slice(0, 10).map((a: any) => `<li style="margin: 3px 0;">
            <span style="color: #64748b;">${new Date(a.data).toLocaleDateString("pt-BR")}</span> — ${a.descricao}
            <span style="color: #94a3b8; font-size: 11px;">(${userNames[a.responsavel_id] || "—"})</span>
          </li>`).join("")}
          ${glebaAtividades.length > 10 ? `<li style="color: #94a3b8;">... e mais ${glebaAtividades.length - 10} atividades</li>` : ""}
        </ul>`;

    const statusColor = g.status === "proposta_enviada" ? "#8b5cf6" : "#f59e0b";

    return `
      <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 12px 0; border-left: 4px solid ${statusColor};">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h3 style="margin: 0; font-size: 15px;">#${g.numero || "?"} ${g.apelido}</h3>
          <span style="background: ${statusColor}20; color: ${statusColor}; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
            ${statusLabels[g.status] || g.status}
          </span>
        </div>
        <p style="color: #64748b; font-size: 13px; margin: 4px 0;">
          ${cidade ? `📍 ${cidade}` : ""} ${areaHa !== "—" ? ` · ${areaHa} ha` : ""} ${g.proprietario_nome ? ` · ${g.proprietario_nome}` : ""}
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin: 2px 0;">Última atualização: ${new Date(g.updated_at).toLocaleDateString("pt-BR")}</p>

        <div style="margin-top: 12px;">
          <h4 style="font-size: 13px; color: #334155; margin: 0 0 4px 0;">📄 Propostas</h4>
          ${propostasHtml}
        </div>

        <div style="margin-top: 12px;">
          <h4 style="font-size: 13px; color: #334155; margin: 0 0 4px 0;">📝 Histórico de Atividades</h4>
          ${atividadesHtml}
        </div>
      </div>`;
  }).join("");

  const visitaCount = (glebas || []).filter((g: any) => g.status === "visita_realizada").length;
  const propostaCount = (glebas || []).filter((g: any) => g.status === "proposta_enviada").length;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; color: #1a1a2e;">
      <h1 style="color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 12px; font-size: 22px;">📋 Relatório Semanal — Diretoria</h1>
      <p style="color: #64748b; font-size: 14px;">${reportDate}</p>

      ${renderGoalSection(negociosCount, weeksLeft)}

      <div style="display: flex; gap: 12px; margin: 16px 0;">
        <div style="flex: 1; background: #fef3c7; border-radius: 10px; padding: 14px; text-align: center;">
          <p style="font-size: 24px; font-weight: 700; margin: 0; color: #f59e0b;">${visitaCount}</p>
          <p style="font-size: 12px; color: #64748b; margin: 4px 0 0;">Visita Realizada</p>
        </div>
        <div style="flex: 1; background: #f5f3ff; border-radius: 10px; padding: 14px; text-align: center;">
          <p style="font-size: 24px; font-weight: 700; margin: 0; color: #8b5cf6;">${propostaCount}</p>
          <p style="font-size: 12px; color: #64748b; margin: 4px 0 0;">Proposta Enviada</p>
        </div>
      </div>

      ${(glebas || []).length === 0
        ? '<p style="color: #64748b; text-align: center; padding: 20px;">Nenhuma gleba em Visita Realizada ou Proposta Enviada.</p>'
        : glebasSections}

      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 30px;">Gerado automaticamente pelo sistema Perdigueiro</p>
    </div>`;
}

// ─── Report registry ────────────────────────────────────────────────
const REPORT_BUILDERS: Record<string, (supabase: any) => Promise<string>> = {
  weekly_new_business: buildNewBusinessReport,
  weekly_directorate: buildDirectorateReport,
};

const REPORT_SEEDS: Record<string, { nome: string; descricao: string }> = {
  weekly_new_business: {
    nome: "Relatório Semanal - Novos Negócios",
    descricao: "Enviado toda segunda-feira às 08:00. Inclui: meta vigente e progresso do semestre, áreas sem atualização, tarefas realizadas por usuário na última semana, e distribuição de áreas por etapa do kanban.",
  },
  weekly_directorate: {
    nome: "Relatório Semanal - Diretoria",
    descricao: "Glebas em Proposta Enviada e Visita Realizada com detalhes de propostas, histórico de atividades e meta do semestre.",
  },
};

const REPORT_SUBJECTS: Record<string, (now: Date) => string> = {
  weekly_new_business: (now) => `📊 Relatório Semanal — Novos Negócios (${now.toLocaleDateString("pt-BR")})`,
  weekly_directorate: (now) => `📋 Relatório Semanal — Diretoria (${now.toLocaleDateString("pt-BR")})`,
};

// ─── Main handler ───────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const now = new Date();

    // Auto-seed all report configs
    for (const [key, seed] of Object.entries(REPORT_SEEDS)) {
      const { data: existing } = await supabase
        .from("report_configs").select("id").eq("report_key", key).maybeSingle();
      if (!existing) {
        await supabase.from("report_configs").insert({
          report_key: key, nome: seed.nome, descricao: seed.descricao, ativo: false,
        });
      }
    }

    // Parse request body
    let body: any = {};
    try { body = await req.json(); } catch {}
    const reportKey = body?.report_key || "weekly_new_business";
    const force = body?.force === true;
    const sendEmail = body?.sendEmail === true;

    // Get config for requested report
    const { data: config } = await supabase
      .from("report_configs").select("*").eq("report_key", reportKey).single();

    if (!config?.ativo && !force && !sendEmail) {
      return new Response(
        JSON.stringify({ message: "Relatório desativado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build report
    const builder = REPORT_BUILDERS[reportKey];
    if (!builder) {
      return new Response(
        JSON.stringify({ error: `Tipo de relatório desconhecido: ${reportKey}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const html = await builder(supabase);

    // Update config
    await supabase
      .from("report_configs")
      .update({ ultimo_envio: now.toISOString(), ultimo_relatorio_html: html })
      .eq("report_key", reportKey);

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

      // Fetch recipient emails directly (service role bypasses RLS)
      const recipientData: { id: string; email: string; nome: string }[] = [];
      for (const userId of destinatarios) {
        const { data: { user } } = await supabase.auth.admin.getUserById(userId);
        if (user?.email) {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("nome")
            .eq("user_id", userId)
            .maybeSingle();
          recipientData.push({
            id: userId,
            email: user.email,
            nome: profile?.nome || user.email,
          });
        }
      }

      if (recipientData.length === 0) {
        return new Response(
          JSON.stringify({ success: true, html, emailResult: { sent: 0, failed: [], message: "Nenhum e-mail encontrado para os destinatários" } }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const subjectFn = REPORT_SUBJECTS[reportKey] || REPORT_SUBJECTS.weekly_new_business;
      emailResult = await sendEmailsViaResend(html, recipientData, subjectFn(now));
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
