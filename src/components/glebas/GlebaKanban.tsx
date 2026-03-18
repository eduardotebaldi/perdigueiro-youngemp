import { useCallback, useState, useMemo, useRef } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { useGlebas, STATUS_ORDER, STATUS_LABELS } from "@/hooks/useGlebas";
import { useCidades } from "@/hooks/useCidades";
import { GlebaCard } from "./GlebaCard";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronLeft, ChevronRight, Search, Star, ChevronsLeft, ChevronsRight, MapPin, X, MessageSquareOff, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";
import { validateGlebaStatus } from "@/lib/glebaValidation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

type Gleba = Tables<"glebas">;

interface KanbanColumnProps {
  status: string;
  glebas: Gleba[];
  onViewGleba?: (gleba: Gleba) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  inactiveGlebaIds: Set<string>;
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

function DraggableGlebaCard({ gleba, onViewGleba, showInactiveIcon }: { gleba: Gleba; onViewGleba?: (gleba: Gleba) => void; showInactiveIcon: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: gleba.id,
    data: { gleba },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn("touch-none", isDragging && "opacity-30")}
      onClick={() => onViewGleba?.(gleba)}
    >
      <GlebaCard gleba={gleba} showInactiveIcon={showInactiveIcon} />
    </div>
  );
}

