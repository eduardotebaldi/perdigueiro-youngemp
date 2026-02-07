import { useState } from "react";
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
import { useCidades } from "@/hooks/useCidades";
import { Loader2, X, FileText } from "lucide-react";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
});

type FormData = z.infer<typeof formSchema>;

interface CreateCidadeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCidadeDialog({ open, onOpenChange }: CreateCidadeDialogProps) {
  const { createCidade, uploadPlanoDiretor } = useCidades();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
    },
  });

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    setIsUploading(true);
    try {
      // First create the cidade
      const result = await createCidade.mutateAsync({
        nome: data.nome,
        planos_diretores: [],
      });

      // Then upload files if any
      if (files.length > 0 && result) {
        const uploadedUrls: string[] = [];
        for (const file of files) {
          const url = await uploadPlanoDiretor(result.id, file);
          uploadedUrls.push(url);
        }

        // Update cidade with file URLs
        await createCidade.mutateAsync({
          ...result,
          planos_diretores: uploadedUrls,
        });
      }

      form.reset();
      setFiles([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao criar cidade:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setFiles([]);
    onOpenChange(false);
  };

  const isSubmitting = createCidade.isPending || isUploading;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Cidade</DialogTitle>
          <DialogDescription>
            Cadastre uma nova cidade e seus planos diretores.
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

            {/* Planos Diretores Upload */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Planos Diretores</label>
              <MultiFileSelector
                onFilesSelected={handleFilesSelected}
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                multiple
                maxFiles={10}
                maxSizeMB={50}
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
                Criar Cidade
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
