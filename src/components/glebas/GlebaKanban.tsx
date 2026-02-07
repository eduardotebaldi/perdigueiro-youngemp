import { useCallback } from "react";
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
import { Loader2 } from "lucide-react";

type Gleba = Tables<"glebas">;

interface KanbanColumnProps {
  status: string;
  glebas: Gleba[];
  onViewGleba?: (gleba: Gleba) => void;
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

function KanbanColumn({ status, glebas, onViewGleba }: KanbanColumnProps) {
  return (
    <div className={`flex flex-col bg-muted/30 rounded-lg p-4 border-2 ${STATUS_COLORS[status]} min-h-[600px] flex-shrink-0 w-80`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">{STATUS_LABELS[status]}</h3>
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
              glebas={getGlebasByStatus(status)}
              onViewGleba={onViewGleba}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}
