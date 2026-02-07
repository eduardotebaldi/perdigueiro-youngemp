import { useState, useMemo } from "react";
import { Building2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useImobiliarias } from "@/hooks/useImobiliarias";
import { CreateImobiliariaDialog } from "@/components/imobiliarias/CreateImobiliariaDialog";
import { EditImobiliariaDialog } from "@/components/imobiliarias/EditImobiliariaDialog";
import { ImobiliariaCard } from "@/components/imobiliarias/ImobiliariaCard";
import { ImobiliariaGlebasDialog } from "@/components/imobiliarias/ImobiliariaGlebasDialog";
import { GlebaDetailsDialog } from "@/components/glebas/GlebaDetailsDialog";
import { EditGlebaDialog } from "@/components/glebas/EditGlebaDialog";
import { Tables } from "@/integrations/supabase/types";

type Imobiliaria = Tables<"imobiliarias">;
type Gleba = Tables<"glebas">;

export default function Imobiliarias() {
  const { imobiliarias, isLoading, glebaCounts } = useImobiliarias();
  const [search, setSearch] = useState("");
  const [editingImobiliaria, setEditingImobiliaria] = useState<Imobiliaria | null>(null);
  const [viewingImobiliaria, setViewingImobiliaria] = useState<Imobiliaria | null>(null);
  const [viewingGleba, setViewingGleba] = useState<Gleba | null>(null);
  const [editingGleba, setEditingGleba] = useState<Gleba | null>(null);

  const handleViewGleba = (gleba: Gleba) => {
    setViewingGleba(gleba);
  };

  const handleEditGleba = (gleba: Gleba) => {
    setViewingGleba(null);
    setEditingGleba(gleba);
  };

  const filteredImobiliarias = useMemo(() => {
    if (!search) return imobiliarias;

    const searchLower = search.toLowerCase();
    return imobiliarias.filter(
      (imob) =>
        imob.nome.toLowerCase().includes(searchLower) ||
        imob.contato_nome?.toLowerCase().includes(searchLower)
    );
  }, [imobiliarias, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Imobiliárias</h1>
          </div>
          <p className="text-muted-foreground">
            Gerencie as imobiliárias parceiras e seus contatos
          </p>
        </div>

        <CreateImobiliariaDialog />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar imobiliária ou contato..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Edit Dialog */}
      <EditImobiliariaDialog
        imobiliaria={editingImobiliaria}
        open={!!editingImobiliaria}
        onOpenChange={(open) => !open && setEditingImobiliaria(null)}
      />

      {/* Imobiliaria Glebas Dialog */}
      <ImobiliariaGlebasDialog
        imobiliaria={viewingImobiliaria}
        open={!!viewingImobiliaria}
        onOpenChange={(open) => !open && setViewingImobiliaria(null)}
        onViewGleba={handleViewGleba}
      />

      {/* Gleba Details Dialog */}
      <GlebaDetailsDialog
        gleba={viewingGleba}
        open={!!viewingGleba}
        onOpenChange={(open) => !open && setViewingGleba(null)}
        onEdit={handleEditGleba}
      />

      {/* Gleba Edit Dialog */}
      <EditGlebaDialog
        gleba={editingGleba}
        open={!!editingGleba}
        onOpenChange={(open) => !open && setEditingGleba(null)}
      />

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredImobiliarias.length} imobiliária{filteredImobiliarias.length !== 1 && "s"}
      </p>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredImobiliarias.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma imobiliária encontrada</p>
          <p className="text-sm">Cadastre sua primeira imobiliária clicando no botão acima</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredImobiliarias.map((imobiliaria) => (
            <ImobiliariaCard
              key={imobiliaria.id}
              imobiliaria={imobiliaria}
              glebaCount={glebaCounts[imobiliaria.id] || 0}
              onEdit={setEditingImobiliaria}
              onClick={() => setViewingImobiliaria(imobiliaria)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
