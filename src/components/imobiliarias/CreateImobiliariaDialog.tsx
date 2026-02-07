import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { useImobiliarias } from "@/hooks/useImobiliarias";
import { toast } from "sonner";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  contato_nome: z.string().optional(),
  telefone: z.string().optional(),
  link_social: z.string().url("URL inválida").optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

export function CreateImobiliariaDialog() {
  const [open, setOpen] = useState(false);
  const { createImobiliaria } = useImobiliarias();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      contato_nome: "",
      telefone: "",
      link_social: "",
    },
  });

  const onSubmit = async (values: FormData) => {
    try {
      await createImobiliaria.mutateAsync({
        nome: values.nome,
        contato_nome: values.contato_nome || null,
        telefone: values.telefone || null,
        link_social: values.link_social || null,
      });
      toast.success("Imobiliária cadastrada com sucesso!");
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Erro ao criar imobiliária:", error);
      toast.error("Erro ao cadastrar imobiliária");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Imobiliária
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar Imobiliária</DialogTitle>
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
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createImobiliaria.isPending}>
                {createImobiliaria.isPending ? "Salvando..." : "Cadastrar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
