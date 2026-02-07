import { useState, useRef } from "react";
import { useGlebas } from "@/hooks/useGlebas";
import { GlebaMap3D, parseKmzFile } from "@/components/map/GlebaMap3D";
import { GlebaCard } from "@/components/glebas/GlebaCard";
import { EditGlebaDialog } from "@/components/glebas/EditGlebaDialog";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { 
  Map, 
  Maximize2, 
  Minimize2, 
  Upload, 
  Layers, 
  Globe,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  CloudDownload
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Gleba = Tables<"glebas">;

const NETWORK_LINK_URL = "https://vvtympzatclvjaqucebr.supabase.co/functions/v1/serve-kml-network-link";
const SYNC_FUNCTION_URL = "https://vvtympzatclvjaqucebr.supabase.co/functions/v1/sync-drive-glebas";

export default function Mapa() {
  const { glebas, isLoading, createGleba, refetch } = useGlebas();
  const [selectedGleba, setSelectedGleba] = useState<Gleba | null>(null);
  const [editingGleba, setEditingGleba] = useState<Gleba | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [googleEarthDialogOpen, setGoogleEarthDialogOpen] = useState(false);
  const [driveFileId, setDriveFileId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const geojson = await parseKmzFile(file);
      
      // Extrair nome do arquivo como apelido
      const apelido = file.name.replace(/\.(kmz|kml)$/i, "");
      
      // Criar gleba com o polígono importado
      await createGleba({
        apelido: apelido,
        status: "identificada",
        poligono_geojson: geojson,
      });
      
      toast({
        title: "Gleba importada!",
        description: `"${apelido}" foi criada com sucesso a partir do arquivo KMZ/KML`,
      });
    } catch (error) {
      console.error("Erro ao importar KMZ:", error);
      toast({
        variant: "destructive",
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Não foi possível importar o arquivo",
      });
    } finally {
      setIsImporting(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(NETWORK_LINK_URL);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "Cole este link no Google Earth para sincronizar as glebas",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        variant: "destructive",
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link",
      });
    }
  };

  const handleSyncFromDrive = async () => {
    if (!driveFileId.trim()) {
      toast({
        variant: "destructive",
        title: "ID do arquivo obrigatório",
        description: "Cole o ID do arquivo KML do Google Drive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          variant: "destructive",
          title: "Não autenticado",
          description: "Você precisa estar logado para sincronizar",
        });
        return;
      }

      const response = await fetch(SYNC_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ fileId: driveFileId.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro na sincronização");
      }

      await refetch();

      toast({
        title: "Sincronização concluída!",
        description: `${result.imported} importadas, ${result.updated} atualizadas`,
      });
    } catch (error) {
      console.error("Erro na sincronização:", error);
      toast({
        variant: "destructive",
        title: "Erro na sincronização",
        description: error instanceof Error ? error.message : "Não foi possível sincronizar",
      });
    } finally {
      setIsSyncing(false);
    }
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
          {/* Google Earth Integration */}
          <Dialog open={googleEarthDialogOpen} onOpenChange={setGoogleEarthDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Globe className="h-4 w-4 mr-2" />
                Google Earth
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg z-50">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Integração Google Earth
                </DialogTitle>
                <DialogDescription>
                  Sincronize as glebas do sistema com o Google Earth Web usando Network Link
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Exportação - Network Link */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Exportação (Sistema → Earth)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Use este link no Google Earth para visualizar suas glebas em tempo real
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={NETWORK_LINK_URL}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyLink}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Importação - Drive Sync */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <CloudDownload className="h-4 w-4" />
                    Importação (Drive → Sistema)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Sincronize glebas de um arquivo KML no Google Drive
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="driveFileId">ID do Arquivo no Drive</Label>
                    <div className="flex gap-2">
                      <Input
                        id="driveFileId"
                        value={driveFileId}
                        onChange={(e) => setDriveFileId(e.target.value)}
                        placeholder="Ex: 1abc123def456..."
                        className="font-mono text-xs"
                      />
                      <Button
                        onClick={handleSyncFromDrive}
                        disabled={isSyncing}
                      >
                        {isSyncing ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      O ID está na URL do arquivo: drive.google.com/file/d/<strong>[ID]</strong>/view
                    </p>
                  </div>
                </div>

                {/* Instruções */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-sm">Como usar:</h4>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li><strong>Exportar:</strong> Copie o link acima e importe no Google Earth Web</li>
                    <li><strong>Importar:</strong> Compartilhe seu KML com a conta de serviço e cole o ID acima</li>
                    <li>A sincronização preserva status, preço e outros dados editados no sistema</li>
                  </ol>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.open(NETWORK_LINK_URL, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Baixar KML
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => window.open("https://earth.google.com/web", "_blank")}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Abrir Google Earth
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Importar KMZ */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? "Importando..." : "Importar KMZ"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".kmz,.kml"
            onChange={handleFileImport}
            className="hidden"
            disabled={isImporting}
          />

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
          "rounded-lg overflow-hidden border relative",
          isFullscreen ? "h-full" : "lg:col-span-3"
        )}>
          {!isLoading && (
            <GlebaMap3D 
              glebas={glebas} 
              onSelectGleba={setSelectedGleba}
              selectedGlebaId={selectedGleba?.id}
              isFullscreen={isFullscreen}
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