function KanbanColumn({ status, glebas, onViewGleba, isCollapsed, onToggleCollapse, inactiveGlebaIds }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { status },
  });

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
      ref={setNodeRef}
      className={cn(
        "flex flex-col bg-muted/30 rounded-lg p-4 border-2 min-h-[600px] flex-shrink-0 transition-all duration-300",
        STATUS_COLORS[status],
        isOver && "ring-2 ring-primary bg-primary/5",
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

      <div className="space-y-3 flex-1">
        {glebas.map((gleba) => (
          <DraggableGlebaCard
            key={gleba.id}
            gleba={gleba}
            onViewGleba={onViewGleba}
            showInactiveIcon={inactiveGlebaIds.has(gleba.id)}
          />
        ))}
        {glebas.length === 0 && (
          <div className="flex items-center justify-center h-20 text-muted-foreground">
            <p className="text-sm text-center">Nenhuma gleba neste status</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface GlebaKanbanProps {
  onViewGleba?: (gleba: Gleba) => void;
}

export function GlebaKanban({ onViewGleba }: GlebaKanbanProps) {
  const { glebas, isLoading, updateGlebaStatus } = useGlebas();
  const { cidades } = useCidades();
  const { toast } = useToast();
  
  const [activeGleba, setActiveGleba] = useState<Gleba | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState(false);
  const [filterInactive, setFilterInactive] = useState(false);
  const [filterStale, setFilterStale] = useState(false);
  const [filterPending, setFilterPending] = useState(false);
  const [selectedCidades, setSelectedCidades] = useState<Set<string>>(new Set());
  const [cidadeSearchTerm, setCidadeSearchTerm] = useState("");
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set());

  // Fetch atividades to detect inactive glebas (no comments in last 10 days)
  const { data: recentAtividades } = useQuery({
    queryKey: ["atividades_recent_10d"],
    queryFn: async () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      const { data, error } = await supabase
        .from("atividades")
        .select("gleba_id")
        .gte("created_at", tenDaysAgo.toISOString());
      if (error) throw error;
      return data;
    },
  });

  const activeGlebaIds = useMemo(() => {
    if (!recentAtividades) return new Set<string>();
    return new Set(recentAtividades.map((a) => a.gleba_id).filter(Boolean) as string[]);
  }, [recentAtividades]);

  const inactiveGlebaIds = useMemo(() => {
    const excludedStatuses = ["descartada", "negocio_fechado", "proposta_recusada", "standby"];
    return new Set(
      glebas
        .filter((g) => !excludedStatuses.includes(g.status) && !activeGlebaIds.has(g.id))
        .map((g) => g.id)
    );
  }, [glebas, activeGlebaIds]);

  // Cidades used by glebas for the filter
  const usedCidades = useMemo(() => {
    if (!cidades) return [];
    const cidadeIdsInUse = new Set(glebas.map((g) => g.cidade_id).filter(Boolean));
    return cidades.filter((c) => cidadeIdsInUse.has(c.id));
  }, [cidades, glebas]);

  const toggleCidade = (cidadeId: string) => {
    setSelectedCidades((prev) => {
      const next = new Set(prev);
      if (next.has(cidadeId)) next.delete(cidadeId);
      else next.add(cidadeId);
      return next;
    });
  };

  const sixtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 60);
    return d;
  }, []);

  const filteredGlebas = useMemo(() => {
    let result = glebas;
    if (filterPriority) {
      result = result.filter((g) => g.prioridade);
    }
    if (filterInactive) {
      result = result.filter((g) => inactiveGlebaIds.has(g.id));
    }
    if (filterStale) {
      const excludedStatuses = ["descartada", "negocio_fechado"];
      result = result.filter((g) => !excludedStatuses.includes(g.status) && new Date(g.updated_at) < sixtyDaysAgo);
    }
    if (selectedCidades.size > 0) {
      result = result.filter((g) => g.cidade_id && selectedCidades.has(g.cidade_id));
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter((gleba) => {
        const matchesApelido = gleba.apelido.toLowerCase().includes(term);
        const matchesNumero = gleba.numero?.toString().includes(term);
        return matchesApelido || matchesNumero;
      });
    }
    return result;
  }, [glebas, searchTerm, filterPriority, filterInactive, filterStale, selectedCidades, inactiveGlebaIds, sixtyDaysAgo]);

  const getFilteredGlebasByStatus = useCallback((status: string) => {
    return filteredGlebas.filter((g) => g.status === status);
  }, [filteredGlebas]);

  const toggleColumnCollapse = (status: string) => {
    setCollapsedColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(status)) newSet.delete(status);
      else newSet.add(status);
      return newSet;
    });
  };

  const allCollapsed = collapsedColumns.size === STATUS_ORDER.length;
  const toggleCollapseAll = () => {
    if (allCollapsed) {
      setCollapsedColumns(new Set());
    } else {
      setCollapsedColumns(new Set(STATUS_ORDER));
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const gleba = glebas.find((g) => g.id === event.active.id);
    setActiveGleba(gleba || null);
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveGleba(null);
      const { active, over } = event;
      if (!over) return;

      const glebaId = active.id as string;
      const overId = over.id as string;

      let newStatus: string | null = null;
      if (overId.startsWith("column-")) {
        newStatus = overId.replace("column-", "");
      } else {
        const targetGleba = glebas.find((g) => g.id === overId);
        if (targetGleba) newStatus = targetGleba.status;
      }
      if (!newStatus) return;

      const gleba = glebas.find((g) => g.id === glebaId);
      if (!gleba || gleba.status === newStatus) return;

      try {
        await updateGlebaStatus(glebaId, newStatus);

        // Celebration animation for "negocio_fechado"
        if (newStatus === "negocio_fechado") {
          // Confetti burst
          const end = Date.now() + 2000;
          const colors = ["#22c55e", "#16a34a", "#fbbf24", "#f59e0b", "#3b82f6"];
          const frame = () => {
            confetti({
              particleCount: 3,
              angle: 60,
              spread: 55,
              origin: { x: 0, y: 0.7 },
              colors,
            });
            confetti({
              particleCount: 3,
              angle: 120,
              spread: 55,
              origin: { x: 1, y: 0.7 },
              colors,
            });
            if (Date.now() < end) requestAnimationFrame(frame);
          };
          frame();

          // Celebration sound
          try {
            const audioCtx = new AudioContext();
            const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
            notes.forEach((freq, i) => {
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.type = "sine";
              osc.frequency.value = freq;
              gain.gain.setValueAtTime(0.15, audioCtx.currentTime + i * 0.12);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.12 + 0.5);
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.start(audioCtx.currentTime + i * 0.12);
              osc.stop(audioCtx.currentTime + i * 0.12 + 0.5);
            });
          } catch {}
        }

        toast({
          title: newStatus === "negocio_fechado" ? "🎉 Negócio fechado!" : "Status atualizado",
          description: `"${gleba.apelido}" movida para ${STATUS_LABELS[newStatus]}`,
        });
      } catch {
        toast({
          title: "Erro ao atualizar status",
          description: "Não foi possível mover a gleba.",
          variant: "destructive",
        });
      }
    },
    [glebas, updateGlebaStatus, toast]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filtros - single row, no wrap */}
      <div className="flex items-center gap-2 overflow-x-auto">
        <div className="relative min-w-[140px] max-w-[180px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-7 h-7 text-xs"
          />
          {searchTerm && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
              {filteredGlebas.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 border rounded px-1.5 py-0.5 shrink-0">
          <Switch id="filter-priority" checked={filterPriority} onCheckedChange={setFilterPriority} className="scale-[0.65]" />
          <Label htmlFor="filter-priority" className="flex items-center gap-0.5 cursor-pointer text-[11px] whitespace-nowrap">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            Prioritárias
          </Label>
        </div>

        <div className="flex items-center gap-1 border rounded px-1.5 py-0.5 shrink-0">
          <Switch id="filter-inactive" checked={filterInactive} onCheckedChange={setFilterInactive} className="scale-[0.65]" />
          <Label htmlFor="filter-inactive" className="flex items-center gap-0.5 cursor-pointer text-[11px] whitespace-nowrap">
            <MessageSquareOff className="h-3 w-3 text-orange-500" />
            S/ atualização
          </Label>
        </div>

        <div className="flex items-center gap-1 border rounded px-1.5 py-0.5 shrink-0">
          <Switch id="filter-stale" checked={filterStale} onCheckedChange={setFilterStale} className="scale-[0.65]" />
          <Label htmlFor="filter-stale" className="flex items-center gap-0.5 cursor-pointer text-[11px] whitespace-nowrap">
            <Clock className="h-3 w-3 text-red-500" />
            60d+
          </Label>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-0.5 h-7 text-[11px] shrink-0">
              <MapPin className="h-3 w-3" />
              Cidades
              {selectedCidades.size > 0 && (
                <Badge variant="secondary" className="ml-0.5 h-3.5 px-1 text-[9px]">
                  {selectedCidades.size}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="mb-2">
              <Input
                placeholder="Buscar cidade..."
                value={cidadeSearchTerm}
                onChange={(e) => setCidadeSearchTerm(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {usedCidades.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma cidade disponível</p>
              ) : (
                usedCidades
                  .filter((c) => c.nome.toLowerCase().includes(cidadeSearchTerm.toLowerCase().trim()))
                  .map((cidade) => (
                    <label key={cidade.id} className="flex items-center gap-2 cursor-pointer text-sm hover:bg-muted/50 rounded px-1 py-0.5">
                      <Checkbox
                        checked={selectedCidades.has(cidade.id)}
                        onCheckedChange={() => toggleCidade(cidade.id)}
                      />
                      {cidade.nome}
                    </label>
                  ))
              )}
            </div>
            {selectedCidades.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs"
                onClick={() => setSelectedCidades(new Set())}
              >
                <X className="h-3 w-3 mr-1" />
                Limpar filtro
              </Button>
            )}
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleCollapseAll}
          className="gap-0.5 h-7 text-[11px] shrink-0"
        >
          {allCollapsed ? (
            <>
              <ChevronsRight className="h-3 w-3" />
              Expandir
            </>
          ) : (
            <>
              <ChevronsLeft className="h-3 w-3" />
              Colapsar
            </>
          )}
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
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
                inactiveGlebaIds={inactiveGlebaIds}
              />
            ))}
          </div>
        </div>
        <DragOverlay>
          {activeGleba ? (
            <div className="w-80 opacity-80">
              <GlebaCard gleba={activeGleba} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
