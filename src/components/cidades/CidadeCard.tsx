import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Building, FileText, MoreVertical, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Cidade, useCidadeGlebas } from "@/hooks/useCidades";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CidadeCardProps {
  cidade: Cidade;
  onEdit: (cidade: Cidade) => void;
  onDelete: (id: string) => void;
}

export function CidadeCard({ cidade, onEdit, onDelete }: CidadeCardProps) {
  const { isAdmin } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { data: glebas } = useCidadeGlebas(cidade.id);

  const planosCount = cidade.planos_diretores?.length || 0;
  const glebasCount = glebas?.length || 0;

  return (
    <>
      <Card className="hover:border-primary/30 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{cidade.nome}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cadastrada em {format(new Date(cidade.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(cidade)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-normal">
                {glebasCount} gleba{glebasCount !== 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-normal">
                <FileText className="h-3 w-3 mr-1" />
                {planosCount} plano{planosCount !== 1 ? "s" : ""} diretor{planosCount !== 1 ? "es" : ""}
              </Badge>
            </div>
          </div>

          {/* Planos Diretores */}
          {planosCount > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Planos Diretores:</p>
              <div className="flex flex-wrap gap-2">
                {cidade.planos_diretores?.slice(0, 3).map((url, index) => {
                  const fileName = url.split("/").pop() || `Plano ${index + 1}`;
                  return (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <FileText className="h-3 w-3" />
                      {fileName.length > 20 ? `${fileName.slice(0, 17)}...` : fileName}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  );
                })}
                {planosCount > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{planosCount - 3} mais
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Glebas Associadas */}
          {glebasCount > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Glebas Associadas:</p>
              <div className="flex flex-wrap gap-1">
                {glebas?.slice(0, 5).map((gleba) => (
                  <Badge key={gleba.id} variant="outline" className="text-xs font-normal">
                    {gleba.apelido}
                  </Badge>
                ))}
                {glebasCount > 5 && (
                  <Badge variant="outline" className="text-xs font-normal">
                    +{glebasCount - 5}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cidade?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A cidade "{cidade.nome}" será excluída permanentemente.
              {glebasCount > 0 && (
                <span className="block mt-2 text-destructive">
                  Atenção: Existem {glebasCount} gleba(s) associada(s) a esta cidade.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(cidade.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
