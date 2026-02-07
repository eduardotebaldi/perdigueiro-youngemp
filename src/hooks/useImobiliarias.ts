import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";

type Imobiliaria = Tables<"imobiliarias">;
type ImobiliariaInsert = TablesInsert<"imobiliarias">;

export function useImobiliarias() {
  const queryClient = useQueryClient();

  const { data: imobiliarias = [], isLoading } = useQuery({
    queryKey: ["imobiliarias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imobiliarias")
        .select("*")
        .order("nome");

      if (error) throw error;
      return data as Imobiliaria[];
    },
  });

  // Also fetch gleba counts per imobiliaria
  const { data: glebaCounts = {} } = useQuery({
    queryKey: ["imobiliarias-gleba-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("glebas")
        .select("imobiliaria_id");

      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((gleba) => {
        if (gleba.imobiliaria_id) {
          counts[gleba.imobiliaria_id] = (counts[gleba.imobiliaria_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  const createImobiliaria = useMutation({
    mutationFn: async (data: ImobiliariaInsert) => {
      const { error } = await supabase.from("imobiliarias").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["imobiliarias"] });
    },
  });

  const updateImobiliaria = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Imobiliaria> & { id: string }) => {
      const { error } = await supabase
        .from("imobiliarias")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["imobiliarias"] });
    },
  });

  const deleteImobiliaria = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("imobiliarias").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["imobiliarias"] });
    },
  });

  return {
    imobiliarias,
    isLoading,
    glebaCounts,
    createImobiliaria,
    updateImobiliaria,
    deleteImobiliaria,
  };
}
