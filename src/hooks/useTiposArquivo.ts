import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TipoArquivo {
  id: string;
  nome: string;
  created_at: string;
}

export function useTiposArquivo() {
  const queryClient = useQueryClient();

  const { data: tiposArquivo = [], isLoading } = useQuery({
    queryKey: ["tipos_arquivo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tipos_arquivo")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data as TipoArquivo[];
    },
  });

  const createTipo = useMutation({
    mutationFn: async (nome: string) => {
      const { error } = await supabase.from("tipos_arquivo").insert({ nome });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos_arquivo"] });
    },
  });

  const updateTipo = useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }) => {
      const { error } = await supabase.from("tipos_arquivo").update({ nome }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos_arquivo"] });
    },
  });

  const deleteTipo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tipos_arquivo").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos_arquivo"] });
    },
  });

  return { tiposArquivo, isLoading, createTipo, updateTipo, deleteTipo };
}
