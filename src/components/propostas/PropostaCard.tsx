import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, ExternalLink, FileText, MapPin, Trash2, Building2, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { usePropostas, PropostaWithGleba } from "@/hooks/usePropostas";
import { toast } from "sonner";

interface PropostaCardProps {
  proposta: PropostaWithGleba;
}

const TIPO_LABELS: Record<string, string> = {
  compra: "Compra",
  parceria: "Parceria",
  mista: "Mista",
};

const TIPO_COLORS: Record<string, string> = {
  compra: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  parceria: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  mista: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
};

export function PropostaCard({ proposta }: PropostaCardProps) {
  const { isAdmin } = useAuth();
  const { deleteProposta } = usePropostas();

  const handleDelete = async () => {
    try {
      await deleteProposta.mutateAsync(proposta.id);
      toast.success("Proposta excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir proposta:", error);
      toast.error("Erro ao excluir proposta");
    }
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4 flex-1">
            {/* Icon */}
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Gleba and Number */}
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                {proposta.gleba?.numero && (
                  <span className="text-xs font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    #{proposta.gleba.numero}
                  </span>
                )}
                <span className="font-semibold">
                  {proposta.gleba?.apelido || "Gleba removida"}
                </span>
                
                {/* Tipo Badge */}
                <Badge className={TIPO_COLORS[proposta.tipo] || ""} variant="outline">
                  {TIPO_LABELS[proposta.tipo] || proposta.tipo}
                </Badge>
              </div>

              {/* City */}
              {proposta.cidade && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Building2 className="h-4 w-4" />
                  <span>{proposta.cidade.nome}</span>
                </div>
              )}

              {/* Date */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(proposta.data_proposta + "T00:00:00"), "PPP", {
                    locale: ptBR,
                  })}
                </span>
              </div>

              {/* Description */}
              {proposta.descricao && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {proposta.descricao}
                </p>
              )}

              {/* File attachment */}
              {proposta.arquivo_carta && (
                <a
                  href={proposta.arquivo_carta}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Ver carta-proposta
                </a>
              )}
            </div>
          </div>

          {/* Actions */}
          {isAdmin && (
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
                  <AlertDialogTitle>Excluir proposta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. A proposta será
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
      </CardContent>
    </Card>
  );
}
