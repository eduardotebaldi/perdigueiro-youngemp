import { useState, useRef } from "react";
import { useGlebaAnexos, TIPO_ANEXO_LABELS, TIPO_ANEXO_ACCEPT } from "@/hooks/useGlebaAnexos";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, ExternalLink, Trash2, FileText, FileSpreadsheet, Image, Link2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface GlebaAnexosSectionProps {
  glebaId: string;
}

const TIPOS = ["pesquisa_mercado", "planilha_viabilidade", "matricula_imovel"] as const;
const TIPOS_COM_DRIVE = ["pesquisa_mercado", "planilha_viabilidade"] as const;

const TIPO_ICONS: Record<string, any> = {
  pesquisa_mercado: FileText,
  planilha_viabilidade: FileSpreadsheet,
  matricula_imovel: Image,
};

export function GlebaAnexosSection({ glebaId }: GlebaAnexosSectionProps) {
  const { getAnexosByTipo, uploadAnexo, addDriveLink, deleteAnexo, getSignedUrl, isGoogleDriveLink, isLoading } = useGlebaAnexos(glebaId);
  const { isAdmin } = useAuth();
  const [loadingFile, setLoadingFile] = useState<string | null>(null);
  const [uploadingTipo, setUploadingTipo] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [driveLinkOpen, setDriveLinkOpen] = useState<string | null>(null);
  const [driveUrl, setDriveUrl] = useState("");
  const [driveName, setDriveName] = useState("");

  const handleUpload = async (files: FileList | null, tipo: string) => {
    if (!files || files.length === 0) return;
    setUploadingTipo(tipo);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`Arquivo ${file.name} excede 50MB`);
          continue;
        }
        await uploadAnexo.mutateAsync({ file, tipo: tipo as any, glebaId });
      }
      toast.success("Arquivo(s) enviado(s) com sucesso!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar arquivo");
    } finally {
      setUploadingTipo(null);
      if (inputRefs.current[tipo]) inputRefs.current[tipo]!.value = "";
    }
  };

  const handleAddDriveLink = async (tipo: string) => {
    if (!driveUrl.trim()) {
      toast.error("Informe o link");
      return;
    }
    try {
      const name = driveName.trim() || "Link Google Drive";
      await addDriveLink.mutateAsync({ link: driveUrl.trim(), tipo: tipo as any, glebaId, nome: name });
      toast.success("Link adicionado!");
      setDriveUrl("");
      setDriveName("");
      setDriveLinkOpen(null);
    } catch {
      toast.error("Erro ao adicionar link");
    }
  };

  const handleOpen = async (filePath: string, anexoId: string) => {
    if (isGoogleDriveLink(filePath)) {
      window.open(filePath, "_blank");
      return;
    }
    setLoadingFile(anexoId);
    try {
      const url = await getSignedUrl(filePath);
      if (url) window.open(url, "_blank");
      else toast.error("Não foi possível acessar o arquivo");
    } catch {
      toast.error("Erro ao acessar arquivo");
    } finally {
      setLoadingFile(null);
    }
  };

  const handleDelete = async (anexo: any) => {
    try {
      await deleteAnexo.mutateAsync(anexo);
      toast.success("Arquivo removido!");
    } catch {
      toast.error("Erro ao remover arquivo");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const allowsDrive = (tipo: string) => (TIPOS_COM_DRIVE as readonly string[]).includes(tipo);

  return (
    <div className="space-y-6">
      {TIPOS.map((tipo) => {
        const anexos = getAnexosByTipo(tipo);
        const Icon = TIPO_ICONS[tipo];
        return (
          <div key={tipo} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                {TIPO_ANEXO_LABELS[tipo]}
                {anexos.length > 0 && (
                  <span className="text-xs text-muted-foreground">({anexos.length})</span>
                )}
              </h4>
              <div className="flex gap-1">
                {allowsDrive(tipo) && (
                  <Popover open={driveLinkOpen === tipo} onOpenChange={(open) => {
                    setDriveLinkOpen(open ? tipo : null);
                    if (!open) { setDriveUrl(""); setDriveName(""); }
                  }}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Link2 className="h-3 w-3" />
                        Link
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 space-y-3" align="end">
                      <p className="text-sm font-medium">Adicionar link do Google Drive</p>
                      <Input
                        placeholder="Nome do documento"
                        value={driveName}
                        onChange={(e) => setDriveName(e.target.value)}
                      />
                      <Input
                        placeholder="https://drive.google.com/..."
                        value={driveUrl}
                        onChange={(e) => setDriveUrl(e.target.value)}
                      />
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleAddDriveLink(tipo)}
                        disabled={addDriveLink.isPending}
                      >
                        {addDriveLink.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                        Adicionar
                      </Button>
                    </PopoverContent>
                  </Popover>
                )}
                <input
                  ref={(el) => { inputRefs.current[tipo] = el; }}
                  type="file"
                  accept={TIPO_ANEXO_ACCEPT[tipo]}
                  multiple
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files, tipo)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => inputRefs.current[tipo]?.click()}
                  disabled={uploadingTipo === tipo}
                  className="gap-1"
                >
                  {uploadingTipo === tipo ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Upload className="h-3 w-3" />
                  )}
                  Enviar
                </Button>
              </div>
            </div>

            {anexos.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhum arquivo</p>
            ) : (
              <div className="space-y-1">
                {anexos.map((anexo) => (
                  <div
                    key={anexo.id}
                    className="flex items-center justify-between gap-2 bg-muted/50 rounded-md px-3 py-2 group"
                  >
                    <button
                      className="flex items-center gap-2 text-sm text-left hover:text-primary transition-colors flex-1 min-w-0"
                      onClick={() => handleOpen(anexo.arquivo, anexo.id)}
                      disabled={loadingFile === anexo.id}
                    >
                      {loadingFile === anexo.id ? (
                        <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
                      ) : isGoogleDriveLink(anexo.arquivo) ? (
                        <Link2 className="h-3 w-3 flex-shrink-0 text-primary" />
                      ) : (
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      )}
                      <span className="truncate">{anexo.nome_arquivo}</span>
                    </button>
                    {isAdmin && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir arquivo?</AlertDialogTitle>
                            <AlertDialogDescription>
                              O arquivo "{anexo.nome_arquivo}" será permanentemente removido.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(anexo)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
