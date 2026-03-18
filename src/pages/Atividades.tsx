import { CreateAtividadeDialog } from "@/components/atividades/CreateAtividadeDialog";
import { AtividadesList } from "@/components/atividades/AtividadesList";

export default function Atividades() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div></div>

        <CreateAtividadeDialog />
      </div>

      {/* Activities List */}
      <AtividadesList />
    </div>
  );
}
