import { useState } from "react";
import { Building2, MapPin, ExternalLink, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tables } from "@/integrations/supabase/types";
import { useGlebas, STATUS_LABELS } from "@/hooks/useGlebas";
import { useCidades } from "@/hooks/useCidades";
import { useMemo } from "react";

type Imobiliaria = Tables<"imobiliarias">;
type Gleba = Tables<"glebas">;

interface ImobiliariaGlebasDialogProps {
  imobiliaria: Imobiliaria | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewGleba?: (gleba: Gleba) => void;
}

export function ImobiliariaGlebasDialog({
  imobiliaria,
  open,
  onOpenChange,
  onViewGleba,
}: ImobiliariaGlebasDialogProps) {
  const { glebas } = useGlebas();
  const { cidades } = useCidades();

  const glebasAssociadas = useMemo(() => {
    if (!imobiliaria) return [];
    return glebas.filter((g) => g.imobiliaria_id === imobiliaria.id);
  }, [glebas, imobiliaria]);

  const getCidadeNome = (cidadeId: string | null) => {
    if (!cidadeId) return null;
    const cidade = cidades?.find((c) => c.id === cidadeId);
    return cidade?.nome || null;
  };

  if (!imobiliaria) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Glebas de {imobiliaria.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {glebasAssociadas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma gleba associada a esta imobiliária</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {glebasAssociadas.length} gleba{glebasAssociadas.length !== 1 && "s"} associada{glebasAssociadas.length !== 1 && "s"}
              </p>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {glebasAssociadas.map((gleba) => (
                    <div
                      key={gleba.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-muted-foreground">
                            #{gleba.numero}
                          </span>
                          <span className="font-medium truncate">{gleba.apelido}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {STATUS_LABELS[gleba.status]}
                          </Badge>
                          {getCidadeNome(gleba.cidade_id) && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {getCidadeNome(gleba.cidade_id)}
                            </span>
                          )}
                          {gleba.tamanho_m2 && (
                            <span className="text-xs text-muted-foreground">
                              {gleba.tamanho_m2} ha
                            </span>
                          )}
                        </div>
                      </div>
                      {onViewGleba && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewGleba(gleba)}
                          className="shrink-0"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
