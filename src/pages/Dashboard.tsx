import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { PropostasChart } from "@/components/dashboard/PropostasChart";
import { AtividadesChart } from "@/components/dashboard/AtividadesChart";
import { StatusPieChart } from "@/components/dashboard/StatusPieChart";
import { QuickAccess } from "@/components/dashboard/QuickAccess";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Usuário";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Olá, {firstName}! 👋</h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo ao Sistema de Mapeamento de Glebas
        </p>
      </div>

      {/* KPI Cards */}
      <StatsCards
        totalGlebas={stats?.totalGlebas || 0}
        totalPropostas={stats?.totalPropostas || 0}
        totalCidades={stats?.totalCidades || 0}
        negociosFechados={stats?.negociosFechados || 0}
        glebasEmStandby={stats?.glebasEmStandby || 0}
        glebasPrioritarias={stats?.glebasPrioritarias || 0}
        isLoading={isLoading}
      />

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PropostasChart 
          data={stats?.propostasPorMes || []} 
          isLoading={isLoading} 
        />
        <AtividadesChart 
          data={stats?.atividadesPorDia || []} 
          atividadesEstaSemana={stats?.atividadesEstaSemana || 0}
          isLoading={isLoading} 
        />
      </div>

      {/* Status Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <StatusPieChart 
          data={stats?.glebasPorStatus || {}} 
          isLoading={isLoading} 
        />
        
        {/* Quick Access moved to second column */}
        <div className="lg:self-start">
          <QuickAccess />
        </div>
      </div>
    </div>
  );
}
