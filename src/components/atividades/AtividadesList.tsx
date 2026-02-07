import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAtividades } from "@/hooks/useAtividades";
import { useGlebas } from "@/hooks/useGlebas";
import { useCidades } from "@/hooks/useCidades";
import { AtividadeCard } from "./AtividadeCard";
import { Skeleton } from "@/components/ui/skeleton";

type PeriodFilter = "all" | "today" | "week" | "month";

export function AtividadesList() {
  const { atividades, isLoading } = useAtividades();
  const { glebas } = useGlebas();
  const { cidades } = useCidades();
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [cidadeFilter, setCidadeFilter] = useState<string>("all");

  // Build a map of gleba_id -> cidade_id for quick lookup
  const glebaCidadeMap = useMemo(() => {
    const map = new Map<string, string | null>();
    glebas.forEach((g) => {
      map.set(g.id, g.cidade_id);
    });
    return map;
  }, [glebas]);
  const filteredAtividades = useMemo(() => {
    return atividades.filter((atividade) => {
      // Text search
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesDescricao = atividade.descricao
          .toLowerCase()
          .includes(searchLower);
        const matchesGleba =
          (atividade as any).gleba?.apelido
            ?.toLowerCase()
            .includes(searchLower) || false;
        if (!matchesDescricao && !matchesGleba) return false;
      }

      // City filter - filter by the city of the associated gleba
      if (cidadeFilter !== "all") {
        if (!atividade.gleba_id) return false;
        const glebaCidadeId = glebaCidadeMap.get(atividade.gleba_id);
        if (glebaCidadeId !== cidadeFilter) return false;
      }

      // Period filter
      if (periodFilter !== "all") {
        const atividadeDate = new Date(atividade.data + "T00:00:00");
        const now = new Date();

        switch (periodFilter) {
          case "today":
            if (
              format(atividadeDate, "yyyy-MM-dd") !==
              format(now, "yyyy-MM-dd")
            ) {
              return false;
            }
            break;
          case "week":
            const weekStart = startOfWeek(now, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
            if (
              !isWithinInterval(atividadeDate, { start: weekStart, end: weekEnd })
            ) {
              return false;
            }
            break;
          case "month":
            const monthStart = startOfMonth(now);
            const monthEnd = endOfMonth(now);
            if (
              !isWithinInterval(atividadeDate, {
                start: monthStart,
                end: monthEnd,
              })
            ) {
              return false;
            }
            break;
        }
      }

      return true;
    });
  }, [atividades, search, periodFilter, cidadeFilter, glebaCidadeMap]);

  // Group activities by date
  const groupedAtividades = useMemo(() => {
    const groups: Record<string, typeof filteredAtividades> = {};
    
    filteredAtividades.forEach((atividade) => {
      const dateKey = atividade.data;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(atividade);
    });

    return groups;
  }, [filteredAtividades]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar atividades..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Esta Semana</SelectItem>
            <SelectItem value="month">Este Mês</SelectItem>
          </SelectContent>
        </Select>

        <Select value={cidadeFilter} onValueChange={setCidadeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <SelectValue placeholder="Filtrar por cidade" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as cidades</SelectItem>
            {cidades?.map((cidade) => (
              <SelectItem key={cidade.id} value={cidade.id}>
                {cidade.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredAtividades.length} atividade{filteredAtividades.length !== 1 && "s"} encontrada{filteredAtividades.length !== 1 && "s"}
      </p>

      {/* Timeline */}
      {filteredAtividades.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhuma atividade encontrada</p>
          <p className="text-sm">Registre sua primeira atividade clicando no botão acima</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAtividades.map((atividade) => (
            <AtividadeCard key={atividade.id} atividade={atividade as any} />
          ))}
        </div>
      )}
    </div>
  );
}
