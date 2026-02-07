import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Kanban, Map, FileText, Building, CalendarDays, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

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

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Glebas</CardTitle>
            <Kanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Nenhuma gleba cadastrada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propostas Ativas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Nenhuma proposta enviada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cidades Mapeadas</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Nenhuma cidade cadastrada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negócios Fechados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Nenhum negócio concluído
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Acesso Rápido</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Kanban className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Kanban de Glebas</CardTitle>
              <CardDescription>
                Visualize e gerencie suas glebas em um quadro Kanban interativo
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Map className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Mapa Integrado</CardTitle>
              <CardDescription>
                Visualize todas as glebas no mapa e desenhe novos polígonos
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Atividades</CardTitle>
              <CardDescription>
                Registre e acompanhe todas as atividades realizadas
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}