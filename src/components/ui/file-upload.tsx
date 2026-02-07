import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, FileText, Loader2 } from "lucide-react";

interface FileUploadProps {
  bucket: string;
  path?: string;
  accept?: string;
  currentFileUrl?: string | null;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  label?: string;
}

export function FileUpload({
  bucket,
  path = "",
  accept = "*",
  currentFileUrl,
  onUpload,
  onRemove,
  label = "Arquivo",
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onUpload(data.publicUrl);

      toast({
        title: "Sucesso!",
        description: "Arquivo enviado com sucesso",
      });
    } catch (error) {
      console.error("Erro no upload:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível enviar o arquivo",
      });
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const getFileName = (url: string) => {
    try {
      const urlParts = url.split("/");
      return urlParts[urlParts.length - 1];
    } catch {
      return "arquivo";
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      
      {currentFileUrl ? (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <FileText className="h-5 w-5 text-primary flex-shrink-0" />
          <a
            href={currentFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline truncate flex-1"
          >
            {getFileName(currentFileUrl)}
          </a>
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Clique para enviar
              </span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleUpload}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
}