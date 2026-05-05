import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Gleba = Tables<"glebas">;

const STATUS_LABELS: Record<string, string> = {
  identificada: "Identificada",
  analise_interna_realizada: "Análise Interna Realizada",
  informacoes_recebidas: "Informações Recebidas",
  visita_realizada: "Visita Realizada",
  proposta_enviada: "Proposta Enviada",
  minuta_enviada: "Minuta Enviada",
  protocolo_assinado: "Protocolo Assinado",
  descartada: "Descartada",
  proposta_recusada: "Proposta Recusada",
  negocio_fechado: "Negócio Fechado",
  standby: "Standby",
};

const STATUS_ORDER = [
  "identificada",
  "informacoes_recebidas",
  "analise_interna_realizada",
  "proposta_enviada",
  "minuta_enviada",
  "protocolo_assinado",
  "descartada",
  "proposta_recusada",
  "negocio_fechado",
  "standby",
];

export function useGlebas() {
  const { data: glebas = [], isLoading, refetch } = useQuery({
    queryKey: ["glebas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("glebas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Gleba[];
    },
  });

  const updateGlebaStatus = async (glebaId: string, newStatus: string) => {
    const updateData: any = { status: newStatus };
    if (newStatus === "negocio_fechado") {
      updateData.data_fechamento = new Date().toISOString().split("T")[0];
    }
    const { error } = await supabase
      .from("glebas")
      .update(updateData)
      .eq("id", glebaId);

    if (error) throw error;
    await refetch();
  };

  const createGleba = async (data: Partial<Gleba> & { apelido: string; status: string }) => {
    const { error } = await supabase.from("glebas").insert([data as any]);
    if (error) throw error;
    await refetch();
  };

  const updateGleba = async (glebaId: string, data: Partial<Gleba>) => {
    const { error } = await supabase
      .from("glebas")
      .update(data)
      .eq("id", glebaId);

    if (error) throw error;
    await refetch();
  };

  const deleteGleba = async (glebaId: string) => {
    const { error } = await supabase
      .from("glebas")
      .delete()
      .eq("id", glebaId);

    if (error) throw error;
    await refetch();
  };

  const getGlebasByStatus = (status: string) => {
    return glebas.filter((g) => g.status === status);
  };

  return {
    glebas,
    isLoading,
    refetch,
    updateGlebaStatus,
    createGleba,
    updateGleba,
    deleteGleba,
    getGlebasByStatus,
  };
}

export { STATUS_LABELS, STATUS_ORDER };