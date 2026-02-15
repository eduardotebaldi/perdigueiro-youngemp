import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, MapPin, Trash2, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useAtividades } from "@/hooks/useAtividades";
import { toast } from "sonner";

interface AtividadeCardProps {
  atividade: {
    id: string;
    descricao: string;
    data: string;
    created_at: string;
    responsavel_id: string;
    gleba?: { id: string; apelido: string } | null;
  };
}

export function AtividadeCard({ atividade }: AtividadeCardProps) {
  const { isAdmin, user } = useAuth();
  const { deleteAtividade } = useAtividades();

  const canDelete = (() => {
    if (isAdmin) return true;
    if (user?.id !== atividade.responsavel_id) return false;
    const createdAt = new Date(atividade.created_at || "");
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    return createdAt > fifteenDaysAgo;
  })();

  const handleDelete = async () => {
    try {
      await deleteAtividade.mutateAsync(atividade.id);
      toast.success("Atividade excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir atividade:", error);
      toast.error("Erro ao excluir atividade");
    }
  };

  return (
    <Card className="group relative">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Timeline indicator */}
          <div className="flex flex-col items-center">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <div className="w-0.5 flex-1 bg-border" />
          </div>

          {/* Content */}
          <div className="flex-1 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {/* Date */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    {format(new Date(atividade.data + "T00:00:00"), "EEEE, d 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </span>
                </div>

                {/* Description */}
                <p className="text-foreground">{atividade.descricao}</p>

                {/* Gleba link */}
                {atividade.gleba && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-primary">
                    <MapPin className="h-4 w-4" />
                    <span>{atividade.gleba.apelido}</span>
                  </div>
                )}
              </div>

              {/* Delete button (admin or owner within 15 days) */}
              {canDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir atividade?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. A atividade será
                        permanentemente removida.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
