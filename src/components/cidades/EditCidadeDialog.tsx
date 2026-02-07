import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MultiFileSelector } from "@/components/ui/multi-file-selector";
import { Cidade, useCidades } from "@/hooks/useCidades";
import { Loader2, X, FileText, ExternalLink } from "lucide-react";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
});

type FormData = z.infer<typeof formSchema>;

interface EditCidadeDialogProps {
  cidade: Cidade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCidadeDialog({ cidade, open, onOpenChange }: EditCidadeDialogProps) {
  const { updateCidade, uploadPlanoDiretor, removePlanoDiretor } = useCidades();
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [urlsToRemove, setUrlsToRemove] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
    },
  });

  // Reset form when cidade changes
  useEffect(() => {
    if (cidade) {
      form.reset({ nome: cidade.nome });
      setExistingUrls(cidade.planos_diretores || []);
      setNewFiles([]);
      setUrlsToRemove([]);
    }
  }, [cidade, form]);

  const handleFilesSelected = (selectedFiles: File[]) => {
    setNewFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (url: string) => {
    setExistingUrls((prev) => prev.filter((u) => u !== url));
    setUrlsToRemove((prev) => [...prev, url]);
  };

  const onSubmit = async (data: FormData) => {
    if (!cidade) return;

    setIsUploading(true);
    try {
      // Upload new files
      const newUploadedUrls: string[] = [];
      for (const file of newFiles) {
        const url = await uploadPlanoDiretor(cidade.id, file);
        newUploadedUrls.push(url);
      }

      // Remove files marked for deletion
      for (const url of urlsToRemove) {
        await removePlanoDiretor(cidade.id, url);
      }

      // Update cidade
      await updateCidade.mutateAsync({
        id: cidade.id,
        nome: data.nome,
        planos_diretores: [...existingUrls, ...newUploadedUrls],
      });

      handleClose();
    } catch (error) {
      console.error("Erro ao atualizar cidade:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setNewFiles([]);
    setExistingUrls([]);
    setUrlsToRemove([]);
    onOpenChange(false);
  };

  const isSubmitting = updateCidade.isPending || isUploading;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Cidade</DialogTitle>
          <DialogDescription>
            Atualize as informações da cidade e seus planos diretores.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Cidade *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: São Paulo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Existing Planos Diretores */}
            {existingUrls.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Planos Diretores Atuais</label>
                <div className="space-y-2">
                  {existingUrls.map((url, index) => {
                    const fileName = url.split("/").pop() || `Plano ${index + 1}`;
                    return (
                      <div
                        key={url}
                        className="flex items-center justify-between p-2 bg-muted rounded-md"
                      >
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline overflow-hidden"
                        >
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {fileName.length > 30 ? `${fileName.slice(0, 27)}...` : fileName}
                          </span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                          onClick={() => removeExistingFile(url)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add New Planos Diretores */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Adicionar Planos Diretores</label>
              <MultiFileSelector
                onFilesSelected={handleFilesSelected}
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                multiple
                maxFiles={10}
                maxSizeMB={50}
              />

              {newFiles.length > 0 && (
                <div className="space-y-2 mt-3">
                  {newFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-primary/10 rounded-md"
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
                        onClick={() => removeNewFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
