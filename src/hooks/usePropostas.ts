import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";

type Proposta = Tables<"propostas">;
type PropostaInsert = TablesInsert<"propostas">;

export interface PropostaWithGleba extends Proposta {
  gleba: { 
    id: string; 
    apelido: string; 
    numero: number | null;
    cidade_id: string | null;
  } | null;
  cidade?: { id: string; nome: string } | null;
}

export function usePropostas() {
  const queryClient = useQueryClient();

  const { data: propostas = [], isLoading } = useQuery({
    queryKey: ["propostas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("propostas")
        .select(`
          *,
          gleba:glebas(id, apelido, numero, cidade_id)
        `)
        .order("data_proposta", { ascending: false });

      if (error) throw error;
      
      // Fetch cities for glebas that have cidade_id
      const cidadeIds = [...new Set(
        data
          ?.map((p: any) => p.gleba?.cidade_id)
          .filter(Boolean) || []
      )];
      
      let cidadesMap: Record<string, { id: string; nome: string }> = {};
      if (cidadeIds.length > 0) {
        const { data: cidades } = await supabase
          .from("cidades")
          .select("id, nome")
          .in("id", cidadeIds);
        
        cidadesMap = (cidades || []).reduce((acc, c) => {
          acc[c.id] = c;
          return acc;
        }, {} as Record<string, { id: string; nome: string }>);
      }
      
      return data?.map((p: any) => ({
        ...p,
        cidade: p.gleba?.cidade_id ? cidadesMap[p.gleba.cidade_id] : null,
      })) as PropostaWithGleba[];
    },
  });

  const createProposta = useMutation({
    mutationFn: async (data: PropostaInsert) => {
      const { error } = await supabase.from("propostas").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["propostas"] });
    },
  });

  const updateProposta = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Proposta> & { id: string }) => {
      const { error } = await supabase
        .from("propostas")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["propostas"] });
    },
  });

  const deleteProposta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("propostas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["propostas"] });
    },
  });

  const uploadCartaProposta = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `cartas/${fileName}`;

    const { error } = await supabase.storage
      .from("propostas")
      .upload(filePath, file);

    if (error) throw error;

    // Return the storage path, not public URL (bucket is private)
    return filePath;
  };

  const getCartaPropostaUrl = async (filePath: string): Promise<string | null> => {
    if (!filePath) return null;
    
    const { data, error } = await supabase.storage
      .from("propostas")
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      console.error("Error creating signed URL:", error);
      return null;
    }
    
    return data.signedUrl;
  };

  return {
    propostas,
    isLoading,
    createProposta,
    updateProposta,
    deleteProposta,
    uploadCartaProposta,
    getCartaPropostaUrl,
  };
}

export function usePropostasByGleba(glebaId: string | null) {
  return useQuery({
    queryKey: ["propostas", "gleba", glebaId],
    queryFn: async () => {
      if (!glebaId) return [];

      const { data, error } = await supabase
        .from("propostas")
        .select("*")
        .eq("gleba_id", glebaId)
        .order("data_proposta", { ascending: false });

      if (error) throw error;
      return data as Proposta[];
    },
    enabled: !!glebaId,
  });
}
