import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, FileText, MapPin, Building2, Tag, ExternalLink, Clock, Loader2, DollarSign, Percent } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PropostaWithGleba, usePropostas } from "@/hooks/usePropostas";
import { toast } from "sonner";

interface PropostaDetailsDialogProps {
  proposta: PropostaWithGleba | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIPO_LABELS: Record<string, string> = {
  compra: "Compra",
  parceria: "Parceria",
  mista: "Mista",
};

const TIPO_COLORS: Record<string, string> = {
  compra: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  parceria: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  mista: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
};

export function PropostaDetailsDialog({ proposta, open, onOpenChange }: PropostaDetailsDialogProps) {
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const { getCartaPropostaUrl } = usePropostas();

  if (!proposta) return null;

  const handleOpenFile = async () => {
    if (!proposta.arquivo_carta) return;
    
    setIsLoadingFile(true);
    try {
      // Extract the storage path from the URL if it's a full URL
      let storagePath = proposta.arquivo_carta;
      
      // Handle various URL formats from Supabase storage
      if (storagePath.includes("supabase.co/storage/v1/object/")) {
        // Extract path after the bucket name (propostas/)
        const match = storagePath.match(/\/storage\/v1\/object\/(?:public\/)?propostas\/(.+)/);
        if (match) {
          storagePath = match[1];
        }
      }
      
      const signedUrl = await getCartaPropostaUrl(storagePath);
      if (signedUrl) {
        window.open(signedUrl, "_blank");
      } else {
        toast.error("Não foi possível acessar o arquivo");
      }
    } catch (error) {
      console.error("Error getting signed URL:", error);
      toast.error("Erro ao acessar o arquivo");
    } finally {
      setIsLoadingFile(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Detalhes da Proposta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Gleba Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-semibold">Gleba</span>
            </div>
            <div className="flex items-center gap-2">
              {proposta.gleba?.numero && (
                <span className="text-sm font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
                  #{proposta.gleba.numero}
                </span>
              )}
              <span className="font-medium">
                {proposta.gleba?.apelido || "Gleba removida"}
              </span>
            </div>
            {proposta.cidade && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Building2 className="h-4 w-4" />
                <span>{proposta.cidade.nome}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Proposta Details */}
          <div className="grid gap-4">
            {/* Tipo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span>Tipo</span>
              </div>
              <Badge className={TIPO_COLORS[proposta.tipo] || ""} variant="outline">
                {TIPO_LABELS[proposta.tipo] || proposta.tipo}
              </Badge>
            </div>

            {/* Data */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Data da Proposta</span>
              </div>
              <span className="font-medium">
                {format(new Date(proposta.data_proposta + "T00:00:00"), "PPP", {
                  locale: ptBR,
                })}
              </span>
            </div>

            {/* Preço por hectare - only for compra/mista */}
            {(proposta.tipo === "compra" || proposta.tipo === "mista") && (proposta as any).preco_ha && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Preço/ha</span>
                </div>
                <span className="font-medium text-green-600">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format((proposta as any).preco_ha)}
                </span>
              </div>
            )}

            {/* Percentual proposto - only for parceria/mista */}
            {(proposta.tipo === "parceria" || proposta.tipo === "mista") && (proposta as any).percentual_proposto && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Percent className="h-4 w-4" />
                  <span>Percentual Proposto</span>
                </div>
                <span className="font-medium text-purple-600">
                  {(proposta as any).percentual_proposto}%
                </span>
              </div>
            )}

            {/* Created At */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Cadastrada em</span>
              </div>
              <span className="text-sm">
                {format(new Date(proposta.created_at), "dd/MM/yyyy HH:mm", {
                  locale: ptBR,
                })}
              </span>
            </div>
          </div>

          {/* Responsável */}
          {proposta.descricao && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Responsável</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {proposta.descricao}
                </p>
              </div>
            </>
          )}

          {/* Arquivo */}
          {proposta.arquivo_carta && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Carta-Proposta</h4>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleOpenFile}
                  disabled={isLoadingFile}
                >
                  {isLoadingFile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}
                  {isLoadingFile ? "Carregando..." : "Abrir Arquivo"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
