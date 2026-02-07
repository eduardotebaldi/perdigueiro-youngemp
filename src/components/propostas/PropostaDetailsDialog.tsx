import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, FileText, MapPin, Building2, Tag, ExternalLink, Clock, Loader2, DollarSign, Percent, Pencil, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [isEditing, setIsEditing] = useState(false);
  const [precoHa, setPrecoHa] = useState<string>("");
  const [percentualProposto, setPercentualProposto] = useState<string>("");
  const { getCartaPropostaUrl, updateProposta } = usePropostas();

  // Reset form when proposta changes
  useEffect(() => {
    if (proposta) {
      setPrecoHa(proposta.preco_ha?.toString() || "");
      setPercentualProposto(proposta.percentual_proposto?.toString() || "");
      setIsEditing(false);
    }
  }, [proposta]);

  if (!proposta) return null;

  const handleOpenFile = async () => {
    if (!proposta.arquivo_carta) return;
    
    setIsLoadingFile(true);
    try {
      let storagePath = proposta.arquivo_carta;
      
      if (storagePath.includes("supabase.co/storage/v1/object/")) {
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

  const handleSave = async () => {
    try {
      await updateProposta.mutateAsync({
        id: proposta.id,
        preco_ha: precoHa ? parseFloat(precoHa) : null,
        percentual_proposto: percentualProposto ? parseFloat(percentualProposto) : null,
      });
      toast.success("Proposta atualizada com sucesso");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating proposta:", error);
      toast.error("Erro ao atualizar proposta");
    }
  };

  const handleCancel = () => {
    setPrecoHa(proposta.preco_ha?.toString() || "");
    setPercentualProposto(proposta.percentual_proposto?.toString() || "");
    setIsEditing(false);
  };

  const showPrecoHa = proposta.tipo === "compra" || proposta.tipo === "mista";
  const showPercentual = proposta.tipo === "parceria" || proposta.tipo === "mista";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Detalhes da Proposta
            </DialogTitle>
            {!isEditing ? (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="mr-6">
                <Pencil className="h-4 w-4 mr-1" />
                Editar
              </Button>
            ) : (
              <div className="flex gap-1 mr-6">
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
                <Button variant="default" size="sm" onClick={handleSave} disabled={updateProposta.isPending}>
                  {updateProposta.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
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

            {/* Preço por hectare - always show for compra/mista */}
            {showPrecoHa && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Preço/ha</span>
                </div>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      value={precoHa}
                      onChange={(e) => setPrecoHa(e.target.value)}
                      placeholder="0,00"
                      className="w-32 text-right"
                      step="0.01"
                    />
                  </div>
                ) : (
                  <span className={`font-medium ${proposta.preco_ha ? "text-green-600" : "text-muted-foreground"}`}>
                    {proposta.preco_ha
                      ? new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(proposta.preco_ha)
                      : "Não informado"}
                  </span>
                )}
              </div>
            )}

            {/* Percentual proposto - always show for parceria/mista */}
            {showPercentual && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Percent className="h-4 w-4" />
                  <span>Percentual Proposto</span>
                </div>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={percentualProposto}
                      onChange={(e) => setPercentualProposto(e.target.value)}
                      placeholder="0"
                      className="w-24 text-right"
                      step="0.1"
                      min="0"
                      max="100"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                ) : (
                  <span className={`font-medium ${proposta.percentual_proposto ? "text-purple-600" : "text-muted-foreground"}`}>
                    {proposta.percentual_proposto != null
                      ? `${proposta.percentual_proposto}%`
                      : "Não informado"}
                  </span>
                )}
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
