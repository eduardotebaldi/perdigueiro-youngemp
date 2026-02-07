import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { useGlebas, STATUS_LABELS } from "@/hooks/useGlebas";
import { Tables } from "@/integrations/supabase/types";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type Gleba = Tables<"glebas">;

const glebaSchema = z.object({
  apelido: z.string().min(1, "Apelido é obrigatório"),
  proprietario_nome: z.string().optional(),
  tamanho_m2: z.coerce.number().positive().optional().nullable(),
  preco: z.coerce.number().positive().optional().nullable(),
  percentual_permuta: z.coerce.number().min(0).max(100).optional().nullable(),
  aceita_permuta: z.enum(["incerto", "nao", "sim"]).default("incerto"),
  zona_plano_diretor: z.string().optional(),
  tamanho_lote_minimo: z.coerce.number().positive().optional().nullable(),
  comentarios: z.string().optional(),
  prioridade: z.boolean().default(false),
  cidade_id: z.string().optional().nullable(),
  imobiliaria_id: z.string().optional().nullable(),
  data_visita: z.string().optional().nullable(),
  motivo_descarte_id: z.string().optional().nullable(),
  descricao_descarte: z.string().optional(),
  standby_motivo: z.string().optional(),
});

type GlebaForm = z.infer<typeof glebaSchema>;

interface EditGlebaDialogProps {
  gleba: Gleba | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditGlebaDialog({ gleba, open, onOpenChange }: EditGlebaDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [arquivoKmz, setArquivoKmz] = useState<string | null>(null);
  const [arquivoProtocolo, setArquivoProtocolo] = useState<string | null>(null);
  const [arquivoContrato, setArquivoContrato] = useState<string | null>(null);
  const { updateGleba } = useGlebas();
  const { toast } = useToast();

  // Fetch cidades
  const { data: cidades = [] } = useQuery({
    queryKey: ["cidades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cidades")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Fetch imobiliarias
  const { data: imobiliarias = [] } = useQuery({
    queryKey: ["imobiliarias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imobiliarias")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Fetch motivos de descarte
  const { data: motivosDescarte = [] } = useQuery({
    queryKey: ["motivos_descarte"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("motivos_descarte")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<GlebaForm>({
    resolver: zodResolver(glebaSchema),
    defaultValues: {
      apelido: "",
      proprietario_nome: "",
      tamanho_m2: null,
      preco: null,
      percentual_permuta: null,
      aceita_permuta: "incerto",
      zona_plano_diretor: "",
      tamanho_lote_minimo: null,
      comentarios: "",
      prioridade: false,
      cidade_id: null,
      imobiliaria_id: null,
      data_visita: null,
      motivo_descarte_id: null,
      descricao_descarte: "",
      standby_motivo: "",
    },
  });

  useEffect(() => {
    if (gleba) {
      form.reset({
        apelido: gleba.apelido,
        proprietario_nome: gleba.proprietario_nome || "",
        tamanho_m2: gleba.tamanho_m2 ? Number(gleba.tamanho_m2) : null,
        preco: gleba.preco ? Number(gleba.preco) : null,
        percentual_permuta: gleba.percentual_permuta ? Number(gleba.percentual_permuta) : null,
        aceita_permuta: gleba.aceita_permuta || "incerto",
        zona_plano_diretor: gleba.zona_plano_diretor || "",
        tamanho_lote_minimo: gleba.tamanho_lote_minimo ? Number(gleba.tamanho_lote_minimo) : null,
        comentarios: gleba.comentarios || "",
        prioridade: gleba.prioridade || false,
        cidade_id: gleba.cidade_id || null,
        imobiliaria_id: gleba.imobiliaria_id || null,
        data_visita: gleba.data_visita || null,
        motivo_descarte_id: gleba.motivo_descarte_id || null,
        descricao_descarte: gleba.descricao_descarte || "",
        standby_motivo: gleba.standby_motivo || "",
      });
      setArquivoKmz(gleba.arquivo_kmz);
      setArquivoProtocolo(gleba.arquivo_protocolo);
      setArquivoContrato(gleba.arquivo_contrato);
    }
  }, [gleba, form]);

  const onSubmit = async (data: GlebaForm) => {
    if (!gleba) return;
    setIsSubmitting(true);

    try {
      await updateGleba(gleba.id, {
        ...data,
        arquivo_kmz: arquivoKmz,
        arquivo_protocolo: arquivoProtocolo,
        arquivo_contrato: arquivoContrato,
      } as any);

      toast({
        title: "Sucesso!",
        description: "Gleba atualizada com sucesso",
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a gleba",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!gleba) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Gleba</DialogTitle>
          <DialogDescription>
            Atualize os dados da gleba "{gleba.apelido}"
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="geral" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="geral">Geral</TabsTrigger>
                <TabsTrigger value="comercial">Comercial</TabsTrigger>
                <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
              </TabsList>

              <TabsContent value="geral" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="apelido"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apelido *</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Proprietário</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cidade_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cidades.map((cidade) => (
                              <SelectItem key={cidade.id} value={cidade.id}>
                                {cidade.nome}
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
                    name="imobiliaria_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Imobiliária</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {imobiliarias.map((imob) => (
                              <SelectItem key={imob.id} value={imob.id}>
                                {imob.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tamanho_m2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tamanho (m²)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zona_plano_diretor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zona do Plano Diretor</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                      <FormLabel>Comentários</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prioridade"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Prioridade</FormLabel>
                        <FormDescription>
                          Marcar esta gleba como prioritária
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="comercial" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="preco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tamanho_lote_minimo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lote Mínimo (m²)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="aceita_permuta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aceita Permuta</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="incerto">Incerto</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                          <SelectItem value="sim">Sim</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("aceita_permuta") && (
                  <FormField
                    control={form.control}
                    name="percentual_permuta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Percentual de Permuta (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            max={100} 
                            {...field} 
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="data_visita"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Visita</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {gleba.status === "descartada" && (
                  <>
                    <FormField
                      control={form.control}
                      name="motivo_descarte_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motivo do Descarte</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {motivosDescarte.map((motivo) => (
                                <SelectItem key={motivo.id} value={motivo.id}>
                                  {motivo.nome}
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
                      name="descricao_descarte"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição do Descarte</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {gleba.status === "standby" && (
                  <FormField
                    control={form.control}
                    name="standby_motivo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivo do Standby</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Por que esta gleba está em standby?" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>

              <TabsContent value="arquivos" className="space-y-4 mt-4">
                <FileUpload
                  bucket="glebas-kmz"
                  path={gleba.id}
                  accept=".kmz,.kml"
                  currentFileUrl={arquivoKmz}
                  onUpload={setArquivoKmz}
                  onRemove={() => setArquivoKmz(null)}
                  label="Arquivo KMZ/KML"
                />

                <FileUpload
                  bucket="protocolos"
                  path={gleba.id}
                  accept=".pdf,.doc,.docx"
                  currentFileUrl={arquivoProtocolo}
                  onUpload={setArquivoProtocolo}
                  onRemove={() => setArquivoProtocolo(null)}
                  label="Protocolo Assinado"
                />

                <FileUpload
                  bucket="contratos"
                  path={gleba.id}
                  accept=".pdf,.doc,.docx"
                  currentFileUrl={arquivoContrato}
                  onUpload={setArquivoContrato}
                  onRemove={() => setArquivoContrato(null)}
                  label="Contrato"
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}