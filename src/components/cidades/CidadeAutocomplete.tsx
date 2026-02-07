import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, MapPin, Check } from "lucide-react";
import { useCidadesBrasil, filterCidades, CidadeBrasil } from "@/hooks/useCidadesBrasil";

interface CidadeAutocompleteProps {
  value: string;
  onChange: (cidade: CidadeBrasil | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CidadeAutocomplete({
  value,
  onChange,
  placeholder = "Digite o nome da cidade...",
  disabled = false,
}: CidadeAutocompleteProps) {
  const { data: cidades, isLoading: isLoadingCidades } = useCidadesBrasil();
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = cidades ? filterCidades(cidades, inputValue, 8) : [];

  // Atualizar input quando value externo muda
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(newValue.length >= 2);
    setHighlightedIndex(0);
    
    // Se limpar o campo, notificar o parent
    if (!newValue) {
      onChange(null);
    }
  };

  const handleSelect = (cidade: CidadeBrasil) => {
    setInputValue(cidade.nomeCompleto);
    onChange(cidade);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled || isLoadingCidades}
          className="pl-10"
        />
        {isLoadingCidades && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown de sugestões */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-[240px] overflow-auto">
          {suggestions.map((cidade, index) => (
            <button
              key={cidade.id}
              type="button"
              onClick={() => handleSelect(cidade)}
              className={cn(
                "w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors",
                index === highlightedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted"
              )}
            >
              <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="flex-1">
                <span className="font-medium">{cidade.nome}</span>
                <span className="text-muted-foreground"> - {cidade.uf}</span>
              </span>
              {inputValue === cidade.nomeCompleto && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Mensagem de "nenhum resultado" */}
      {isOpen && inputValue.length >= 2 && suggestions.length === 0 && !isLoadingCidades && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg p-3 text-sm text-muted-foreground">
          Nenhuma cidade encontrada para "{inputValue}"
        </div>
      )}

      {/* Dica de digitação */}
      {isOpen && inputValue.length < 2 && inputValue.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg p-3 text-sm text-muted-foreground">
          Digite pelo menos 2 caracteres...
        </div>
      )}
    </div>
  );
}
