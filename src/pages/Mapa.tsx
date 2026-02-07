import { useState, useRef } from "react";
import { useGlebas } from "@/hooks/useGlebas";
import { GlebaMap, parseKmzFile } from "@/components/map/GlebaMap";
import { GlebaCard } from "@/components/glebas/GlebaCard";
import { EditGlebaDialog } from "@/components/glebas/EditGlebaDialog";
import { Tables } from "@/integrations/supabase/types";
import { 
  Map, 
  Maximize2, 
  Minimize2, 
  Upload, 
  Layers, 
  X,
  MapPin,
  Satellite
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Gleba = Tables<"glebas">;
type MapType = "street" | "satellite" | "hybrid";

export default function Mapa() {
  const { glebas, isLoading } = useGlebas();
  const [selectedGleba, setSelectedGleba] = useState<Gleba | null>(null);
  const [editingGleba, setEditingGleba] = useState<Gleba | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapType, setMapType] = useState<MapType>("street");
  const [importedGeoJson, setImportedGeoJson] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const geojson = await parseKmzFile(file);
      setImportedGeoJson(geojson);
      toast({
        title: "Arquivo importado!",
        description: `${file.name} carregado com sucesso`,
      });
    } catch (error) {
      console.error("Erro ao importar KMZ:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível importar o arquivo",
      });
    }

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const mapTypeLabels: Record<MapType, { label: string; icon: React.ReactNode }> = {
    street: { label: "Ruas", icon: <MapPin className="h-4 w-4" /> },
    satellite: { label: "Satélite", icon: <Satellite className="h-4 w-4" /> },
    hybrid: { label: "Híbrido", icon: <Layers className="h-4 w-4" /> },
  };

  return (
    <div className={cn(
      "space-y-6",
      isFullscreen && "fixed inset-0 z-50 bg-background p-4"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Map className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Mapa Integrado</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Importar KMZ */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar KMZ
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".kmz,.kml"
            onChange={handleFileImport}
            className="hidden"
          />

          {/* Tipo de Mapa */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {mapTypeLabels[mapType].icon}
                <span className="ml-2">{mapTypeLabels[mapType].label}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setMapType("street")}>
                <MapPin className="h-4 w-4 mr-2" />
                Ruas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMapType("satellite")}>
                <Satellite className="h-4 w-4 mr-2" />
                Satélite
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMapType("hybrid")}>
                <Layers className="h-4 w-4 mr-2" />
                Híbrido
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Fullscreen */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-4 w-4 mr-2" />
                Sair
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 mr-2" />
                Tela Cheia
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div className={cn(
        "grid gap-4",
        isFullscreen 
          ? "grid-cols-1 h-[calc(100vh-120px)]" 
          : "grid-cols-1 lg:grid-cols-4 h-[600px]"
      )}>
        <div className={cn(
          "rounded-lg overflow-hidden border",
          isFullscreen ? "h-full" : "lg:col-span-3"
        )}>
          {!isLoading && (
            <GlebaMap 
              glebas={glebas} 
              onSelectGleba={setSelectedGleba}
              isFullscreen={isFullscreen}
              mapType={mapType}
            />
          )}
        </div>

        {/* Sidebar - Esconde em fullscreen */}
        {!isFullscreen && (
          <div className="rounded-lg border p-4 overflow-y-auto">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Legenda
            </h3>
            <div className="space-y-2">
              {[
                { status: "identificada", color: "#3b82f6", label: "Identificada" },
                { status: "informacoes_recebidas", color: "#06b6d4", label: "Info. Recebidas" },
                { status: "visita_realizada", color: "#14b8a6", label: "Visita Realizada" },
                { status: "proposta_enviada", color: "#f59e0b", label: "Proposta Enviada" },
                { status: "protocolo_assinado", color: "#f97316", label: "Protocolo Assinado" },
                { status: "descartada", color: "#ef4444", label: "Descartada" },
                { status: "proposta_recusada", color: "#f43f5e", label: "Proposta Recusada" },
                { status: "negocio_fechado", color: "#22c55e", label: "Negócio Fechado" },
                { status: "standby", color: "#a855f7", label: "Standby" },
              ].map((item) => (
                <div key={item.status} className="flex items-center gap-2 text-xs">
                  <div
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="border-t mt-4 pt-4">
              <h4 className="text-sm font-medium mb-2">Glebas ({glebas.length})</h4>
              <div className="space-y-2 max-h-[250px] overflow-y-auto scrollbar-thin">
                {glebas.map((gleba) => (
                  <div
                    key={gleba.id}
                    onClick={() => setSelectedGleba(gleba)}
                    className="p-2 rounded border cursor-pointer hover:bg-muted text-xs transition-colors"
                  >
                    <div className="font-medium truncate">{gleba.apelido}</div>
                    <div className="text-muted-foreground capitalize">
                      {gleba.status.replace(/_/g, " ")}
                    </div>
                  </div>
                ))}
                {glebas.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma gleba cadastrada
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
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