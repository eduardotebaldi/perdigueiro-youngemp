import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Globe, Copy, ExternalLink, CheckCircle } from "lucide-react";

const NETWORK_LINK_URL = "https://vvtympzatclvjaqucebr.supabase.co/functions/v1/serve-kml-network-link";

export function GoogleEarthIntegrationCard() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(NETWORK_LINK_URL);
      setCopied(true);
      toast.success("Link copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
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
        {/* URL do Network Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Link de Rede (Network Link)</label>
          <div className="flex gap-2">
            <Input
              value={NETWORK_LINK_URL}
              readOnly
              className="font-mono text-xs"
            />
            <Button 
              onClick={handleCopyLink} 
              variant={copied ? "default" : "outline"}
              className="shrink-0 gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Instruções */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-3">
          <h4 className="font-medium text-sm">Como usar no Google Earth Pro:</h4>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Abra o <strong>Google Earth Pro</strong> no seu computador</li>
            <li>Vá em <strong>Adicionar → Link de Rede</strong></li>
            <li>Cole a URL acima no campo <strong>"Link"</strong></li>
            <li>Nomeie como "Glebas - Young Empreendimentos"</li>
            <li>Clique em <strong>OK</strong> para adicionar</li>
          </ol>
        </div>

        {/* Legenda de Cores */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Legenda de Cores:</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-red-500" />
              <span>Identificada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-orange-500" />
              <span>Info. Recebidas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-yellow-500" />
              <span>Visita Realizada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-blue-500" />
              <span>Proposta Enviada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-green-500" />
              <span>Protocolo Assinado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-green-700" />
              <span>Negócio Fechado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-gray-500" />
              <span>Descartada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-red-800" />
              <span>Proposta Recusada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-purple-500" />
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
