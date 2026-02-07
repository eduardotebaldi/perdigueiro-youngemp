import { Tables } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { STATUS_LABELS } from "@/hooks/useGlebas";
import { useCidades } from "@/hooks/useCidades";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  MapPin,
  Users,
  DollarSign,
  Calendar,
  Building2,
  Star,
  FileText,
  Pencil,
  ExternalLink,
  Ruler,
  Percent,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Gleba = Tables<"glebas">;

interface GlebaDetailsDialogProps {
  gleba: Gleba | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (gleba: Gleba) => void;
}

const STATUS_COLORS: Record<string, string> = {
  identificada: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  informacoes_recebidas: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30",
  visita_realizada: "bg-teal-500/10 text-teal-600 border-teal-500/30",
  proposta_enviada: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  protocolo_assinado: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  descartada: "bg-red-500/10 text-red-600 border-red-500/30",
  proposta_recusada: "bg-rose-500/10 text-rose-600 border-rose-500/30",
  negocio_fechado: "bg-green-500/10 text-green-600 border-green-500/30",
  standby: "bg-purple-500/10 text-purple-600 border-purple-500/30",
};

export function GlebaDetailsDialog({
  gleba,
  open,
  onOpenChange,
  onEdit,
}: GlebaDetailsDialogProps) {
  const { cidades } = useCidades();

  const { data: imobiliarias } = useQuery({
    queryKey: ["imobiliarias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imobiliarias")
        .select("id, nome")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: motivosDescarte } = useQuery({
    queryKey: ["motivos_descarte"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("motivos_descarte")
        .select("id, nome");
      if (error) throw error;
      return data;
    },
  });

  if (!gleba) return null;

  const getCidadeName = (cidadeId: string | null) => {
    if (!cidadeId) return null;
    return cidades?.find((c) => c.id === cidadeId)?.nome;
  };

  const getImobiliariaName = (imobiliariaId: string | null) => {
    if (!imobiliariaId) return null;
    return imobiliarias?.find((i) => i.id === imobiliariaId)?.nome;
  };

  const getMotivoDescarteName = (motivoId: string | null) => {
    if (!motivoId) return null;
    return motivosDescarte?.find((m) => m.id === motivoId)?.nome;
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return null;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatArea = (value: number | null) => {
    if (!value) return null;
    return `${value.toLocaleString("pt-BR")} m²`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  };

  const InfoItem = ({
    icon: Icon,
    label,
    value,
    highlight = false,
  }: {
    icon: any;
    label: string;
    value: React.ReactNode;
    highlight?: boolean;
  }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3 py-2">
        <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`font-medium ${highlight ? "text-primary" : ""}`}>
            {value}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
                  #{gleba.numero}
                </span>
                {gleba.prioridade && (
                  <Badge
                    variant="secondary"
                    className="bg-amber-500/10 text-amber-600 border-amber-500/30"
                  >
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Prioritária
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-2xl">{gleba.apelido}</DialogTitle>
              <div className="mt-2">
                <Badge
                  variant="outline"
                  className={`${STATUS_COLORS[gleba.status]} text-sm`}
                >
                  {STATUS_LABELS[gleba.status] || gleba.status}
                </Badge>
              </div>
            </div>
            <Button
              onClick={() => {
                onOpenChange(false);
                onEdit?.(gleba);
              }}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Coluna Esquerda - Informações Gerais */}
          <div className="space-y-1">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Informações Gerais
            </h3>
            <div className="bg-muted/30 rounded-lg p-4 space-y-1">
              <InfoItem
                icon={Users}
                label="Proprietário"
                value={gleba.proprietario_nome}
              />
              <InfoItem
                icon={Building2}
                label="Cidade"
                value={getCidadeName(gleba.cidade_id)}
              />
              <InfoItem
                icon={Building2}
                label="Imobiliária"
                value={getImobiliariaName(gleba.imobiliaria_id)}
              />
              <InfoItem
                icon={MapPin}
                label="Área Total"
                value={formatArea(gleba.tamanho_m2)}
                highlight
              />
              <InfoItem
                icon={Ruler}
                label="Lote Mínimo"
                value={formatArea(gleba.tamanho_lote_minimo)}
              />
              <InfoItem
                icon={FileText}
                label="Zona do Plano Diretor"
                value={gleba.zona_plano_diretor}
              />
              <InfoItem
                icon={MapPin}
                label="Possui Polígono"
                value={gleba.poligono_geojson ? "Sim" : "Não"}
              />
            </div>
          </div>

          {/* Coluna Direita - Informações Comerciais */}
          <div className="space-y-1">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Informações Comerciais
            </h3>
            <div className="bg-muted/30 rounded-lg p-4 space-y-1">
              <InfoItem
                icon={DollarSign}
                label="Preço"
                value={formatCurrency(gleba.preco)}
                highlight
              />
              <InfoItem
                icon={Percent}
                label="Aceita Permuta"
                value={
                  gleba.aceita_permuta === "sim"
                    ? gleba.percentual_permuta
                      ? `Sim (${gleba.percentual_permuta}%)`
                      : "Sim"
                    : gleba.aceita_permuta === "nao"
                    ? "Não"
                    : "Incerto"
                }
              />
              <InfoItem
                icon={Calendar}
                label="Data da Visita"
                value={formatDate(gleba.data_visita)}
              />
            </div>
          </div>
        </div>

        {/* Datas e Sincronização */}
        <div className="mt-4">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Datas
          </h3>
          <div className="bg-muted/30 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Criado em</p>
              <p className="font-medium">{formatDate(gleba.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última atualização</p>
              <p className="font-medium">{formatDate(gleba.updated_at)}</p>
            </div>
            {gleba.last_sync_at && (
              <div>
                <p className="text-sm text-muted-foreground">Última sincronização</p>
                <p className="font-medium">{formatDate(gleba.last_sync_at)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Comentários */}
        {gleba.comentarios && (
          <div className="mt-4">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Comentários
            </h3>
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-sm whitespace-pre-wrap">{gleba.comentarios}</p>
            </div>
          </div>
        )}

        {/* Status especiais */}
        {gleba.status === "descartada" && (
          <div className="mt-4">
            <h3 className="font-semibold text-lg mb-3 text-red-600">
              Informações do Descarte
            </h3>
            <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
              {gleba.motivo_descarte_id && (
                <p className="text-sm">
                  <span className="font-medium">Motivo:</span>{" "}
                  {getMotivoDescarteName(gleba.motivo_descarte_id)}
                </p>
              )}
              {gleba.descricao_descarte && (
                <p className="text-sm mt-2">
                  <span className="font-medium">Descrição:</span>{" "}
                  {gleba.descricao_descarte}
                </p>
              )}
            </div>
          </div>
        )}

        {gleba.status === "standby" && gleba.standby_motivo && (
          <div className="mt-4">
            <h3 className="font-semibold text-lg mb-3 text-purple-600">
              Informações do Standby
            </h3>
            <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              {gleba.standby_inicio && (
                <p className="text-sm">
                  <span className="font-medium">Início:</span>{" "}
                  {formatDate(gleba.standby_inicio)}
                </p>
              )}
              <p className="text-sm mt-2">
                <span className="font-medium">Motivo:</span>{" "}
                {gleba.standby_motivo}
              </p>
            </div>
          </div>
        )}

        {/* Arquivos */}
        {(gleba.arquivo_kmz || gleba.arquivo_protocolo || gleba.arquivo_contrato) && (
          <div className="mt-4">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Arquivos
            </h3>
            <div className="flex flex-wrap gap-2">
              {gleba.arquivo_kmz && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={gleba.arquivo_kmz}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    KMZ
                  </a>
                </Button>
              )}
              {gleba.arquivo_protocolo && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={gleba.arquivo_protocolo}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Protocolo
                  </a>
                </Button>
              )}
              {gleba.arquivo_contrato && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={gleba.arquivo_contrato}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Contrato
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
