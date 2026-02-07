import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Search, CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePropostas, PropostaWithGleba } from "@/hooks/usePropostas";
import { useCidades } from "@/hooks/useCidades";
import { useAuth } from "@/contexts/AuthContext";
import { CreatePropostaDialog } from "@/components/propostas/CreatePropostaDialog";
import { ImportPropostasDialog } from "@/components/propostas/ImportPropostasDialog";
import { PropostaCard } from "@/components/propostas/PropostaCard";
import { PropostaDetailsDialog } from "@/components/propostas/PropostaDetailsDialog";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

type PeriodFilter = "all" | "month" | "custom";
type TipoFilter = "all" | "compra" | "parceria" | "mista";

export default function Propostas() {
  const { propostas, isLoading } = usePropostas();
  const { cidades } = useCidades();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [cidadeFilter, setCidadeFilter] = useState<string>("all");
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedProposta, setSelectedProposta] = useState<PropostaWithGleba | null>(null);

  const filteredPropostas = useMemo(() => {
    return propostas.filter((proposta) => {
      // Text search
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesGleba =
          proposta.gleba?.apelido?.toLowerCase().includes(searchLower) || false;
        const matchesDescricao =
          proposta.descricao?.toLowerCase().includes(searchLower) || false;
        const matchesNumero = 
          proposta.gleba?.numero?.toString().includes(search) || false;
        if (!matchesGleba && !matchesDescricao && !matchesNumero) return false;
      }

      // Cidade filter
      if (cidadeFilter !== "all") {
        if (proposta.gleba?.cidade_id !== cidadeFilter) return false;
      }

      // Tipo filter
      if (tipoFilter !== "all") {
        if (proposta.tipo !== tipoFilter) return false;
      }

      // Period filter
      const propostaDate = new Date(proposta.data_proposta + "T00:00:00");
      
      if (periodFilter === "month") {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        if (!isWithinInterval(propostaDate, { start: monthStart, end: monthEnd })) {
          return false;
        }
      } else if (periodFilter === "custom" && dateRange?.from) {
        const from = startOfDay(dateRange.from);
        const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        if (!isWithinInterval(propostaDate, { start: from, end: to })) {
          return false;
        }
      }

      return true;
    });
  }, [propostas, search, periodFilter, cidadeFilter, tipoFilter, dateRange]);

  // Group by month for display
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, typeof filteredPropostas> = {};

    filteredPropostas.forEach((proposta) => {
      const monthKey = format(
        new Date(proposta.data_proposta + "T00:00:00"),
        "yyyy-MM"
      );
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(proposta);
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredPropostas]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Propostas</h1>
          </div>
          <p className="text-muted-foreground">
            Gerencie as propostas enviadas para as glebas
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && <ImportPropostasDialog />}
          <CreatePropostaDialog />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por gleba, número ou descrição..."
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
            <SelectItem value="month">Este Mês</SelectItem>
            <SelectItem value="custom">Período Personalizado</SelectItem>
          </SelectContent>
        </Select>

        {periodFilter === "custom" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-auto justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy")
                  )
                ) : (
                  <span>Selecionar datas</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        )}

        <Select value={tipoFilter} onValueChange={(v) => setTipoFilter(v as TipoFilter)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="compra">Compra</SelectItem>
            <SelectItem value="parceria">Parceria</SelectItem>
            <SelectItem value="mista">Mista</SelectItem>
          </SelectContent>
        </Select>

        <Select value={cidadeFilter} onValueChange={setCidadeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por cidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as cidades</SelectItem>
            {cidades.map((cidade) => (
              <SelectItem key={cidade.id} value={cidade.id}>
                {cidade.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredPropostas.length} proposta{filteredPropostas.length !== 1 && "s"} encontrada{filteredPropostas.length !== 1 && "s"}
      </p>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : filteredPropostas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma proposta encontrada</p>
          <p className="text-sm">Cadastre sua primeira proposta clicando no botão acima</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByMonth.map(([monthKey, monthPropostas]) => (
            <div key={monthKey}>
              <h3 className="text-lg font-semibold mb-3 capitalize">
                {format(new Date(monthKey + "-01"), "MMMM yyyy", { locale: ptBR })}
              </h3>
              <div className="space-y-3">
                {monthPropostas.map((proposta) => (
                  <PropostaCard 
                    key={proposta.id} 
                    proposta={proposta}
                    onClick={() => setSelectedProposta(proposta)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Proposta Details Dialog */}
      <PropostaDetailsDialog
        proposta={selectedProposta}
        open={!!selectedProposta}
        onOpenChange={(open) => !open && setSelectedProposta(null)}
      />
    </div>
  );
}
