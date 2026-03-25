import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Globe, Copy, ExternalLink, CheckCircle, Key, RefreshCw, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = "https://vvtympzatclvjaqucebr.supabase.co/functions/v1/serve-kml-network-link";

export function GoogleEarthIntegrationCard() {
  const [copiedLayer, setCopiedLayer] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadAccessToken();
  }, []);

  const loadAccessToken = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "kml_access_token")
        .single();

      if (data?.value) {
        setAccessToken(data.value);
      }
    } catch {
      // Token não configurado ainda
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewToken = async () => {
    setIsGenerating(true);
    try {
      // Gerar token aleatório seguro
      const array = new Uint8Array(24);
      crypto.getRandomValues(array);
      const newToken = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");

      const { error } = await supabase
        .from("system_config")
        .upsert(
          {
            key: "kml_access_token",
            value: newToken,
            description: "Token de acesso para o Network Link do Google Earth",
          },
          { onConflict: "key" }
        );

      if (error) throw error;

      setAccessToken(newToken);
      toast.success("Token de acesso gerado com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao gerar token: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const getFullUrl = (layer: string = "glebas") => {
    if (!accessToken) return null;
    return `${BASE_URL}?token=${accessToken}&layer=${layer}`;
  };

  const handleCopyLink = async (layer: string = "glebas") => {
    const fullUrl = getFullUrl(layer);
    if (!fullUrl) {
      toast.error("Gere um token de acesso primeiro");
      return;
    }

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedLayer(layer);
      toast.success("Link copiado para a área de transferência!");
      setTimeout(() => setCopiedLayer(null), 2000);
    } catch {
      toast.error("Erro ao copiar link");
    }
  };

  const handleOpenDocs = () => {
    window.open("https://support.google.com/earth/answer/7365595", "_blank");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Integração Google Earth Pro
        </CardTitle>
        <CardDescription>
          Visualize todas as glebas em tempo real no Google Earth Pro Desktop.
          Os dados são atualizados automaticamente a cada 60 segundos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Token de Acesso */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Token de Acesso (Segurança)
          </Label>
          <div className="flex gap-2">
            <Input
              value={accessToken ? `${accessToken.slice(0, 8)}...${accessToken.slice(-8)}` : "Nenhum token configurado"}
              readOnly
              className="font-mono text-xs"
              disabled={isLoading}
            />
            <Button
              onClick={generateNewToken}
              variant="outline"
              disabled={isGenerating || isLoading}
              className="shrink-0 gap-2"
            >
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Key className="h-4 w-4" />
              )}
              {accessToken ? "Regenerar" : "Gerar Token"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            O token protege o acesso aos dados. Regenerar invalidará o link anterior.
          </p>
        </div>

        {/* URLs do Network Link */}
        <div className="space-y-3">
          <Label>Links de Rede (Network Links)</Label>
          {[
            { layer: "glebas", label: "Glebas", desc: "Apenas polígonos de glebas" },
            { layer: "pesquisa", label: "Pesquisa de Mercado", desc: "Apenas PINs de pesquisa" },
            { layer: "all", label: "Tudo", desc: "Glebas + Pesquisa de Mercado" },
          ].map(({ layer, label, desc }) => (
            <div key={layer} className="flex gap-2 items-center">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{label} <span className="text-muted-foreground font-normal">— {desc}</span></p>
                <Input
                  value={accessToken ? getFullUrl(layer) || "" : "Gere um token primeiro..."}
                  readOnly
                  className="font-mono text-xs mt-1"
                  disabled={!accessToken}
                />
              </div>
              <Button
                onClick={() => handleCopyLink(layer)}
                variant={copiedLayer === layer ? "default" : "outline"}
                className="shrink-0 gap-2 mt-5"
                size="sm"
                disabled={!accessToken}
              >
                {copiedLayer === layer ? <><CheckCircle className="h-4 w-4" />Copiado!</> : <><Copy className="h-4 w-4" />Copiar</>}
              </Button>
            </div>
          ))}
        </div>

        {/* Instruções */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-3">
          <h4 className="font-medium text-sm">Como usar no Google Earth Pro:</h4>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Clique em <strong>"Gerar Token"</strong> acima (se ainda não tiver)</li>
            <li>Copie o <strong>Link de Rede</strong> completo</li>
            <li>Abra o <strong>Google Earth Pro</strong> no seu computador</li>
            <li>Vá em <strong>Adicionar → Link de Rede</strong></li>
            <li>Cole a URL no campo <strong>"Link"</strong></li>
            <li>Nomeie como "Perdigueiro - Glebas"</li>
            <li>Clique em <strong>OK</strong> para adicionar</li>
          </ol>
        </div>

        {/* Legenda de Cores */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Legenda de Cores:</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#ef4444" }} />
              <span>Identificada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#f97316" }} />
              <span>Info. Recebidas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#eab308" }} />
              <span>Visita Realizada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#3b82f6" }} />
              <span>Proposta Enviada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#22c55e" }} />
              <span>Protocolo Assinado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#15803d" }} />
              <span>Negócio Fechado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#6b7280" }} />
              <span>Descartada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#991b1b" }} />
              <span>Proposta Recusada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#a855f7" }} />
              <span>Standby</span>
            </div>
          </div>
        </div>

        {/* Link para documentação */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenDocs}
          className="gap-2 text-muted-foreground"
        >
          <ExternalLink className="h-4 w-4" />
          Ver documentação do Google Earth
        </Button>
      </CardContent>
    </Card>
  );
}
