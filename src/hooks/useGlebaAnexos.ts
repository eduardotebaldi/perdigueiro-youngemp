import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type TipoAnexo = "pesquisa_mercado" | "planilha_viabilidade" | "matricula_imovel";

interface GlebaAnexo {
  id: string;
  gleba_id: string;
  tipo: TipoAnexo;
  arquivo: string;
  nome_arquivo: string;
  created_at: string;
  created_by: string | null;
}

export function useGlebaAnexos(glebaId: string | null) {
  const queryClient = useQueryClient();

  const { data: anexos = [], isLoading } = useQuery({
    queryKey: ["gleba_anexos", glebaId],
    queryFn: async () => {
      if (!glebaId) return [];
      const { data, error } = await supabase
        .from("gleba_anexos")
        .select("*")
        .eq("gleba_id", glebaId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GlebaAnexo[];
    },
    enabled: !!glebaId,
  });

  const uploadAnexo = useMutation({
    mutationFn: async ({ file, tipo, glebaId: gId }: { file: File; tipo: TipoAnexo; glebaId: string }) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${gId}/${tipo}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("gleba-anexos")
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from("gleba_anexos")
        .insert({
          gleba_id: gId,
          tipo: tipo as any,
          arquivo: fileName,
          nome_arquivo: file.name,
        });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gleba_anexos", glebaId] });
    },
  });

  const deleteAnexo = useMutation({
    mutationFn: async (anexo: GlebaAnexo) => {
      await supabase.storage.from("gleba-anexos").remove([anexo.arquivo]);
      const { error } = await supabase.from("gleba_anexos").delete().eq("id", anexo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gleba_anexos", glebaId] });
    },
  });

  const getSignedUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from("gleba-anexos")
      .createSignedUrl(filePath, 3600);
    if (error) return null;
    return data.signedUrl;
  };

  const getAnexosByTipo = (tipo: TipoAnexo) => anexos.filter((a) => a.tipo === tipo);

  return {
    anexos,
    isLoading,
    uploadAnexo,
    deleteAnexo,
    getSignedUrl,
    getAnexosByTipo,
  };
}

export const TIPO_ANEXO_LABELS: Record<string, string> = {
  pesquisa_mercado: "Pesquisa de Mercado",
  planilha_viabilidade: "Planilha de Viabilidade",
  matricula_imovel: "Matrícula do Imóvel",
};

export const TIPO_ANEXO_ACCEPT: Record<string, string> = {
  pesquisa_mercado: ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp",
  planilha_viabilidade: ".xlsx,.xls,.csv,.ods",
  matricula_imovel: ".pdf,.jpg,.jpeg,.png,.webp",
};
