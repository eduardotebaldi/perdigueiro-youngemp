import { useState, useMemo, useEffect } from "react";
import { Tables } from "@/integrations/supabase/types";
import { useGlebas, STATUS_LABELS } from "@/hooks/useGlebas";
import { useCidades } from "@/hooks/useCidades";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X, Star, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ColumnSelector, AVAILABLE_COLUMNS } from "./ColumnSelector";

type Gleba = Tables<"glebas">;

interface GlebaTableProps {
  onViewGleba: (gleba: Gleba) => void;
}

const STATUS_COLORS: Record<string, string> = {
  identificada: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  informacoes_recebidas: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30",
  visita_realizada: "bg-teal-500/10 text-teal-600 border-teal-500/30",
  proposta_enviada: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  protocolo_assinado: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  descartada: "bg-red-500/10 text-red-600 border-red-500/30",
  proposta_recusada: "bg-rose-500/10 text-rose-600 border-rose-500/30",
  negocio_fechado: "bg-green-500/10 text-green-600 border-green-500/30",
  standby: "bg-purple-500/10 text-purple-600 border-purple-500/30",
};

const STORAGE_KEY = "gleba-table-columns";

export function GlebaTable({ onViewGleba }: GlebaTableProps) {
  const { glebas, isLoading } = useGlebas();
  const { cidades } = useCidades();

  // Colunas visíveis - persistidas no localStorage
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return AVAILABLE_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key);
      }
    }
    return AVAILABLE_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key);
  });

  // Persistir colunas no localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  // Buscar imobiliárias
  const { data: imobiliarias } = useQuery({
    queryKey: ["imobiliarias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imobiliarias")
        .select("id, nome")
        .order("nome", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cidadeFilter, setCidadeFilter] = useState<string>("all");
  const [imobiliariaFilter, setImobiliariaFilter] = useState<string>("all");

  // Aplicar filtros
  const filteredGlebas = useMemo(() => {
    return glebas.filter((gleba) => {
      const matchesSearch =
        gleba.apelido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gleba.proprietario_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gleba.comentarios?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || gleba.status === statusFilter;
      const matchesCidade = cidadeFilter === "all" || gleba.cidade_id === cidadeFilter;
      const matchesImobiliaria =
        imobiliariaFilter === "all" || gleba.imobiliaria_id === imobiliariaFilter;

      return matchesSearch && matchesStatus && matchesCidade && matchesImobiliaria;
    });
  }, [glebas, searchTerm, statusFilter, cidadeFilter, imobiliariaFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCidadeFilter("all");
    setImobiliariaFilter("all");
  };

  const hasActiveFilters =
    searchTerm ||
    statusFilter !== "all" ||
    cidadeFilter !== "all" ||
    imobiliariaFilter !== "all";

  const getCidadeName = (cidadeId: string | null) => {
    if (!cidadeId) return "-";
    return cidades?.find((c) => c.id === cidadeId)?.nome || "-";
  };

  const getImobiliariaName = (imobiliariaId: string | null) => {
    if (!imobiliariaId) return "-";
    return imobiliarias?.find((i) => i.id === imobiliariaId)?.nome || "-";
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatArea = (value: number | null) => {
    if (!value) return "-";
    return `${value.toLocaleString("pt-BR")} m²`;
  };

  const isColumnVisible = (key: string) => visibleColumns.includes(key);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Busca */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar gleba..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Cidade */}
        <Select value={cidadeFilter} onValueChange={setCidadeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Cidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Cidades</SelectItem>
            {cidades?.map((cidade) => (
              <SelectItem key={cidade.id} value={cidade.id}>
                {cidade.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Imobiliária */}
        <Select value={imobiliariaFilter} onValueChange={setImobiliariaFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Imobiliária" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Imobiliárias</SelectItem>
            {imobiliarias?.map((imobiliaria) => (
              <SelectItem key={imobiliaria.id} value={imobiliaria.id}>
                {imobiliaria.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Seletor de Colunas */}
        <ColumnSelector
          visibleColumns={visibleColumns}
          onColumnsChange={setVisibleColumns}
        />

        {/* Limpar filtros */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Contagem */}
      <div className="text-sm text-muted-foreground">
        {filteredGlebas.length} de {glebas.length} gleba{glebas.length !== 1 ? "s" : ""}
      </div>

      {/* Tabela */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {isColumnVisible("numero") && <TableHead className="w-[60px]">Nº</TableHead>}
              {isColumnVisible("prioridade") && <TableHead className="w-[50px]"></TableHead>}
              {isColumnVisible("apelido") && <TableHead>Apelido</TableHead>}
              {isColumnVisible("status") && <TableHead>Status</TableHead>}
              {isColumnVisible("cidade") && <TableHead>Cidade</TableHead>}
              {isColumnVisible("imobiliaria") && <TableHead>Imobiliária</TableHead>}
              {isColumnVisible("proprietario") && <TableHead>Proprietário</TableHead>}
              {isColumnVisible("area") && <TableHead className="text-right">Área</TableHead>}
              {isColumnVisible("preco") && <TableHead className="text-right">Preço</TableHead>}
              {isColumnVisible("zona_plano_diretor") && <TableHead>Zona PD</TableHead>}
              {isColumnVisible("lote_minimo") && (
                <TableHead className="text-right">Lote Mín.</TableHead>
              )}
              {isColumnVisible("permuta") && <TableHead>Permuta</TableHead>}
              {isColumnVisible("data_visita") && <TableHead>Visita</TableHead>}
              {isColumnVisible("created_at") && <TableHead>Criação</TableHead>}
              {isColumnVisible("updated_at") && <TableHead>Atualização</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGlebas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-32 text-center"
                >
                  <p className="text-muted-foreground">
                    {hasActiveFilters
                      ? "Nenhuma gleba encontrada com os filtros aplicados"
                      : "Nenhuma gleba cadastrada"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredGlebas.map((gleba) => (
                <TableRow
                  key={gleba.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onViewGleba(gleba)}
                >
                  {isColumnVisible("numero") && (
                    <TableCell className="font-mono text-sm font-bold text-muted-foreground">
                      #{gleba.numero}
                    </TableCell>
                  )}
                  {isColumnVisible("prioridade") && (
                    <TableCell>
                      {gleba.prioridade && (
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      )}
                    </TableCell>
                  )}
                  {isColumnVisible("apelido") && (
                    <TableCell className="font-medium">{gleba.apelido}</TableCell>
                  )}
                  {isColumnVisible("status") && (
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[gleba.status] || ""}
                      >
                        {STATUS_LABELS[gleba.status] || gleba.status}
                      </Badge>
                    </TableCell>
                  )}
                  {isColumnVisible("cidade") && (
                    <TableCell>{getCidadeName(gleba.cidade_id)}</TableCell>
                  )}
                  {isColumnVisible("imobiliaria") && (
                    <TableCell>{getImobiliariaName(gleba.imobiliaria_id)}</TableCell>
                  )}
                  {isColumnVisible("proprietario") && (
                    <TableCell>{gleba.proprietario_nome || "-"}</TableCell>
                  )}
                  {isColumnVisible("area") && (
                    <TableCell className="text-right">
                      {formatArea(gleba.tamanho_m2)}
                    </TableCell>
                  )}
                  {isColumnVisible("preco") && (
                    <TableCell className="text-right">
                      {formatCurrency(gleba.preco)}
                    </TableCell>
                  )}
                  {isColumnVisible("zona_plano_diretor") && (
                    <TableCell>{gleba.zona_plano_diretor || "-"}</TableCell>
                  )}
                  {isColumnVisible("lote_minimo") && (
                    <TableCell className="text-right">
                      {formatArea(gleba.tamanho_lote_minimo)}
                    </TableCell>
                  )}
                  {isColumnVisible("permuta") && (
                    <TableCell>
                      {gleba.aceita_permuta ? (
                        <div className="flex items-center gap-1">
                          <Check className="h-4 w-4 text-green-500" />
                          {gleba.percentual_permuta && `${gleba.percentual_permuta}%`}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  )}
                  {isColumnVisible("data_visita") && (
                    <TableCell>
                      {gleba.data_visita
                        ? format(new Date(gleba.data_visita), "dd/MM/yy", { locale: ptBR })
                        : "-"}
                    </TableCell>
                  )}
                  {isColumnVisible("created_at") && (
                    <TableCell>
                      {format(new Date(gleba.created_at), "dd/MM/yy", { locale: ptBR })}
                    </TableCell>
                  )}
                  {isColumnVisible("updated_at") && (
                    <TableCell>
                      {format(new Date(gleba.updated_at), "dd/MM/yy", { locale: ptBR })}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
