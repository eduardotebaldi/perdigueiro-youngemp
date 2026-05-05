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
import { Building, FileText, MoreVertical, Pencil, Trash2, MapPin, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Cidade, useCidadeGlebas, useCidadePropostas } from "@/hooks/useCidades";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatarPopulacao } from "@/lib/ibgeApi";
import { STATUS_LABELS } from "@/hooks/useGlebas";

const GLEBA_STATUS_COLORS: Record<string, string> = {
  identificada: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  analise_interna_realizada: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  informacoes_recebidas: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  visita_realizada: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  proposta_enviada: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  minuta_enviada: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  protocolo_assinado: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  descartada: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  proposta_recusada: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
  negocio_fechado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  standby: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

interface CidadeCardProps {
  cidade: Cidade;
  onEdit: (cidade: Cidade) => void;
  onDelete: (id: string) => void;
}

export function CidadeCard({ cidade, onEdit, onDelete }: CidadeCardProps) {
  const { isAdmin } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showGlebas, setShowGlebas] = useState(false);
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
        <CardContent className="space-y-3">
          {/* Stats */}
          <div className="flex gap-3 flex-wrap">
            {cidade.populacao && (
              <Badge variant="secondary" className="font-normal">
                <Users className="h-3 w-3 mr-1" />
                {formatarPopulacao(cidade.populacao)}
              </Badge>
            )}
            <Badge
              variant="secondary"
              className="font-normal cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={() => glebasCount > 0 && setShowGlebas(!showGlebas)}
            >
              <MapPin className="h-3 w-3 mr-1" />
              {glebasCount} gleba{glebasCount !== 1 ? "s" : ""}
              {glebasCount > 0 && (
                showGlebas
                  ? <ChevronUp className="h-3 w-3 ml-1" />
                  : <ChevronDown className="h-3 w-3 ml-1" />
              )}
            </Badge>
            <Badge variant="outline" className="font-normal">
              <FileText className="h-3 w-3 mr-1" />
              {propostasCount || 0} proposta{propostasCount !== 1 ? "s" : ""}
            </Badge>
          </div>

          {/* Glebas list */}
          {showGlebas && glebas && glebas.length > 0 && (
            <div className="border-t pt-3 space-y-1.5">
              {glebas.map((gleba) => (
                <div
                  key={gleba.id}
                  className="flex items-center justify-between text-sm px-2 py-1.5 rounded-md bg-muted/50"
                >
                  <span className="font-medium truncate">{gleba.apelido}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {gleba.tamanho_m2 && (
                      <span className="text-xs text-muted-foreground">
                        {gleba.tamanho_m2.toLocaleString("pt-BR")} ha
                      </span>
                    )}
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${GLEBA_STATUS_COLORS[gleba.status] || ""}`}>
                      {STATUS_LABELS[gleba.status] || gleba.status}
                    </Badge>
                  </div>
                </div>
              ))}
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