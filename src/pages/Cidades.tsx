import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Building } from "lucide-react";
import { useCidades, Cidade } from "@/hooks/useCidades";
import { CidadeCard } from "@/components/cidades/CidadeCard";
import { CreateCidadeDialog } from "@/components/cidades/CreateCidadeDialog";
import { EditCidadeDialog } from "@/components/cidades/EditCidadeDialog";

export default function Cidades() {
  const { cidades, isLoading, deleteCidade } = useCidades();
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCidade, setEditingCidade] = useState<Cidade | null>(null);

  const filteredCidades = cidades?.filter((cidade) =>
    cidade.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    await deleteCidade.mutateAsync(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Cidades</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as cidades e seus planos diretores
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Cidade
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cidade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredCidades?.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Building className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">
            {searchTerm ? "Nenhuma cidade encontrada" : "Nenhuma cidade cadastrada"}
          </h3>
          <p className="text-muted-foreground mt-1 mb-4">
            {searchTerm
              ? "Tente buscar com outros termos"
              : "Comece cadastrando sua primeira cidade"}
          </p>
          {!searchTerm && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Cidade
            </Button>
          )}
        </div>
      )}

      {/* Cities Grid */}
      {!isLoading && filteredCidades && filteredCidades.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCidades.map((cidade) => (
            <CidadeCard
              key={cidade.id}
              cidade={cidade}
              onEdit={setEditingCidade}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateCidadeDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <EditCidadeDialog
        cidade={editingCidade}
        open={!!editingCidade}
        onOpenChange={(open) => !open && setEditingCidade(null)}
      />
    </div>
  );
}
