import { useState } from "react";
import { useGlebas } from "@/hooks/useGlebas";
import { GlebaMap } from "@/components/map/GlebaMap";
import { GlebaCard } from "@/components/glebas/GlebaCard";
import { EditGlebaDialog } from "@/components/glebas/EditGlebaDialog";
import { Tables } from "@/integrations/supabase/types";
import { Map, Sidebar } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Gleba = Tables<"glebas">;

export default function Mapa() {
  const { glebas, isLoading } = useGlebas();
  const [selectedGleba, setSelectedGleba] = useState<Gleba | null>(null);
  const [editingGleba, setEditingGleba] = useState<Gleba | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Map className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Mapa Integrado</h1>
      </div>

      {/* Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[600px]">
        <div className="lg:col-span-3 rounded-lg overflow-hidden border">
          {!isLoading && <GlebaMap glebas={glebas} onSelectGleba={setSelectedGleba} />}
        </div>

        {/* Legenda */}
        <div className="rounded-lg border p-4 overflow-y-auto">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Sidebar className="h-4 w-4" />
            Legenda
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: "#3b82f6" }}
              />
              <span>Identificada</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: "#06b6d4" }}
              />
              <span>Informações Recebidas</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: "#14b8a6" }}
              />
              <span>Visita Realizada</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: "#f59e0b" }}
              />
              <span>Proposta Enviada</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: "#f97316" }}
              />
              <span>Protocolo Assinado</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: "#ef4444" }}
              />
              <span>Descartada</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: "#f43f5e" }}
              />
              <span>Proposta Recusada</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: "#22c55e" }}
              />
              <span>Negócio Fechado</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: "#a855f7" }}
              />
              <span>Standby</span>
            </div>
          </div>

          <div className="border-t mt-4 pt-4">
            <h4 className="text-sm font-medium mb-2">Glebas ({glebas.length})</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {glebas.map((gleba) => (
                <div
                  key={gleba.id}
                  onClick={() => setSelectedGleba(gleba)}
                  className="p-2 rounded border cursor-pointer hover:bg-muted text-xs transition-colors"
                >
                  <div className="font-medium truncate">{gleba.apelido}</div>
                  <div className="text-muted-foreground text-xs">
                    {gleba.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Gleba Sheet */}
      <Sheet open={!!selectedGleba} onOpenChange={(open) => !open && setSelectedGleba(null)}>
        <SheetContent side="bottom" className="h-[300px]">
          <SheetHeader>
            <SheetTitle>{selectedGleba?.apelido}</SheetTitle>
          </SheetHeader>
          {selectedGleba && (
            <div className="mt-4">
              <GlebaCard 
                gleba={selectedGleba} 
                onEdit={(g) => {
                  setEditingGleba(g);
                  setSelectedGleba(null);
                }}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Dialog */}
      <EditGlebaDialog
        gleba={editingGleba}
        open={!!editingGleba}
        onOpenChange={(open) => !open && setEditingGleba(null)}
      />
    </div>
  );
}