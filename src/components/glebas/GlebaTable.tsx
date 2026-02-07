import { useState, useMemo } from "react";
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
import { Pencil, Search, X, Star } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Gleba = Tables<"glebas">;

interface GlebaTableProps {
  onEditGleba: (gleba: Gleba) => void;
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

export function GlebaTable({ onEditGleba }: GlebaTableProps) {
  const { glebas, isLoading } = useGlebas();
  const { cidades } = useCidades();
  
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
      // Filtro de busca por texto
      const matchesSearch = 
        gleba.apelido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gleba.proprietario_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gleba.comentarios?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de status
      const matchesStatus = statusFilter === "all" || gleba.status === statusFilter;

      // Filtro de cidade
      const matchesCidade = cidadeFilter === "all" || gleba.cidade_id === cidadeFilter;

      // Filtro de imobiliária
      const matchesImobiliaria = imobiliariaFilter === "all" || gleba.imobiliaria_id === imobiliariaFilter;

      return matchesSearch && matchesStatus && matchesCidade && matchesImobiliaria;
    });
  }, [glebas, searchTerm, statusFilter, cidadeFilter, imobiliariaFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCidadeFilter("all");
    setImobiliariaFilter("all");
  };

  const hasActiveFilters = searchTerm || statusFilter !== "all" || cidadeFilter !== "all" || imobiliariaFilter !== "all";

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
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Apelido</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Imobiliária</TableHead>
              <TableHead>Proprietário</TableHead>
              <TableHead className="text-right">Área</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead>Atualização</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGlebas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center">
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
                  onClick={() => onEditGleba(gleba)}
                >
                  <TableCell>
                    {gleba.prioridade && (
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{gleba.apelido}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={STATUS_COLORS[gleba.status] || ""}
                    >
                      {STATUS_LABELS[gleba.status] || gleba.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{getCidadeName(gleba.cidade_id)}</TableCell>
                  <TableCell>{getImobiliariaName(gleba.imobiliaria_id)}</TableCell>
                  <TableCell>{gleba.proprietario_nome || "-"}</TableCell>
                  <TableCell className="text-right">{formatArea(gleba.tamanho_m2)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(gleba.preco)}</TableCell>
                  <TableCell>
                    {format(new Date(gleba.updated_at), "dd/MM/yy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditGleba(gleba);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
