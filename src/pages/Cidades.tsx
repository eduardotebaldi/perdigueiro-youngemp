import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Building, RefreshCw, Loader2 } from "lucide-react";
import { useCidades, Cidade } from "@/hooks/useCidades";
import { useAuth } from "@/contexts/AuthContext";
import { CidadeCard } from "@/components/cidades/CidadeCard";
import { CreateCidadeDialog } from "@/components/cidades/CreateCidadeDialog";
import { EditCidadeDialog } from "@/components/cidades/EditCidadeDialog";
import { NormalizeCidadesDialog } from "@/components/cidades/NormalizeCidadesDialog";
import { supabase } from "@/integrations/supabase/client";
import { buscarPopulacaoMunicipio } from "@/lib/ibgeApi";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface MunicipioIBGE {
  id: number;
  nome: string;
  microrregiao?: {
    mesorregiao?: {
      UF?: {
        sigla: string;
      };
    };
  };
}

export default function Cidades() {
  const { cidades, isLoading, deleteCidade } = useCidades();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [ufFilter, setUfFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCidade, setEditingCidade] = useState<Cidade | null>(null);
  const [updatingPopulations, setUpdatingPopulations] = useState(false);

  // Extract unique UFs from city names (format: "Cidade/UF")
  const availableUFs = useMemo(() => {
    if (!cidades) return [];
    const ufs = new Set<string>();
    cidades.forEach((c) => {
      const match = c.nome.match(/\/([A-Z]{2})$/i);
      if (match) ufs.add(match[1].toUpperCase());
    });
    return Array.from(ufs).sort();
  }, [cidades]);

  const filteredCidades = useMemo(() => {
    return cidades?.filter((cidade) => {
      const matchesSearch = cidade.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUF = ufFilter === "all" || cidade.nome.toUpperCase().endsWith(`/${ufFilter}`);
      return matchesSearch && matchesUF;
    });
  }, [cidades, searchTerm, ufFilter]);

  const handleDelete = async (id: string) => {
    await deleteCidade.mutateAsync(id);
  };

  const handleUpdatePopulations = async () => {
    if (!cidades) return;
    const cidadesSemDados = cidades.filter((c) => !c.populacao || !c.codigo_ibge);
    if (cidadesSemDados.length === 0) {
      toast.info("Todas as cidades já possuem dados populacionais.");
      return;
    }

    setUpdatingPopulations(true);
    try {
      // Fetch IBGE municipalities list
      const response = await fetch(
        "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome"
      );
      if (!response.ok) throw new Error("Erro ao buscar dados do IBGE");
      const municipios: MunicipioIBGE[] = await response.json();

      const normalize = (s: string) =>
        s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

      let updated = 0;
      let errors = 0;

      for (const cidade of cidadesSemDados) {
        // Parse "Cidade/UF" format
        const match = cidade.nome.match(/^(.+?)\/([A-Z]{2})$/i);
        if (!match) continue;

        const cidadeNome = normalize(match[1]);
        const cidadeUF = match[2].toUpperCase();

        // Find matching IBGE municipality
        const municipio = municipios.find((m) => {
          const uf = m.microrregiao?.mesorregiao?.UF?.sigla || "";
          return normalize(m.nome) === cidadeNome && uf === cidadeUF;
        });

        if (!municipio) continue;

        // Fetch population
        const populacao = await buscarPopulacaoMunicipio(municipio.id);

        const updateData: Record<string, any> = {};
        if (!cidade.codigo_ibge) updateData.codigo_ibge = municipio.id;
        if (!cidade.populacao && populacao) updateData.populacao = populacao;

        if (Object.keys(updateData).length > 0) {
          const { error } = await supabase
            .from("cidades")
            .update(updateData)
            .eq("id", cidade.id);
          if (error) {
            errors++;
          } else {
            updated++;
          }
        }

        // Small delay to avoid rate limiting on IBGE API
        await new Promise((r) => setTimeout(r, 300));
      }

      queryClient.invalidateQueries({ queryKey: ["cidades"] });
      if (updated > 0) toast.success(`${updated} cidade(s) atualizada(s)!`);
      if (errors > 0) toast.error(`${errors} erro(s) ao atualizar`);
      if (updated === 0 && errors === 0) toast.info("Nenhuma cidade pôde ser atualizada. Verifique se os nomes estão no formato Cidade/UF.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar populações");
    } finally {
      setUpdatingPopulations(false);
    }
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
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Button
              variant="outline"
              onClick={handleUpdatePopulations}
              disabled={updatingPopulations}
            >
              {updatingPopulations ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Atualizar Populações
            </Button>
          )}
          {isAdmin && <NormalizeCidadesDialog />}
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Cidade
          </Button>
        </div>
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