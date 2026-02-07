import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format, startOfWeek, endOfWeek, eachDayOfInterval, eachMonthOfInterval, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardStats {
  totalGlebas: number;
  glebasPorStatus: Record<string, number>;
  totalPropostas: number;
  totalCidades: number;
  negociosFechados: number;
  propostasPorMes: { month: string; count: number }[];
  atividadesPorDia: { day: string; count: number }[];
  atividadesEstaSemana: number;
  glebasEmStandby: number;
  glebasPrioritarias: number;
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
      // Buscar dados em paralelo
      const [glebasResult, propostasResult, cidadesResult, atividadesResult] = await Promise.all([
        supabase.from("glebas").select("id, status, prioridade"),
        supabase.from("propostas").select("id, data_proposta"),
        supabase.from("cidades").select("id"),
        supabase.from("atividades").select("id, data"),
      ]);

      if (glebasResult.error) throw glebasResult.error;
      if (propostasResult.error) throw propostasResult.error;
      if (cidadesResult.error) throw cidadesResult.error;
      if (atividadesResult.error) throw atividadesResult.error;

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
      const glebasEmStandby = glebasPorStatus["standby"] || 0;
      const glebasPrioritarias = glebas.filter((g) => g.prioridade).length;

      // Propostas por mês (últimos 6 meses)
      const now = new Date();
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
        propostasPorMes,
        atividadesPorDia,
        atividadesEstaSemana,
        glebasEmStandby,
        glebasPrioritarias,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export { STATUS_LABELS };
