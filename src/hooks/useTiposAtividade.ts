import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TipoAtividade {
  id: string;
  nome: string;
  created_at: string;
}

export function useTiposAtividade() {
  const { data: tiposAtividade = [], isLoading } = useQuery({
    queryKey: ["tipos_atividade"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tipos_atividade")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data as TipoAtividade[];
    },
  });

  return { tiposAtividade, isLoading };
}
