import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Kanban, FileText, Map, TrendingUp, Clock, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardsProps {
  totalGlebas: number;
  totalPropostas: number;
  totalCidades: number;
  negociosFechados: number;
  glebasEmStandby: number;
  glebasPrioritarias: number;
  isLoading?: boolean;
}

export function StatsCards({
  totalGlebas,
  totalPropostas,
  totalCidades,
  negociosFechados,
  glebasEmStandby,
  glebasPrioritarias,
  isLoading,
}: StatsCardsProps) {
  const stats = [
    {
      title: "Total de Glebas",
      value: totalGlebas,
      description: totalGlebas === 0 ? "Nenhuma gleba cadastrada" : `${glebasPrioritarias} prioritária${glebasPrioritarias !== 1 ? "s" : ""}`,
      icon: Kanban,
    },
    {
      title: "Propostas Enviadas",
      value: totalPropostas,
      description: totalPropostas === 0 ? "Nenhuma proposta enviada" : "Total de propostas",
      icon: FileText,
    },
    {
      title: "Cidades Mapeadas",
      value: totalCidades,
      description: totalCidades === 0 ? "Nenhuma cidade cadastrada" : "Com glebas cadastradas",
      icon: Map,
    },
    {
      title: "Negócios Fechados",
      value: negociosFechados,
      description: negociosFechados === 0 ? "Nenhum negócio concluído" : "Contratos assinados",
      icon: TrendingUp,
      highlight: negociosFechados > 0,
    },
    {
      title: "Em Standby",
      value: glebasEmStandby,
      description: glebasEmStandby === 0 ? "Nenhuma gleba em espera" : "Aguardando retorno",
      icon: Clock,
    },
    {
      title: "Prioritárias",
      value: glebasPrioritarias,
      description: glebasPrioritarias === 0 ? "Nenhuma com prioridade" : "Marcadas para foco",
      icon: Star,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12 mb-1" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.title} className={stat.highlight ? "border-primary/50 bg-primary/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.highlight ? "text-primary" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.highlight ? "text-primary" : ""}`}>
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
