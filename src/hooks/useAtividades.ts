import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";

type Atividade = Tables<"atividades">;
type AtividadeInsert = TablesInsert<"atividades">;

export function useAtividades() {
  const queryClient = useQueryClient();

  const { data: atividades = [], isLoading } = useQuery({
    queryKey: ["atividades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atividades")
        .select(`
          *,
          gleba:glebas(id, apelido)
        `)
        .order("data", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createAtividade = useMutation({
    mutationFn: async (data: AtividadeInsert) => {
      const { error } = await supabase.from("atividades").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atividades"] });
    },
  });

  const updateAtividade = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Atividade> & { id: string }) => {
      const { error } = await supabase
        .from("atividades")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atividades"] });
    },
  });

  const deleteAtividade = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("atividades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atividades"] });
    },
  });

  return {
    atividades,
    isLoading,
    createAtividade,
    updateAtividade,
    deleteAtividade,
  };
}

export function useAtividadesByGleba(glebaId: string | null) {
  return useQuery({
    queryKey: ["atividades", "gleba", glebaId],
    queryFn: async () => {
      if (!glebaId) return [];
      
      const { data, error } = await supabase
        .from("atividades")
        .select("*")
        .eq("gleba_id", glebaId)
        .order("data", { ascending: false });

      if (error) throw error;
      return data as Atividade[];
    },
    enabled: !!glebaId,
  });
}
