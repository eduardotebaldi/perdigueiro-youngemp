import { useState, useRef } from "react";
import { Tables } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_ORDER, useGlebas } from "@/hooks/useGlebas";
import { useCidades } from "@/hooks/useCidades";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ClipboardList,
  Receipt,
  Loader2,
  ImagePlus,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GlebaAtividades } from "./GlebaAtividades";
import { GlebaAnexosSection } from "./GlebaAnexosSection";
import { toast } from "sonner";

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
  const { updateGleba, updateGlebaStatus } = useGlebas();
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

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

  const { data: propostas } = useQuery({
    queryKey: ["propostas", "gleba", gleba?.id],
    queryFn: async () => {
      if (!gleba?.id) return [];
      const { data, error } = await supabase
        .from("propostas")
        .select("*")
        .eq("gleba_id", gleba.id)
        .order("data_proposta", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!gleba?.id,
  });

  const [loadingFile, setLoadingFile] = useState<string | null>(null);

  if (!gleba) return null;

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem excede 10MB");
      return;
    }
    setUploadingImage(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${gleba.id}/capa-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("gleba-imagens")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("gleba-imagens")
        .getPublicUrl(fileName);

      await updateGleba(gleba.id, { imagem_capa: urlData.publicUrl } as any);
      toast.success("Imagem adicionada!");
    } catch {
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async () => {
    try {
      await updateGleba(gleba.id, { imagem_capa: null } as any);
      toast.success("Imagem removida!");
    } catch {
      toast.error("Erro ao remover imagem");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateGlebaStatus(gleba.id, newStatus);
      toast.success(`Status alterado para ${STATUS_LABELS[newStatus]}`);
    } catch {
      toast.error("Erro ao alterar status");
    }
  };

  const getSignedUrl = async (filePath: string): Promise<string | null> => {
    let storagePath = filePath;
    if (filePath.includes("supabase.co/storage/v1/object/")) {
      const match = filePath.match(/\/storage\/v1\/object\/(?:public\/)?propostas\/(.+)/);
      if (match) storagePath = match[1];
    }
    const { data, error } = await supabase.storage
      .from("propostas")
      .createSignedUrl(storagePath, 3600);
    if (error) return null;
    return data.signedUrl;
  };

  const handleOpenPropostaFile = async (proposta: Tables<"propostas">) => {
    if (!proposta.arquivo_carta) return;
    setLoadingFile(proposta.id);
    try {
      const signedUrl = await getSignedUrl(proposta.arquivo_carta);
      if (signedUrl) window.open(signedUrl, "_blank");
      else toast.error("Não foi possível acessar o arquivo");
    } catch {
      toast.error("Erro ao acessar o arquivo");
    } finally {
      setLoadingFile(null);
    }
  };

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
    return `${value.toLocaleString("pt-BR")} ha`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  };

  const cidadeName = getCidadeName(gleba.cidade_id);

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

  const imagemCapa = (gleba as any).imagem_capa as string | null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-0">
        {/* Cover Image */}
        <div className="relative group">
          {imagemCapa ? (
            <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
              <img
                src={imagemCapa}
                alt={gleba.apelido}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <Button size="sm" variant="secondary" onClick={() => imageInputRef.current?.click()}>
                  <ImagePlus className="h-4 w-4 mr-1" />
                  Trocar
                </Button>
                <Button size="sm" variant="destructive" onClick={handleRemoveImage}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remover
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="h-24 w-full bg-muted/50 rounded-t-lg flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => imageInputRef.current?.click()}
            >
              {uploadingImage ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <ImagePlus className="h-5 w-5" />
                  Adicionar imagem de capa
                </div>
              )}
            </div>
          )}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageUpload(e.target.files)}
          />
        </div>

        <div className="px-6 pb-6">
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
                {cidadeName && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {cidadeName}
                  </p>
                )}
                <div className="mt-2">
                  <Select value={gleba.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-auto h-auto border-0 p-0 shadow-none focus:ring-0">
                      <Badge
                        variant="outline"
                        className={`${STATUS_COLORS[gleba.status]} text-sm cursor-pointer`}
                      >
                        {STATUS_LABELS[gleba.status] || gleba.status}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_ORDER.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <InfoItem icon={Users} label="Proprietário" value={gleba.proprietario_nome} />
                <InfoItem icon={Building2} label="Cidade" value={cidadeName} />
                <InfoItem icon={Building2} label="Imobiliária" value={getImobiliariaName(gleba.imobiliaria_id)} />
                <InfoItem icon={MapPin} label="Área Total" value={formatArea(gleba.tamanho_m2)} highlight />
                <InfoItem icon={Ruler} label="Lote Mínimo" value={formatArea(gleba.tamanho_lote_minimo)} />
                <InfoItem icon={FileText} label="Zona do Plano Diretor" value={gleba.zona_plano_diretor} />
                <InfoItem icon={MapPin} label="Possui Polígono" value={gleba.poligono_geojson ? "Sim" : "Não"} />
              </div>
            </div>

            {/* Coluna Direita - Informações Comerciais */}
            <div className="space-y-1">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Informações Comerciais
              </h3>
              <div className="bg-muted/30 rounded-lg p-4 space-y-1">
                <InfoItem icon={DollarSign} label="Preço" value={formatCurrency(gleba.preco)} highlight />
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
                <InfoItem icon={Calendar} label="Data da Visita" value={formatDate(gleba.data_visita)} />
              </div>
            </div>
          </div>

          {/* Datas */}
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
              <h3 className="font-semibold text-lg mb-3 text-red-600">Informações do Descarte</h3>
              <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                {gleba.motivo_descarte_id && (
                  <p className="text-sm">
                    <span className="font-medium">Motivo:</span> {getMotivoDescarteName(gleba.motivo_descarte_id)}
                  </p>
                )}
                {gleba.descricao_descarte && (
                  <p className="text-sm mt-2">
                    <span className="font-medium">Descrição:</span> {gleba.descricao_descarte}
                  </p>
                )}
              </div>
            </div>
          )}

          {gleba.status === "standby" && gleba.standby_motivo && (
            <div className="mt-4">
              <h3 className="font-semibold text-lg mb-3 text-purple-600">Informações do Standby</h3>
              <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                {gleba.standby_inicio && (
                  <p className="text-sm">
                    <span className="font-medium">Início:</span> {formatDate(gleba.standby_inicio)}
                  </p>
                )}
                <p className="text-sm mt-2">
                  <span className="font-medium">Motivo:</span> {gleba.standby_motivo}
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
                    <a href={gleba.arquivo_kmz} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />KMZ
                    </a>
                  </Button>
                )}
                {gleba.arquivo_protocolo && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={gleba.arquivo_protocolo} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />Protocolo
                    </a>
                  </Button>
                )}
                {gleba.arquivo_contrato && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={gleba.arquivo_contrato} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />Contrato
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Propostas */}
          {propostas && propostas.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Propostas ({propostas.length})
              </h3>
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                {propostas.map((proposta) => (
                  <div
                    key={proposta.id}
                    className="flex items-center justify-between p-3 bg-background rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              proposta.tipo === "compra"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : proposta.tipo === "parceria"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                            }
                          >
                            {proposta.tipo === "compra" ? "Compra" : proposta.tipo === "parceria" ? "Parceria" : "Mista"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(proposta.data_proposta + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        {proposta.descricao && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{proposta.descricao}</p>
                        )}
                      </div>
                    </div>
                    {proposta.arquivo_carta && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenPropostaFile(proposta)}
                        disabled={loadingFile === proposta.id}
                      >
                        {loadingFile === proposta.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ExternalLink className="h-4 w-4" />
                        )}
                        <span className="ml-2">Abrir</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Anexos */}
          <div className="mt-6">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Documentos Anexos
            </h3>
            <div className="bg-muted/30 rounded-lg p-4">
              <GlebaAnexosSection glebaId={gleba.id} />
            </div>
          </div>

          {/* Atividades */}
          <div className="mt-6">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Atividades
            </h3>
            <GlebaAtividades glebaId={gleba.id} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
