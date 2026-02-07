import { useState } from "react";
import { CreateGlebaDialog } from "@/components/glebas/CreateGlebaDialog";
import { EditGlebaDialog } from "@/components/glebas/EditGlebaDialog";
import { ImportGlebasDialog } from "@/components/glebas/ImportGlebasDialog";
import { GlebaKanban } from "@/components/glebas/GlebaKanban";
import { GlebaTable } from "@/components/glebas/GlebaTable";
import { GoogleDriveSyncConfig } from "@/components/glebas/GoogleDriveSyncConfig";
import { GoogleEarthIntegrationCard } from "@/components/glebas/GoogleEarthIntegrationCard";
import { Tables } from "@/integrations/supabase/types";
import { Kanban, Table2, Zap, Settings } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

type Gleba = Tables<"glebas">;
type ViewMode = "kanban" | "table";

export default function Glebas() {
  const [editingGleba, setEditingGleba] = useState<Gleba | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [showConfig, setShowConfig] = useState(false);
  const { isAdmin } = useAuth();

  return (
    <div className="space-y-6">
      {/* Config Section - Admin Only */}
      {isAdmin && (
        <Collapsible open={showConfig} onOpenChange={setShowConfig}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              {showConfig ? "Ocultar Integrações" : "Integrações Google Earth"}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            <GoogleEarthIntegrationCard />
            <GoogleDriveSyncConfig />
          </CollapsibleContent>
        </Collapsible>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {viewMode === "kanban" ? (
              <Kanban className="h-6 w-6 text-primary" />
            ) : (
              <Table2 className="h-6 w-6 text-primary" />
            )}
            <h1 className="text-3xl font-bold">
              {viewMode === "kanban" ? "Kanban de Glebas" : "Planilha de Glebas"}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {viewMode === "kanban"
              ? "Gerencie suas glebas arrastando-as entre os status"
              : "Visualize e filtre todas as suas glebas em formato de planilha"}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="kanban" className="gap-2">
                <Kanban className="h-4 w-4" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-2">
                <Table2 className="h-4 w-4" />
                Planilha
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {isAdmin && <ImportGlebasDialog />}
          <CreateGlebaDialog />
        </div>
      </div>

      {/* Edit Dialog */}
      <EditGlebaDialog
        gleba={editingGleba}
        open={!!editingGleba}
        onOpenChange={(open) => !open && setEditingGleba(null)}
      />

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <>
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
        </>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <GlebaTable onEditGleba={setEditingGleba} />
      )}
    </div>
  );
}
