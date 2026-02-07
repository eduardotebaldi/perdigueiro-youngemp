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
import { Building, FileText, MoreVertical, Pencil, Trash2, MapPin, Users } from "lucide-react";
import { Cidade, useCidadeGlebas, useCidadePropostas } from "@/hooks/useCidades";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatarPopulacao } from "@/lib/ibgeApi";
interface CidadeCardProps {
  cidade: Cidade;
  onEdit: (cidade: Cidade) => void;
  onDelete: (id: string) => void;
}

export function CidadeCard({ cidade, onEdit, onDelete }: CidadeCardProps) {
  const { isAdmin } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { data: glebas } = useCidadeGlebas(cidade.id);
  const { data: propostasCount } = useCidadePropostas(cidade.id);

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
        <CardContent>
          {/* Stats */}
          <div className="flex gap-3 flex-wrap">
            {cidade.populacao && (
              <Badge variant="secondary" className="font-normal">
                <Users className="h-3 w-3 mr-1" />
                {formatarPopulacao(cidade.populacao)}
              </Badge>
            )}
            <Badge variant="secondary" className="font-normal">
              <MapPin className="h-3 w-3 mr-1" />
              {glebasCount} gleba{glebasCount !== 1 ? "s" : ""}
            </Badge>
            <Badge variant="outline" className="font-normal">
              <FileText className="h-3 w-3 mr-1" />
              {propostasCount || 0} proposta{propostasCount !== 1 ? "s" : ""}
            </Badge>
          </div>
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
