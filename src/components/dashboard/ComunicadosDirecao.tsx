import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Plus, Pencil, Trash2, Send, X } from "lucide-react";
import { useComunicados } from "@/hooks/useComunicados";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ComunicadosDirecao() {
  const { isAdmin, user } = useAuth();
  const { comunicados, isLoading, createMutation, updateMutation, deleteMutation } = useComunicados();
  const { toast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) return null;
  if (!isAdmin && comunicados.length === 0) return null;

  const handleCreate = async () => {
    if (!text.trim()) return;
    const nome = user?.user_metadata?.full_name || user?.email || "Admin";
    await createMutation.mutateAsync({ conteudo: text.trim(), autorNome: nome });
    setText("");
    setIsCreating(false);
    toast({ title: "Comunicado publicado" });
  };

  const handleUpdate = async () => {
    if (!editingId || !text.trim()) return;
    await updateMutation.mutateAsync({ id: editingId, conteudo: text.trim() });
    setText("");
    setEditingId(null);
    toast({ title: "Comunicado atualizado" });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
    toast({ title: "Comunicado excluído" });
  };

  const startEdit = (id: string, conteudo: string) => {
    setEditingId(id);
    setText(conteudo);
    setIsCreating(false);
  };

  const cancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setText("");
  };

  return (
    <>
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Comunicados da Direção
            {isAdmin && !isCreating && !editingId && (
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto h-7 text-xs"
                onClick={() => { setIsCreating(true); setEditingId(null); setText(""); }}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Novo
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Form for create/edit */}
          {isAdmin && (isCreating || editingId) && (
            <div className="space-y-2">
              <Textarea
                placeholder="Digite o comunicado..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={1000}
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={cancel}>
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={editingId ? handleUpdate : handleCreate}
                  disabled={!text.trim() || createMutation.isPending || updateMutation.isPending}
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  {editingId ? "Salvar" : "Publicar"}
                </Button>
              </div>
            </div>
          )}

          {/* List */}
          {comunicados.length === 0 && !isCreating ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Nenhum comunicado no momento.
            </p>
          ) : (
            comunicados.map((c) => (
              <div
                key={c.id}
                className="rounded-lg border bg-background px-4 py-3 space-y-1.5"
              >
                <p className="text-sm whitespace-pre-wrap">{c.conteudo}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {c.autor_nome} · {format(new Date(c.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {c.updated_at !== c.created_at && " (editado)"}
                  </span>
                  {isAdmin && !editingId && !isCreating && (
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => startEdit(c.id, c.conteudo)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive"
                        onClick={() => setDeleteId(c.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comunicado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O comunicado será removido para todos os usuários.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
