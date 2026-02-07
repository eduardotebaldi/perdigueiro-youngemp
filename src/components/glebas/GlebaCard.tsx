import { Tables } from "@/integrations/supabase/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/hooks/useGlebas";
import { MapPin, Users, DollarSign } from "lucide-react";

type Gleba = Tables<"glebas">;

const STATUS_COLORS: Record<string, string> = {
  identificada: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  informacoes_recebidas: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  visita_realizada: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  proposta_enviada: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  protocolo_assinado: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  descartada: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  proposta_recusada: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
  negocio_fechado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  standby: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

interface GlebaCardProps {
  gleba: Gleba;
}

export function GlebaCard({ gleba }: GlebaCardProps) {
  return (
    <Card className="p-4 space-y-3 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              #{gleba.numero}
            </span>
            <h3 className="font-semibold truncate">{gleba.apelido}</h3>
          </div>
          <Badge 
            className={`mt-1 ${STATUS_COLORS[gleba.status] || "bg-gray-100 text-gray-800"}`}
            variant="outline"
          >
            {STATUS_LABELS[gleba.status] || gleba.status}
          </Badge>
        </div>
      </div>

      {gleba.proprietario_nome && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span className="truncate">{gleba.proprietario_nome}</span>
        </div>
      )}

      <div className="flex gap-4 text-sm">
        {gleba.tamanho_m2 && (
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {gleba.tamanho_m2.toLocaleString()} m²
            </span>
          </div>
        )}
        {gleba.preco && (
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              R$ {gleba.preco.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {gleba.comentarios && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {gleba.comentarios}
        </p>
      )}

      {gleba.prioridade && (
        <div className="pt-2 border-t">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            ⭐ Prioridade
          </Badge>
        </div>
      )}
    </Card>
  );
}
