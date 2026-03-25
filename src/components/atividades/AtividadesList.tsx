import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, MapPin, Check, ChevronsUpDown, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAtividades } from "@/hooks/useAtividades";
import { useGlebas } from "@/hooks/useGlebas";
import { useCidades } from "@/hooks/useCidades";
import { useTiposAtividade } from "@/hooks/useTiposAtividade";
import { AtividadeCard } from "./AtividadeCard";
import { Skeleton } from "@/components/ui/skeleton";

type PeriodFilter = "all" | "today" | "week" | "month";

export function AtividadesList() {
  const { atividades, isLoading } = useAtividades();
  const { glebas } = useGlebas();
  const { cidades } = useCidades();
  const { tiposAtividade } = useTiposAtividade();
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [cidadeFilter, setCidadeFilter] = useState<string>("all");
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [tipoPopoverOpen, setTipoPopoverOpen] = useState(false);

  const glebaCidadeMap = useMemo(() => {
    const map = new Map<string, string | null>();
    glebas.forEach((g) => {
      map.set(g.id, g.cidade_id);
    });
    return map;
  }, [glebas]);

  const toggleTipo = (tipoId: string) => {
    setSelectedTipos((prev) =>
      prev.includes(tipoId)
        ? prev.filter((id) => id !== tipoId)
        : [...prev, tipoId]
    );
  };

  const filteredAtividades = useMemo(() => {
    return atividades.filter((atividade) => {
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesDescricao = atividade.descricao.toLowerCase().includes(searchLower);
        const matchesGleba =
          (atividade as any).gleba?.apelido?.toLowerCase().includes(searchLower) || false;
        if (!matchesDescricao && !matchesGleba) return false;
      }

      if (cidadeFilter !== "all") {
        if (!atividade.gleba_id) return false;
        const glebaCidadeId = glebaCidadeMap.get(atividade.gleba_id);
        if (glebaCidadeId !== cidadeFilter) return false;
      }

      if (selectedTipos.length > 0) {
        const tipoId = (atividade as any).tipo_atividade?.id;
        if (!tipoId || !selectedTipos.includes(tipoId)) return false;
      }

      if (periodFilter !== "all") {
        const atividadeDate = new Date(atividade.data + "T00:00:00");
        const now = new Date();
        switch (periodFilter) {
          case "today":
            if (format(atividadeDate, "yyyy-MM-dd") !== format(now, "yyyy-MM-dd")) return false;
            break;
          case "week": {
            const weekStart = startOfWeek(now, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
            if (!isWithinInterval(atividadeDate, { start: weekStart, end: weekEnd })) return false;
            break;
          }
          case "month": {
            const monthStart = startOfMonth(now);
            const monthEnd = endOfMonth(now);
            if (!isWithinInterval(atividadeDate, { start: monthStart, end: monthEnd })) return false;
            break;
          }
        }
      }

      return true;
    });
  }, [atividades, search, periodFilter, cidadeFilter, selectedTipos, glebaCidadeMap]);

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

        {/* Multi-select tipo de atividade */}
        <Popover open={tipoPopoverOpen} onOpenChange={setTipoPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-56 justify-between">
              <div className="flex items-center gap-2 truncate">
                <Tag className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {selectedTipos.length === 0
                    ? "Tipo de atividade"
                    : `${selectedTipos.length} tipo${selectedTipos.length > 1 ? "s" : ""}`}
                </span>
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0">
            <Command>
              <CommandInput placeholder="Buscar tipo..." />
              <CommandList>
                <CommandEmpty>Nenhum tipo encontrado</CommandEmpty>
                <CommandGroup>
                  {tiposAtividade.map((tipo) => (
                    <CommandItem
                      key={tipo.id}
                      value={tipo.nome}
                      onSelect={() => toggleTipo(tipo.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedTipos.includes(tipo.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {tipo.nome}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected tipo badges */}
      {selectedTipos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTipos.map((tipoId) => {
            const tipo = tiposAtividade.find((t) => t.id === tipoId);
            return tipo ? (
              <Badge
                key={tipoId}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => toggleTipo(tipoId)}
              >
                {tipo.nome} ×
              </Badge>
            ) : null;
          })}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        {filteredAtividades.length} atividade{filteredAtividades.length !== 1 && "s"} encontrada{filteredAtividades.length !== 1 && "s"}
      </p>

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
