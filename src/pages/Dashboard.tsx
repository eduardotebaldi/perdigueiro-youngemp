import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { PropostasChart } from "@/components/dashboard/PropostasChart";
import { AtividadesChart } from "@/components/dashboard/AtividadesChart";
import { StatusPieChart } from "@/components/dashboard/StatusPieChart";
import { QuickAccess } from "@/components/dashboard/QuickAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const META_SEMESTRAL = 5;

function getSemesterLabel() {
  const month = new Date().getMonth();
  const year = new Date().getFullYear();
  return month < 6 ? `1º Semestre ${year}` : `2º Semestre ${year}`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Usuário";
  const negociosSemestre = stats?.negociosFechadosSemestre || 0;
  const progressPercent = Math.min((negociosSemestre / META_SEMESTRAL) * 100, 100);
  const metaAtingida = negociosSemestre >= META_SEMESTRAL;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Olá, {firstName}! 👋</h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo ao Perdigueiro
        </p>
      </div>

      {/* Meta Semestral */}
      {isLoading ? (
        <Skeleton className="h-28 rounded-lg" />
      ) : (
        <Card className={metaAtingida ? "border-green-500/50 bg-green-500/5" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {metaAtingida ? (
                <Trophy className="h-5 w-5 text-green-500" />
              ) : (
                <Target className="h-5 w-5 text-primary" />
              )}
              Meta de Negócios Fechados — <span className="text-muted-foreground font-normal text-sm">{getSemesterLabel()}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold">{negociosSemestre}</span>
                  <span className="text-lg text-muted-foreground">/ {META_SEMESTRAL}</span>
                </div>
                <Progress value={progressPercent} className="h-3" />
              </div>
              {metaAtingida && (
                <span className="text-sm font-medium text-green-600 whitespace-nowrap pb-1">
                  🎉 Meta atingida!
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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