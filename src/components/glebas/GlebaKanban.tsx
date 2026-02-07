import { useCallback, useState, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useGlebas, STATUS_ORDER, STATUS_LABELS } from "@/hooks/useGlebas";
import { GlebaCard } from "./GlebaCard";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Gleba = Tables<"glebas">;

interface KanbanColumnProps {
  status: string;
  glebas: Gleba[];
  onViewGleba?: (gleba: Gleba) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  identificada: "border-blue-200 dark:border-blue-800",
  informacoes_recebidas: "border-cyan-200 dark:border-cyan-800",
  visita_realizada: "border-teal-200 dark:border-teal-800",
  proposta_enviada: "border-amber-200 dark:border-amber-800",
  protocolo_assinado: "border-orange-200 dark:border-orange-800",
  descartada: "border-red-200 dark:border-red-800",
  proposta_recusada: "border-rose-200 dark:border-rose-800",
  negocio_fechado: "border-green-200 dark:border-green-800",
  standby: "border-purple-200 dark:border-purple-800",
};

const BADGE_COLORS: Record<string, string> = {
  identificada: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  informacoes_recebidas: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  visita_realizada: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  proposta_enviada: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  protocolo_assinado: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  descartada: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  proposta_recusada: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
  negocio_fechado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  standby: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

function KanbanColumn({ status, glebas, onViewGleba, isCollapsed, onToggleCollapse }: KanbanColumnProps) {
  if (isCollapsed) {
    return (
      <div
        className={cn(
          "flex flex-col bg-muted/30 rounded-lg border-2 min-h-[600px] flex-shrink-0 cursor-pointer transition-all duration-300 hover:bg-muted/50",
          STATUS_COLORS[status],
          "w-14 p-2"
        )}
        onClick={onToggleCollapse}
        title={`${STATUS_LABELS[status]} - Clique para expandir`}
      >
        <div className="flex flex-col items-center gap-3">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Badge variant="secondary" className={cn("text-xs", BADGE_COLORS[status])}>
            {glebas.length}
          </Badge>
          <span
            className="text-xs font-medium text-muted-foreground writing-mode-vertical whitespace-nowrap"
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
          >
            {STATUS_LABELS[status]}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col bg-muted/30 rounded-lg p-4 border-2 min-h-[600px] flex-shrink-0 transition-all duration-300",
        STATUS_COLORS[status],
        "w-80"
      )}
    >
      <div
        className="flex items-center justify-between mb-4 cursor-pointer hover:opacity-70 transition-opacity"
        onClick={onToggleCollapse}
        title="Clique para colapsar"
      >
        <div className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">{STATUS_LABELS[status]}</h3>
        </div>
        <Badge variant="secondary" className={BADGE_COLORS[status]}>
          {glebas.length}
        </Badge>
      </div>

      <SortableContext
        items={glebas.map((g) => g.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3 flex-1">
          {glebas.map((gleba) => (
            <div key={gleba.id} draggable onClick={() => onViewGleba?.(gleba)}>
              <GlebaCard gleba={gleba} />
            </div>
          ))}
          {glebas.length === 0 && (
            <div className="flex items-center justify-center h-20 text-muted-foreground">
              <p className="text-sm text-center">Nenhuma gleba neste status</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

interface GlebaKanbanProps {
  onViewGleba?: (gleba: Gleba) => void;
}

export function GlebaKanban({ onViewGleba }: GlebaKanbanProps) {
  const { glebas, isLoading, getGlebasByStatus } = useGlebas();
  const { toast } = useToast();
  
  // Estado para pesquisa
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estado para colunas colapsadas
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set());

  // Filtrar glebas por número ou apelido
  const filteredGlebas = useMemo(() => {
    if (!searchTerm.trim()) return glebas;
    
    const term = searchTerm.toLowerCase().trim();
    return glebas.filter((gleba) => {
      const matchesApelido = gleba.apelido.toLowerCase().includes(term);
      const matchesNumero = gleba.numero?.toString().includes(term);
      return matchesApelido || matchesNumero;
    });
  }, [glebas, searchTerm]);

  // Função para obter glebas filtradas por status
  const getFilteredGlebasByStatus = useCallback((status: string) => {
    return filteredGlebas.filter((g) => g.status === status);
  }, [filteredGlebas]);

  const toggleColumnCollapse = (status: string) => {
    setCollapsedColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      toast({
        title: "Aviso",
        description: "Drag and drop será implementado em breve com interatividade completa.",
      });
    },
    [toast]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Campo de pesquisa */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por número ou apelido..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        {searchTerm && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {filteredGlebas.length} resultado{filteredGlebas.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-min">
            {STATUS_ORDER.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                glebas={getFilteredGlebasByStatus(status)}
                onViewGleba={onViewGleba}
                isCollapsed={collapsedColumns.has(status)}
                onToggleCollapse={() => toggleColumnCollapse(status)}
              />
            ))}
          </div>
        </div>
      </DndContext>
    </div>
  );
}
