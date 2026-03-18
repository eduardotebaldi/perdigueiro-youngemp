import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format, startOfWeek, endOfWeek, eachDayOfInterval, eachMonthOfInterval, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { validateGlebaStatus } from "@/lib/glebaValidation";

interface InactiveGleba {
  id: string;
  numero: number | null;
  apelido: string;
  status: string;
}

interface NegocioFechado {
  id: string;
  numero: number | null;
  apelido: string;
  cidade_id: string | null;
}

interface DashboardStats {
  totalGlebas: number;
  glebasPorStatus: Record<string, number>;
  totalPropostas: number;
  totalCidades: number;
  negociosFechados: number;
  negociosFechadosSemestre: number;
  negociosFechadosSemestreList: NegocioFechado[];
  propostasPorMes: { month: string; count: number }[];
  atividadesPorDia: { day: string; count: number }[];
  atividadesEstaSemana: number;
  glebasEmStandby: number;
  glebasPrioritarias: number;
  glebasInativas: InactiveGleba[];
  glebasComInfoFaltando: number;
}

const STATUS_LABELS: Record<string, string> = {
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

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      const now = new Date();

      // Calculate current semester start, but never before 2026-03-10
      const currentMonth = now.getMonth();
      const semesterStartMonth = currentMonth < 6 ? 0 : 6;
      const semesterStartDate = new Date(now.getFullYear(), semesterStartMonth, 1);
      const cutoffDate = new Date("2026-03-10T00:00:00");
      const semesterStart = semesterStartDate > cutoffDate ? semesterStartDate : cutoffDate;

      // Buscar dados em paralelo
      const [glebasResult, propostasResult, cidadesResult, atividadesResult, negociosSemestreResult, recentAtividadesResult] = await Promise.all([
        supabase.from("glebas").select("id, status, prioridade, numero, apelido, data_visita, arquivo_protocolo, motivo_descarte_id, arquivo_contrato, standby_motivo"),
        supabase.from("propostas").select("id, data_proposta"),
        supabase.from("cidades").select("id"),
        supabase.from("atividades").select("id, data"),
        supabase.from("glebas").select("id, numero, apelido, cidade_id, data_fechamento").eq("status", "negocio_fechado").gte("data_fechamento", semesterStart.toISOString().split("T")[0]),
        supabase.from("atividades").select("gleba_id").gte("created_at", subDays(now, 10).toISOString()),
      ]);

      if (glebasResult.error) throw glebasResult.error;
      if (propostasResult.error) throw propostasResult.error;
      if (cidadesResult.error) throw cidadesResult.error;
      if (negociosSemestreResult.error) throw negociosSemestreResult.error;

      const glebas = glebasResult.data || [];
      const propostas = propostasResult.data || [];
      const cidades = cidadesResult.data || [];
      const atividades = atividadesResult.data || [];

      // Contadores básicos
      const totalGlebas = glebas.length;
      const totalPropostas = propostas.length;
      const totalCidades = cidades.length;

      // Glebas por status
      const glebasPorStatus: Record<string, number> = {};
      glebas.forEach((g) => {
        glebasPorStatus[g.status] = (glebasPorStatus[g.status] || 0) + 1;
      });

      const negociosFechados = glebasPorStatus["negocio_fechado"] || 0;
      const negociosFechadosSemestre = negociosSemestreResult.data?.length || 0;
      const negociosFechadosSemestreList: NegocioFechado[] = (negociosSemestreResult.data || []).map((g: any) => ({
        id: g.id, numero: g.numero, apelido: g.apelido, cidade_id: g.cidade_id,
      }));
      const glebasEmStandby = glebasPorStatus["standby"] || 0;
      const glebasPrioritarias = glebas.filter((g) => g.prioridade).length;

      // Glebas com informações faltando (validação de status)
      const glebasComInfoFaltando = glebas.filter((g) => {
        const result = validateGlebaStatus(g as any);
        return !result.isValid;
      }).length;

      // Glebas inativas (sem atividade nos últimos 10 dias, excluindo descartada/negocio_fechado)
      const excludedStatuses = ["descartada", "negocio_fechado", "proposta_recusada", "standby"];
      const activeGlebaIds = new Set(
        (recentAtividadesResult.data || []).map((a) => a.gleba_id).filter(Boolean)
      );
      const glebasInativas: InactiveGleba[] = glebas
        .filter((g) => !excludedStatuses.includes(g.status) && !activeGlebaIds.has(g.id))
        .map((g) => ({ id: g.id, numero: g.numero, apelido: g.apelido, status: g.status }));

      // Propostas por mês (últimos 6 meses)
      const sixMonthsAgo = subMonths(now, 5);
      const months = eachMonthOfInterval({ start: startOfMonth(sixMonthsAgo), end: endOfMonth(now) });
      
      const propostasPorMes = months.map((month) => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const count = propostas.filter((p) => {
          const date = new Date(p.data_proposta);
          return date >= monthStart && date <= monthEnd;
        }).length;
        
        return {
          month: format(month, "MMM", { locale: ptBR }),
          count,
        };
      });

      // Atividades por dia (últimos 7 dias)
      const sevenDaysAgo = subDays(now, 6);
      const days = eachDayOfInterval({ start: sevenDaysAgo, end: now });
      
      const atividadesPorDia = days.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const count = atividades.filter((a) => a.data === dayStr).length;
        
        return {
          day: format(day, "EEE", { locale: ptBR }),
          count,
        };
      });

      // Atividades esta semana
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const atividadesEstaSemana = atividades.filter((a) => {
        const date = new Date(a.data);
        return date >= weekStart && date <= weekEnd;
      }).length;

      return {
        totalGlebas,
        glebasPorStatus,
        totalPropostas,
        totalCidades,
        negociosFechados,
        negociosFechadosSemestre,
        negociosFechadosSemestreList,
        propostasPorMes,
        atividadesPorDia,
        atividadesEstaSemana,
        glebasEmStandby,
        glebasPrioritarias,
        glebasInativas,
        glebasComInfoFaltando,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export { STATUS_LABELS };
