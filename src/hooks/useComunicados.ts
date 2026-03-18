import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Comunicado {
  id: string;
  conteudo: string;
  autor_id: string;
  autor_nome: string;
  created_at: string;
  updated_at: string;
}

export function useComunicados() {
  const queryClient = useQueryClient();

  const { data: comunicados = [], isLoading } = useQuery({
    queryKey: ["dashboard-comunicados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dashboard_comunicados")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Comunicado[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ conteudo, autorNome }: { conteudo: string; autorNome: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("dashboard_comunicados").insert({
        conteudo,
        autor_id: user.id,
        autor_nome: autorNome,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard-comunicados"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, conteudo }: { id: string; conteudo: string }) => {
      const { error } = await supabase
        .from("dashboard_comunicados")
        .update({ conteudo, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard-comunicados"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dashboard_comunicados").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dashboard-comunicados"] }),
  });

  return { comunicados, isLoading, createMutation, updateMutation, deleteMutation };
}
