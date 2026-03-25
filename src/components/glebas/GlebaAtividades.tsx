import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Send, MessageCircle, Trash2, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTiposAtividade } from "@/hooks/useTiposAtividade";

interface GlebaAtividadesProps {
  glebaId: string;
}

interface Atividade {
  id: string;
  descricao: string;
  data: string;
  created_at: string;
  responsavel_id: string;
  tipo_atividade_id: string | null;
}

export function GlebaAtividades({ glebaId }: GlebaAtividadesProps) {
  const [novaAtividade, setNovaAtividade] = useState("");
  const [tipoAtividadeId, setTipoAtividadeId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  const { tiposAtividade } = useTiposAtividade();

  const { data: atividades = [], isLoading } = useQuery({
    queryKey: ["atividades", "gleba", glebaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atividades")
        .select("*, tipo_atividade:tipos_atividade(id, nome)")
        .eq("gleba_id", glebaId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (Atividade & { tipo_atividade: { id: string; nome: string } | null })[];
    },
    enabled: !!glebaId,
  });

  const userIds = useMemo(() => {
    const ids = atividades.map((a) => a.responsavel_id).filter(Boolean);
    return [...new Set(ids)];
  }, [atividades]);

  const { data: userProfiles = [] } = useQuery({
    queryKey: ["user_profiles", userIds],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data, error } = await supabase
        .from("user_profiles" as any)
        .select("user_id, nome")
        .in("user_id", userIds);
      if (error) throw error;
      return data as unknown as { user_id: string; nome: string }[];
    },
    enabled: userIds.length > 0,
  });

  const userNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    userProfiles.forEach((u) => {
      map[u.user_id] = u.nome || "Usuário";
    });
    return map;
  }, [userProfiles]);

  const createMutation = useMutation({
    mutationFn: async ({ descricao, tipoId }: { descricao: string; tipoId: string | null }) => {
      if (!user) throw new Error("Usuário não autenticado");
      
      const { error } = await supabase.from("atividades").insert({
        descricao,
        gleba_id: glebaId,
        responsavel_id: user.id,
        tipo_atividade_id: tipoId,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atividades", "gleba", glebaId] });
      queryClient.invalidateQueries({ queryKey: ["atividades"] });
      setNovaAtividade("");
      setTipoAtividadeId(null);
      toast.success("Atividade adicionada!");
    },
    onError: (error) => {
      console.error("Error creating atividade:", error);
      toast.error("Erro ao adicionar atividade");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("atividades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atividades", "gleba", glebaId] });
      queryClient.invalidateQueries({ queryKey: ["atividades"] });
      toast.success("Atividade removida!");
    },
    onError: (error) => {
      console.error("Error deleting atividade:", error);
      toast.error("Erro ao remover atividade");
    },
  });

  const handleSubmit = async () => {
    if (!novaAtividade.trim()) return;
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync({ descricao: novaAtividade.trim(), tipoId: tipoAtividadeId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const canDelete = (atividade: Atividade) => {
    if (isAdmin) return true;
    if (user?.id !== atividade.responsavel_id) return false;
    const createdAt = new Date(atividade.created_at);
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    return createdAt > fifteenDaysAgo;
  };

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[200px] rounded-lg border">
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : atividades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma atividade registrada</p>
            </div>
          ) : (
            atividades.map((atividade) => (
              <div
                key={atividade.id}
                className="group relative bg-muted/50 rounded-lg p-3 transition-colors hover:bg-muted/70"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {atividade.tipo_atividade && (
                        <Badge variant="secondary" className="text-xs">
                          {atividade.tipo_atividade.nome}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {atividade.descricao}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{userNameMap[atividade.responsavel_id] || "Usuário"}</span>
                      <span className="mx-1">·</span>
                      <span>{formatDateTime(atividade.created_at)}</span>
                    </p>
                  </div>
                  {canDelete(atividade) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate(atividade.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Tipo de atividade + campo */}
      <div className="space-y-2">
        <Select
          value={tipoAtividadeId || "none"}
          onValueChange={(v) => setTipoAtividadeId(v === "none" ? null : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Tipo de atividade (opcional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem tipo</SelectItem>
            {tiposAtividade.map((tipo) => (
              <SelectItem key={tipo.id} value={tipo.id}>
                {tipo.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Textarea
            placeholder="Adicionar atividade..."
            value={novaAtividade}
            onChange={(e) => setNovaAtividade(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] resize-none"
            disabled={isSubmitting}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!novaAtividade.trim() || isSubmitting}
            className="shrink-0"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Pressione Enter para enviar ou Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
}
