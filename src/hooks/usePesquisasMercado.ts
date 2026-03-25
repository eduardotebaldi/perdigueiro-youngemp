import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PesquisaMercado {
  id: string;
  nome: string;
  cidade_id: string | null;
  data_pesquisa: string;
  observacoes: string | null;
  kmz_file: string | null;
  created_by: string | null;
  created_at: string;
  cidade?: { id: string; nome: string } | null;
}

export interface PesquisaTerreno {
  id: string;
  pesquisa_id: string;
  nome: string;
  preco: number | null;
  tamanho_m2: number | null;
  condicoes_pagamento: string | null;
  tipo_terreno: string | null;
  observacoes: string | null;
  url_anuncio: string | null;
  latitude: number | null;
  longitude: number | null;
  placemark_name: string | null;
  created_at: string;
}

export function usePesquisasMercado() {
  const queryClient = useQueryClient();

  const { data: pesquisas = [], isLoading } = useQuery({
    queryKey: ["pesquisas_mercado"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pesquisas_mercado")
        .select("*, cidade:cidades(id, nome)")
        .order("data_pesquisa", { ascending: false });
      if (error) throw error;
      return data as PesquisaMercado[];
    },
  });

  const createPesquisa = useMutation({
    mutationFn: async (data: { nome: string; cidade_id: string | null; data_pesquisa: string; observacoes?: string }) => {
      const { error } = await supabase.from("pesquisas_mercado").insert(data as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pesquisas_mercado"] }),
  });

  const updatePesquisa = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; nome?: string; cidade_id?: string | null; data_pesquisa?: string; observacoes?: string }) => {
      const { error } = await supabase.from("pesquisas_mercado").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pesquisas_mercado"] }),
  });

  const deletePesquisa = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pesquisas_mercado").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pesquisas_mercado"] }),
  });

  return { pesquisas, isLoading, createPesquisa, updatePesquisa, deletePesquisa };
}

export function usePesquisaTerrenos(pesquisaId: string | null) {
  const queryClient = useQueryClient();

  const { data: terrenos = [], isLoading } = useQuery({
    queryKey: ["pesquisa_terrenos", pesquisaId],
    queryFn: async () => {
      if (!pesquisaId) return [];
      const { data, error } = await supabase
        .from("pesquisa_mercado_terrenos")
        .select("*")
        .eq("pesquisa_id", pesquisaId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as PesquisaTerreno[];
    },
    enabled: !!pesquisaId,
  });

  const createTerreno = useMutation({
    mutationFn: async (data: Partial<PesquisaTerreno> & { pesquisa_id: string; nome: string }) => {
      const { error } = await supabase.from("pesquisa_mercado_terrenos").insert(data as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pesquisa_terrenos", pesquisaId] }),
  });

  const updateTerreno = useMutation({
    mutationFn: async ({ id, ...data }: Partial<PesquisaTerreno> & { id: string }) => {
      const { error } = await supabase.from("pesquisa_mercado_terrenos").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pesquisa_terrenos", pesquisaId] }),
  });

  const deleteTerreno = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pesquisa_mercado_terrenos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pesquisa_terrenos", pesquisaId] }),
  });

  return { terrenos, isLoading, createTerreno, updateTerreno, deleteTerreno };
}
