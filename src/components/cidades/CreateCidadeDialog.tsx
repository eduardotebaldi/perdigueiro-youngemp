import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MultiFileSelector } from "@/components/ui/multi-file-selector";
import { CidadeAutocomplete } from "@/components/cidades/CidadeAutocomplete";
import { useCidades } from "@/hooks/useCidades";
import { CidadeBrasil } from "@/hooks/useCidadesBrasil";
import { Loader2, X, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateCidadeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCidadeDialog({ open, onOpenChange }: CreateCidadeDialogProps) {
  const { cidades, createCidade, uploadPlanoDiretor, updateCidade } = useCidades();
  const [selectedCidade, setSelectedCidade] = useState<CidadeBrasil | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCidadeChange = (cidade: CidadeBrasil | null) => {
    setSelectedCidade(cidade);
    setError(null);
  };

  const onSubmit = async () => {
    if (!selectedCidade) {
      setError("Selecione uma cidade da lista");
      return;
    }

    // Verificar se a cidade já está cadastrada
    const cidadeExistente = cidades?.find(
      (c) => c.nome.toLowerCase() === selectedCidade.nomeCompleto.toLowerCase()
    );
    if (cidadeExistente) {
      setError("Esta cidade já está cadastrada no sistema");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Criar a cidade
      const result = await createCidade.mutateAsync({
        nome: selectedCidade.nomeCompleto,
        planos_diretores: [],
      });

      // Upload de arquivos se houver
      if (files.length > 0 && result) {
        const uploadedUrls: string[] = [];
        for (const file of files) {
          const url = await uploadPlanoDiretor(result.id, file);
          uploadedUrls.push(url);
        }

        // Atualizar cidade com URLs dos arquivos
        await updateCidade.mutateAsync({
          id: result.id,
          planos_diretores: uploadedUrls,
        });
      }

      handleClose();
    } catch (err) {
      console.error("Erro ao criar cidade:", err);
      setError("Erro ao criar cidade. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedCidade(null);
    setFiles([]);
    setError(null);
    onOpenChange(false);
  };

  const isSubmitting = createCidade.isPending || isUploading;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Cidade</DialogTitle>
          <DialogDescription>
            Busque e selecione uma cidade brasileira do banco de dados do IBGE.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Autocomplete de Cidade */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Cidade *</label>
            <CidadeAutocomplete
              value={selectedCidade?.nomeCompleto || ""}
              onChange={handleCidadeChange}
              placeholder="Digite o nome da cidade..."
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Dados de cidades do IBGE (Instituto Brasileiro de Geografia e Estatística)
            </p>
          </div>

          {/* Planos Diretores Upload */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Planos Diretores (opcional)</label>
            <MultiFileSelector
              onFilesSelected={handleFilesSelected}
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              multiple
              maxFiles={10}
              maxSizeMB={50}
              disabled={isSubmitting}
            />

            {files.length > 0 && (
              <div className="space-y-2 mt-3">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => removeFile(index)}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting || !selectedCidade}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cadastrar Cidade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
