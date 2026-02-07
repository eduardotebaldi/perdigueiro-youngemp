import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, Settings, CheckCircle, AlertCircle, Clock } from "lucide-react";

interface SyncStatus {
  lastSync: string | null;
  isConfigured: boolean;
  fileId: string | null;
}

export function GoogleDriveSyncConfig() {
  const [fileId, setFileId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    isConfigured: false,
    fileId: null,
  });

  useEffect(() => {
    loadConfig();
    loadLastSync();
  }, []);

  const loadConfig = async () => {
    const { data } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "google_drive_kml_file_id")
      .single();

    if (data?.value) {
      setFileId(data.value);
      setSyncStatus((prev) => ({ ...prev, isConfigured: true, fileId: data.value }));
    }
  };

  const loadLastSync = async () => {
    const { data } = await supabase
      .from("glebas")
      .select("last_sync_at")
      .not("last_sync_at", "is", null)
      .order("last_sync_at", { ascending: false })
      .limit(1)
      .single();

    if (data?.last_sync_at) {
      setSyncStatus((prev) => ({ ...prev, lastSync: data.last_sync_at }));
    }
  };

  const handleSaveConfig = async () => {
    if (!fileId.trim()) {
      toast.error("Informe o File ID do Google Drive");
      return;
    }

    setIsSaving(true);
    try {
      // Upsert na configuração
      const { error } = await supabase
        .from("system_config")
        .upsert(
          {
            key: "google_drive_kml_file_id",
            value: fileId.trim(),
            description: "ID do arquivo KML/KMZ no Google Drive para sincronização automática",
          },
          { onConflict: "key" }
        );

      if (error) throw error;

      setSyncStatus((prev) => ({ ...prev, isConfigured: true, fileId: fileId.trim() }));
      toast.success("Configuração salva! A sincronização automática está ativa.");
    } catch (error: any) {
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(
        "https://vvtympzatclvjaqucebr.supabase.co/functions/v1/sync-drive-glebas",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.session?.access_token}`,
          },
          body: JSON.stringify({}),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro na sincronização");
      }

      toast.success(result.message);
      loadLastSync();
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Nunca";
    return new Date(dateStr).toLocaleString("pt-BR");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Sincronização com Google Earth
        </CardTitle>
        <CardDescription>
          Configure a sincronização automática de glebas do seu arquivo KML no Google Drive.
          A sincronização ocorre automaticamente a cada 2 horas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
          {syncStatus.isConfigured ? (
            <CheckCircle className="h-5 w-5 text-primary" />
          ) : (
            <AlertCircle className="h-5 w-5 text-destructive" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium">
              {syncStatus.isConfigured ? "Sincronização configurada" : "Não configurado"}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Última sincronização: {formatDate(syncStatus.lastSync)}
            </p>
          </div>
        </div>

        {/* Configuração */}
        <div className="space-y-2">
          <Label htmlFor="fileId">File ID do Google Drive</Label>
          <div className="flex gap-2">
            <Input
              id="fileId"
              value={fileId}
              onChange={(e) => setFileId(e.target.value)}
              placeholder="Ex: 1ABC123def456..."
              className="flex-1"
            />
            <Button onClick={handleSaveConfig} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Para obter o File ID: abra o arquivo no Google Drive → clique com botão direito → 
            "Obter link" → copie o ID entre /d/ e /view
          </p>
        </div>

        {/* Sync Manual */}
        {syncStatus.isConfigured && (
          <Button
            variant="outline"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Sincronizando..." : "Sincronizar Agora"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
