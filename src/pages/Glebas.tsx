import { useState } from "react";
import { CreateGlebaDialog } from "@/components/glebas/CreateGlebaDialog";
import { GlebaKanban } from "@/components/glebas/GlebaKanban";
import { Tables } from "@/integrations/supabase/types";
import { Kanban, Zap } from "lucide-react";

type Gleba = Tables<"glebas">;

export default function Glebas() {
  const [editingGleba, setEditingGleba] = useState<Gleba | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Kanban className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Kanban de Glebas</h1>
          </div>
          <p className="text-muted-foreground">
            Gerencie suas glebas arrastando-as entre os status
          </p>
        </div>
        <CreateGlebaDialog />
      </div>

      {/* Info Card */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3">
        <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-sm">Dica: Arraste os cards entre as colunas</p>
          <p className="text-sm text-muted-foreground">
            O status será atualizado automaticamente quando você mover uma gleba
          </p>
        </div>
      </div>

      {/* Kanban Board */}
      <GlebaKanban onEditGleba={setEditingGleba} />
    </div>
  );
}