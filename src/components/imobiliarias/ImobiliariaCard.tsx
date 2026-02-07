import { Building2, ExternalLink, MapPin, Pencil, Phone, Trash2, User } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { useImobiliarias } from "@/hooks/useImobiliarias";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Imobiliaria = Tables<"imobiliarias">;

interface ImobiliariaCardProps {
  imobiliaria: Imobiliaria;
  glebaCount: number;
  onEdit: (imobiliaria: Imobiliaria) => void;
}

export function ImobiliariaCard({ imobiliaria, glebaCount, onEdit }: ImobiliariaCardProps) {
  const { isAdmin } = useAuth();
  const { deleteImobiliaria } = useImobiliarias();

  const handleDelete = async () => {
    try {
      await deleteImobiliaria.mutateAsync(imobiliaria.id);
      toast.success("Imobiliária excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir imobiliária:", error);
      toast.error("Erro ao excluir imobiliária");
    }
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{imobiliaria.nome}</h3>
              <Badge variant="secondary" className="mt-1">
                <MapPin className="h-3 w-3 mr-1" />
                {glebaCount} gleba{glebaCount !== 1 && "s"}
              </Badge>
            </div>
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" onClick={() => onEdit(imobiliaria)}>
              <Pencil className="h-4 w-4" />
            </Button>
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir imobiliária?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. A imobiliária "{imobiliaria.nome}" será permanentemente removida.
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
      </CardHeader>

      <CardContent className="space-y-2">
        {imobiliaria.contato_nome && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{imobiliaria.contato_nome}</span>
          </div>
        )}

        {imobiliaria.telefone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <a href={`tel:${imobiliaria.telefone}`} className="hover:text-primary transition-colors">
              {imobiliaria.telefone}
            </a>
          </div>
        )}

        {imobiliaria.link_social && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ExternalLink className="h-4 w-4" />
            <a
              href={imobiliaria.link_social}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors truncate max-w-[200px]"
            >
              {imobiliaria.link_social.replace(/^https?:\/\//, "")}
            </a>
          </div>
        )}

        {!imobiliaria.contato_nome && !imobiliaria.telefone && !imobiliaria.link_social && (
          <p className="text-sm text-muted-foreground italic">
            Nenhuma informação de contato cadastrada
          </p>
        )}
      </CardContent>
    </Card>
  );
}
