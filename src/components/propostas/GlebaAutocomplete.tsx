import { useState, useMemo, useRef, useEffect, forwardRef } from "react";
import { Search, MapPin, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGlebas } from "@/hooks/useGlebas";
import { useCidades } from "@/hooks/useCidades";

interface GlebaAutocompleteProps {
  value: string;
  onSelect: (glebaId: string) => void;
}

export const GlebaAutocomplete = forwardRef<HTMLDivElement, GlebaAutocompleteProps>(
  function GlebaAutocomplete({ value, onSelect }, ref) {
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { glebas } = useGlebas();
    const { cidades } = useCidades();

    // Create cidade lookup map
    const cidadeMap = useMemo(() => {
      const map: Record<string, string> = {};
      cidades.forEach(c => {
        map[c.id] = c.nome;
      });
      return map;
    }, [cidades]);

    // Get selected gleba for display
    const selectedGleba = useMemo(() => {
      return glebas.find(g => g.id === value);
    }, [glebas, value]);

    // Filter glebas based on search
    const filteredGlebas = useMemo(() => {
      if (!search.trim()) return glebas.slice(0, 20);
      
      const searchLower = search.toLowerCase();
      return glebas.filter(g => {
        const matchesApelido = g.apelido.toLowerCase().includes(searchLower);
        const matchesNumero = g.numero?.toString().includes(search);
        const cidadeNome = g.cidade_id ? cidadeMap[g.cidade_id] : "";
        const matchesCidade = cidadeNome.toLowerCase().includes(searchLower);
        return matchesApelido || matchesNumero || matchesCidade;
      }).slice(0, 20);
    }, [glebas, search, cidadeMap]);

    // Close dropdown when clicking outside
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (glebaId: string) => {
      onSelect(glebaId);
      setSearch("");
      setIsOpen(false);
    };

    return (
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={selectedGleba 
              ? `#${selectedGleba.numero || "?"} - ${selectedGleba.apelido}` 
              : "Buscar gleba por número, apelido ou cidade..."
            }
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-9"
          />
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
            <ScrollArea className="max-h-60">
              {filteredGlebas.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  Nenhuma gleba encontrada
                </div>
              ) : (
                <div className="py-1">
                  {filteredGlebas.map((gleba) => (
                    <button
                      key={gleba.id}
                      type="button"
                      onClick={() => handleSelect(gleba.id)}
                      className={`w-full px-3 py-2 text-left hover:bg-muted transition-colors flex items-start gap-3 ${
                        value === gleba.id ? "bg-muted" : ""
                      }`}
                    >
                      <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {gleba.numero && (
                            <span className="text-xs font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              #{gleba.numero}
                            </span>
                          )}
                          <span className="font-medium truncate">{gleba.apelido}</span>
                        </div>
                        {gleba.cidade_id && cidadeMap[gleba.cidade_id] && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Building2 className="h-3 w-3" />
                            <span>{cidadeMap[gleba.cidade_id]}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Show selected gleba indicator */}
        {selectedGleba && !isOpen && (
          <p className="text-xs text-muted-foreground mt-1">
            Selecionado: #{selectedGleba.numero || "?"} - {selectedGleba.apelido}
            {selectedGleba.cidade_id && cidadeMap[selectedGleba.cidade_id] && ` (${cidadeMap[selectedGleba.cidade_id]})`}
          </p>
        )}
      </div>
    );
  }
);
