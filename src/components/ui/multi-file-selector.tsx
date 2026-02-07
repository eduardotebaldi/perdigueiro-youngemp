import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface MultiFileSelectorProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  disabled?: boolean;
}

export function MultiFileSelector({
  onFilesSelected,
  accept = "*",
  multiple = true,
  maxFiles = 10,
  maxSizeMB = 50,
  disabled = false,
}: MultiFileSelectorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
      const file = files[i];
      if (file.size <= maxSizeBytes) {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="w-full border-dashed"
      >
        <Upload className="mr-2 h-4 w-4" />
        Selecionar Arquivo{multiple ? "s" : ""}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Máximo {maxSizeMB}MB por arquivo
      </p>
    </div>
  );
}
