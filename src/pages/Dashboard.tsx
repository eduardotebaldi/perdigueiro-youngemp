import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats, STATUS_LABELS } from "@/hooks/useDashboardStats";
import { useCidades } from "@/hooks/useCidades";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { PropostasChart } from "@/components/dashboard/PropostasChart";
import { AtividadesChart } from "@/components/dashboard/AtividadesChart";
import { StatusPieChart } from "@/components/dashboard/StatusPieChart";
import { QuickAccess } from "@/components/dashboard/QuickAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Target, Trophy, MessageSquareOff, Clock } from "lucide-react";
import { differenceInWeeks, endOfMonth } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

const META_SEMESTRAL = 5;

function getSemesterLabel() {
  const month = new Date().getMonth();
  const year = new Date().getFullYear();
  return month < 6 ? `1º Semestre ${year}` : `2º Semestre ${year}`;
}

function getWeeksRemaining() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const semesterEnd = month < 6 ? new Date(year, 5, 30) : new Date(year, 11, 31);
  return Math.max(0, differenceInWeeks(semesterEnd, now));
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();
  const { cidades } = useCidades();
  const [metaDialogOpen, setMetaDialogOpen] = useState(false);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Usuário";
  const negociosSemestre = stats?.negociosFechadosSemestre || 0;
  const negociosList = stats?.negociosFechadosSemestreList || [];
  const glebasInativas = stats?.glebasInativas || [];
  const progressPercent = Math.min((negociosSemestre / META_SEMESTRAL) * 100, 100);
  const metaAtingida = negociosSemestre >= META_SEMESTRAL;

  const getCidadeName = (cidadeId: string | null) => {
    if (!cidadeId || !cidades) return "—";
    return cidades.find((c) => c.id === cidadeId)?.nome || "—";
  };

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
        <Card
          className={`${metaAtingida ? "border-green-500/50 bg-green-500/5" : ""} cursor-pointer hover:shadow-md transition-shadow`}
          onClick={() => setMetaDialogOpen(true)}
        >
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

      {/* Modal de detalhes da meta */}
      <Dialog open={metaDialogOpen} onOpenChange={setMetaDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Negócios Fechados — {getSemesterLabel()}
            </DialogTitle>
          </DialogHeader>
          {negociosList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum negócio fechado neste semestre ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Nº</TableHead>
                  <TableHead>Apelido</TableHead>
                  <TableHead>Cidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {negociosList.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-mono text-sm font-bold text-muted-foreground">
                      #{g.numero || "?"}
                    </TableCell>
                    <TableCell className="font-medium">{g.apelido}</TableCell>
                    <TableCell className="text-muted-foreground">{getCidadeName(g.cidade_id)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <p className="text-xs text-muted-foreground text-center">
            Meta: {negociosSemestre} / {META_SEMESTRAL}
          </p>
        </DialogContent>
      </Dialog>

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

      {/* Status Distribution & Inactive Glebas */}
      <div className="grid gap-6 lg:grid-cols-2">
        <StatusPieChart 
          data={stats?.glebasPorStatus || {}} 
          isLoading={isLoading} 
        />
        
        {/* Áreas sem atualização */}
        {isLoading ? (
          <Skeleton className="h-64 rounded-lg" />
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquareOff className="h-5 w-5 text-orange-500" />
                Áreas sem atualização
                <Badge variant="secondary" className="ml-auto">{glebasInativas.length}</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">Glebas sem atividades nos últimos 10 dias</p>
            </CardHeader>
            <CardContent>
              {glebasInativas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Todas as glebas estão em dia! 🎉</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {glebasInativas.map((g) => (
                    <Link
                      key={g.id}
                      to="/glebas"
                      className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium truncate">
                        {g.numero ? `#${g.numero} ` : ""}{g.apelido}
                      </span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {STATUS_LABELS[g.status] || g.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Access */}
      <QuickAccess />
    </div>
  );
}