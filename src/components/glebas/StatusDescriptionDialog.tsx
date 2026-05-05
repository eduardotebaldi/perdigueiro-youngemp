import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface StatusDescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: string;
  statusLabel: string;
}

export function StatusDescriptionDialog({
  open,
  onOpenChange,
  status,
  statusLabel,
}: StatusDescriptionDialogProps) {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["gleba_status_descricao", status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gleba_status_descricoes")
        .select("descricao")
        .eq("status", status)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  useEffect(() => {
    if (open) setText(data?.descricao ?? "");
  }, [open, data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("gleba_status_descricoes")
        .upsert({ status, descricao: text, updated_by: (await supabase.auth.getUser()).data.user?.id }, { onConflict: "status" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gleba_status_descricao", status] });
      toast({ title: "Descrição salva" });
      onOpenChange(false);
    },
    onError: (e: any) => toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Descrição da etapa — {statusLabel}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center p-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : isAdmin ? (
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="Descreva o que esta etapa significa..."
          />
        ) : (
          <div className="text-sm whitespace-pre-wrap min-h-[120px]">
            {text || <span className="text-muted-foreground italic">Nenhuma descrição cadastrada.</span>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          {isAdmin && (
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
