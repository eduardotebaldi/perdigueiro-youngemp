import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useGlebas } from "@/hooks/useGlebas";
import { useCidades } from "@/hooks/useCidades";
import { CidadeAutocomplete } from "@/components/cidades/CidadeAutocomplete";
import { Tables } from "@/integrations/supabase/types";
import { Plus, Loader2 } from "lucide-react";
import { CidadeBrasil } from "@/hooks/useCidadesBrasil";

type Gleba = Tables<"glebas">;

const glebaSchema = z.object({
  apelido: z.string().min(1, "Apelido é obrigatório"),
  cidade_nome: z.string().min(1, "Cidade é obrigatória"),
  proprietario_nome: z.string().optional(),
  tamanho_m2: z.coerce.number().positive().optional(),
  preco: z.coerce.number().positive().optional(),
  comentarios: z.string().optional(),
});

type GlebaForm = z.infer<typeof glebaSchema>;

interface CreateGlebaDialogProps {
  onSuccess?: () => void;
}

export function CreateGlebaDialog({ onSuccess }: CreateGlebaDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCidadeId, setSelectedCidadeId] = useState<string | null>(null);
  const { createGleba } = useGlebas();
  const { cidades, createCidade } = useCidades();
  const { toast } = useToast();

  const form = useForm<GlebaForm>({
    resolver: zodResolver(glebaSchema),
    defaultValues: {
      apelido: "",
      cidade_nome: "",
      proprietario_nome: "",
      tamanho_m2: undefined,
      preco: undefined,
      comentarios: "",
    },
  });

  const onSubmit = async (data: GlebaForm) => {
    setIsSubmitting(true);
    try {
      // Find or create cidade
      let cidadeId = selectedCidadeId;
      if (!cidadeId) {
        // Try to find existing cidade by name
        const existing = (cidades || []).find(c => c.nome === data.cidade_nome);
        if (existing) {
          cidadeId = existing.id;
        } else {
          // Create new cidade
          const newCidade = await createCidade.mutateAsync({ nome: data.cidade_nome });
          cidadeId = newCidade?.id;
        }
      }

      const { cidade_nome, ...rest } = data;
      await createGleba({
        ...rest,
        cidade_id: cidadeId,
        status: "identificada",
      } as any);

      toast({
        title: "Sucesso!",
        description: "Gleba criada com sucesso",
      });

      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar a gleba",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Gleba
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Gleba</DialogTitle>
          <DialogDescription>
            Preencha os dados básicos da gleba. Você poderá editar mais detalhes depois.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="apelido"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apelido *</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Gleba Centro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proprietario_nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Proprietário</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: João Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tamanho_m2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamanho (ha)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="50000" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="500000" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="comentarios"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Informações da Gleba</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações sobre a gleba..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Gleba
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}