import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { useImobiliarias } from "@/hooks/useImobiliarias";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Imobiliaria = Tables<"imobiliarias">;

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  contato_nome: z.string().optional(),
  telefone: z.string().optional(),
  link_social: z.string().url("URL inválida").optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

interface EditImobiliariaDialogProps {
  imobiliaria: Imobiliaria | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditImobiliariaDialog({
  imobiliaria,
  open,
  onOpenChange,
}: EditImobiliariaDialogProps) {
  const { updateImobiliaria } = useImobiliarias();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      contato_nome: "",
      telefone: "",
      link_social: "",
    },
  });

  useEffect(() => {
    if (imobiliaria) {
      form.reset({
        nome: imobiliaria.nome,
        contato_nome: imobiliaria.contato_nome || "",
        telefone: imobiliaria.telefone || "",
        link_social: imobiliaria.link_social || "",
      });
    }
  }, [imobiliaria, form]);

  const onSubmit = async (values: FormData) => {
    if (!imobiliaria) return;

    try {
      await updateImobiliaria.mutateAsync({
        id: imobiliaria.id,
        nome: values.nome,
        contato_nome: values.contato_nome || null,
        telefone: values.telefone || null,
        link_social: values.link_social || null,
      });
      toast.success("Imobiliária atualizada com sucesso!");
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar imobiliária:", error);
      toast.error("Erro ao atualizar imobiliária");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Imobiliária</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Imobiliária *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Imobiliária Central" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contato_nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Contato</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: (11) 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="link_social"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website / Rede Social</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateImobiliaria.isPending}>
                {updateImobiliaria.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
