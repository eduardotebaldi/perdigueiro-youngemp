import { CalendarDays } from "lucide-react";
import { CreateAtividadeDialog } from "@/components/atividades/CreateAtividadeDialog";
import { AtividadesList } from "@/components/atividades/AtividadesList";

export default function Atividades() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Atividades</h1>
          </div>
          <p className="text-muted-foreground">
            Registre e acompanhe as atividades diárias do time
          </p>
        </div>

        <CreateAtividadeDialog />
      </div>

      {/* Activities List */}
      <AtividadesList />
    </div>
  );
}
