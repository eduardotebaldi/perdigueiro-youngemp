import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { usePropostas } from "@/hooks/usePropostas";
import { useGlebas } from "@/hooks/useGlebas";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const formSchema = z.object({
  gleba_id: z.string().min(1, "Selecione uma gleba"),
  data_proposta: z.date(),
  descricao: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function CreatePropostaDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { createProposta, uploadCartaProposta } = usePropostas();
  const { glebas } = useGlebas();
  const { user } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gleba_id: "",
      data_proposta: new Date(),
      descricao: "",
    },
  });

  const onSubmit = async (values: FormData) => {
    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    try {
      setIsUploading(true);
      let arquivoCarta: string | null = null;

      if (file) {
        arquivoCarta = await uploadCartaProposta(file);
      }

      await createProposta.mutateAsync({
        gleba_id: values.gleba_id,
        data_proposta: format(values.data_proposta, "yyyy-MM-dd"),
        descricao: values.descricao || null,
        arquivo_carta: arquivoCarta,
        created_by: user.id,
      });

      toast.success("Proposta cadastrada com sucesso!");
      form.reset();
      setFile(null);
      setOpen(false);
    } catch (error) {
      console.error("Erro ao criar proposta:", error);
      toast.error("Erro ao cadastrar proposta");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 10MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Proposta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar Proposta</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="gleba_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gleba *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma gleba" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {glebas.map((gleba) => (
                        <SelectItem key={gleba.id} value={gleba.id}>
                          {gleba.apelido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data_proposta"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data da Proposta *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes da proposta..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload */}
            <div className="space-y-2">
              <FormLabel>Carta-Proposta (PDF)</FormLabel>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {file ? file.name : "Selecionar arquivo"}
                </Button>
                {file && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                  >
                    ×
                  </Button>
                )}
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                Máximo 10MB - PDF, DOC, DOCX
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createProposta.isPending || isUploading}
              >
                {isUploading ? "Enviando..." : "Cadastrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
