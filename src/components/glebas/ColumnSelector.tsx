import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Columns3 } from "lucide-react";

export interface ColumnConfig {
  key: string;
  label: string;
  defaultVisible: boolean;
}

export const AVAILABLE_COLUMNS: ColumnConfig[] = [
  { key: "numero", label: "Número", defaultVisible: true },
  { key: "prioridade", label: "Prioridade", defaultVisible: true },
  { key: "apelido", label: "Apelido", defaultVisible: true },
  { key: "status", label: "Status", defaultVisible: true },
  { key: "cidade", label: "Cidade", defaultVisible: true },
  { key: "imobiliaria", label: "Imobiliária", defaultVisible: true },
  { key: "proprietario", label: "Proprietário", defaultVisible: true },
  { key: "area", label: "Área", defaultVisible: true },
  { key: "preco", label: "Preço", defaultVisible: true },
  { key: "updated_at", label: "Atualização", defaultVisible: true },
  { key: "zona_plano_diretor", label: "Zona Plano Diretor", defaultVisible: false },
  { key: "lote_minimo", label: "Lote Mínimo", defaultVisible: false },
  { key: "permuta", label: "Permuta", defaultVisible: false },
  { key: "data_visita", label: "Data Visita", defaultVisible: false },
  { key: "created_at", label: "Data Criação", defaultVisible: false },
];

interface ColumnSelectorProps {
  visibleColumns: string[];
  onColumnsChange: (columns: string[]) => void;
}

export function ColumnSelector({ visibleColumns, onColumnsChange }: ColumnSelectorProps) {
  const toggleColumn = (columnKey: string) => {
    if (visibleColumns.includes(columnKey)) {
      onColumnsChange(visibleColumns.filter((k) => k !== columnKey));
    } else {
      onColumnsChange([...visibleColumns, columnKey]);
    }
  };

  const selectAll = () => {
    onColumnsChange(AVAILABLE_COLUMNS.map((c) => c.key));
  };

  const selectDefault = () => {
    onColumnsChange(
      AVAILABLE_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key)
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Columns3 className="h-4 w-4" />
          Colunas
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background z-50">
        <DropdownMenuLabel>Colunas Visíveis</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex gap-2 px-2 py-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 flex-1"
            onClick={selectAll}
          >
            Todas
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 flex-1"
            onClick={selectDefault}
          >
            Padrão
          </Button>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {AVAILABLE_COLUMNS.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.key}
              checked={visibleColumns.includes(column.key)}
              onCheckedChange={() => toggleColumn(column.key)}
            >
              {column.label}
            </DropdownMenuCheckboxItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
