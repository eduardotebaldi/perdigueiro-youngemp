import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Cidade = Tables<"cidades">;
export type CidadeInsert = TablesInsert<"cidades">;
export type CidadeUpdate = TablesUpdate<"cidades">;

export function useCidades() {
  const queryClient = useQueryClient();

  const { data: cidades, isLoading, error } = useQuery({
    queryKey: ["cidades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cidades")
        .select("*")
        .order("nome", { ascending: true });

      if (error) throw error;
      return data as Cidade[];
    },
  });

  const createCidade = useMutation({
    mutationFn: async (cidade: CidadeInsert) => {
      const { data, error } = await supabase
        .from("cidades")
        .insert(cidade)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cidades"] });
      toast.success("Cidade criada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar cidade:", error);
      toast.error("Erro ao criar cidade");
    },
  });

  const updateCidade = useMutation({
    mutationFn: async ({ id, ...updates }: CidadeUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("cidades")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cidades"] });
      toast.success("Cidade atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar cidade:", error);
      toast.error("Erro ao atualizar cidade");
    },
  });

  const deleteCidade = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cidades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cidades"] });
      toast.success("Cidade excluída com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao excluir cidade:", error);
      toast.error("Erro ao excluir cidade");
    },
  });

  const uploadPlanoDiretor = async (cidadeId: string, file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${cidadeId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("planos-diretores")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("planos-diretores")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const removePlanoDiretor = async (cidadeId: string, url: string) => {
    // Extract file path from URL
    const urlParts = url.split("/planos-diretores/");
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      await supabase.storage.from("planos-diretores").remove([filePath]);
    }
  };

  return {
    cidades,
    isLoading,
    error,
    createCidade,
    updateCidade,
    deleteCidade,
    uploadPlanoDiretor,
    removePlanoDiretor,
  };
}

export function useCidadeGlebas(cidadeId: string | null) {
  return useQuery({
    queryKey: ["cidades", cidadeId, "glebas"],
    queryFn: async () => {
      if (!cidadeId) return [];
      
      const { data, error } = await supabase
        .from("glebas")
        .select("id, apelido, status, tamanho_m2, preco")
        .eq("cidade_id", cidadeId)
        .order("apelido", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!cidadeId,
  });
}

export function useCidadePropostas(cidadeId: string | null) {
  return useQuery({
    queryKey: ["cidades", cidadeId, "propostas"],
    queryFn: async () => {
      if (!cidadeId) return 0;
      
      // First get all glebas for this city
      const { data: glebas, error: glebasError } = await supabase
        .from("glebas")
        .select("id")
        .eq("cidade_id", cidadeId);

      if (glebasError) throw glebasError;
      if (!glebas || glebas.length === 0) return 0;

      const glebaIds = glebas.map(g => g.id);

      // Then count propostas for these glebas
      const { count, error: propostasError } = await supabase
        .from("propostas")
        .select("id", { count: "exact", head: true })
        .in("gleba_id", glebaIds);

      if (propostasError) throw propostasError;
      return count || 0;
    },
    enabled: !!cidadeId,
  });
}
