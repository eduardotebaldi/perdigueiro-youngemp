import { useState, useRef } from "react";
import { useGlebaAnexos } from "@/hooks/useGlebaAnexos";
import { useTiposArquivo } from "@/hooks/useTiposArquivo";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, ExternalLink, Trash2, FileText, Link2, Plus } from "lucide-react";
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

export function GlebaAnexosSection({ glebaId }: GlebaAnexosSectionProps) {
  const { anexos, uploadAnexo, addDriveLink, deleteAnexo, getSignedUrl, isGoogleDriveLink, updateAnexoTipo, isLoading } = useGlebaAnexos(glebaId);
  const { tiposArquivo } = useTiposArquivo();
  const { isAdmin, user } = useAuth();
  const [loadingFile, setLoadingFile] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [driveLinkOpen, setDriveLinkOpen] = useState(false);
  const [driveUrl, setDriveUrl] = useState("");
  const [driveName, setDriveName] = useState("");

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`Arquivo ${file.name} excede 50MB`);
          continue;
        }
        await uploadAnexo.mutateAsync({ file, tipo: "pesquisa_mercado" as any, glebaId });
      }
      toast.success("Arquivo(s) enviado(s) com sucesso!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar arquivo");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleAddDriveLink = async () => {
    if (!driveUrl.trim()) {
      toast.error("Informe o link");
      return;
    }
    try {
      const name = driveName.trim() || "Link Google Drive";
      await addDriveLink.mutateAsync({ link: driveUrl.trim(), tipo: "pesquisa_mercado" as any, glebaId, nome: name });
      toast.success("Link adicionado!");
      setDriveUrl("");
      setDriveName("");
      setDriveLinkOpen(false);
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

  const handleTipoChange = async (anexoId: string, tipoId: string | null) => {
    try {
      await updateAnexoTipo.mutateAsync({ anexoId, tipoArquivoId: tipoId });
    } catch {
      toast.error("Erro ao atualizar tipo");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Anexos
          {anexos.length > 0 && (
            <span className="text-xs text-muted-foreground">({anexos.length})</span>
          )}
        </h4>
        <div className="flex gap-1">
          <Popover open={driveLinkOpen} onOpenChange={(open) => {
            setDriveLinkOpen(open);
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
                onClick={handleAddDriveLink}
                disabled={addDriveLink.isPending}
              >
                {addDriveLink.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                Adicionar
              </Button>
            </PopoverContent>
          </Popover>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="gap-1"
          >
            {isUploading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Upload className="h-3 w-3" />
            )}
            Enviar
          </Button>
        </div>
      </div>

      {/* Files list */}
      {anexos.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Nenhum arquivo anexado</p>
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

              {/* Tipo select */}
              <Select
                value={anexo.tipo_arquivo_id || "none"}
                onValueChange={(v) => handleTipoChange(anexo.id, v === "none" ? null : v)}
              >
                <SelectTrigger className="w-40 h-7 text-xs">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem tipo</SelectItem>
                  {tiposArquivo.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(() => {
                const isOwner = anexo.created_by === user?.id;
                const isRecent = new Date(anexo.created_at) > new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
                const canDelete = isAdmin || (isOwner && isRecent);
                if (!canDelete) return null;
                return (
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
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
