import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GlebaAnexo {
  id: string;
  gleba_id: string;
  tipo: string;
  arquivo: string;
  nome_arquivo: string;
  created_at: string;
  created_by: string | null;
  tipo_arquivo_id: string | null;
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
    mutationFn: async ({ file, tipo, glebaId: gId }: { file: File; tipo: string; glebaId: string }) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${gId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

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

  const addDriveLink = useMutation({
    mutationFn: async ({ link, tipo, glebaId: gId, nome }: { link: string; tipo: string; glebaId: string; nome: string }) => {
      const { error } = await supabase
        .from("gleba_anexos")
        .insert({
          gleba_id: gId,
          tipo: tipo as any,
          arquivo: link,
          nome_arquivo: nome,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gleba_anexos", glebaId] });
    },
  });

  const deleteAnexo = useMutation({
    mutationFn: async (anexo: GlebaAnexo) => {
      if (!anexo.arquivo.startsWith("http")) {
        await supabase.storage.from("gleba-anexos").remove([anexo.arquivo]);
      }
      const { error } = await supabase.from("gleba_anexos").delete().eq("id", anexo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gleba_anexos", glebaId] });
    },
  });

  const updateAnexoTipo = useMutation({
    mutationFn: async ({ anexoId, tipoArquivoId }: { anexoId: string; tipoArquivoId: string | null }) => {
      const { error } = await supabase
        .from("gleba_anexos")
        .update({ tipo_arquivo_id: tipoArquivoId } as any)
        .eq("id", anexoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gleba_anexos", glebaId] });
    },
  });

  const getSignedUrl = async (filePath: string): Promise<string | null> => {
    if (filePath.startsWith("http")) return filePath;
    const { data, error } = await supabase.storage
      .from("gleba-anexos")
      .createSignedUrl(filePath, 3600);
    if (error) return null;
    return data.signedUrl;
  };

  const isGoogleDriveLink = (path: string) => path.startsWith("http");

  return {
    anexos,
    isLoading,
    uploadAnexo,
    addDriveLink,
    deleteAnexo,
    updateAnexoTipo,
    getSignedUrl,
    isGoogleDriveLink,
  };
}
