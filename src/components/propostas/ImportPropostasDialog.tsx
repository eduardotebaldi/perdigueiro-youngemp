import { useState } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, X, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useGlebas } from "@/hooks/useGlebas";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ImportResult {
  numero?: number;
  gleba: string;
  success: boolean;
  message: string;
  isWarning?: boolean;
}

interface ParsedProposta {
  glebaApelido: string;
  glebaNumero?: number;
  dataProposta: string;
  tipo: "compra" | "parceria" | "mista";
  descricao?: string;
  arquivoLink?: string;
}

const COLUMN_MAPPINGS: Record<string, keyof ParsedProposta> = {
  // Gleba apelido variations
  "gleba": "glebaApelido",
  "apelido": "glebaApelido",
  "apelido da gleba": "glebaApelido",
  "apelido gleba": "glebaApelido",
  "nome da gleba": "glebaApelido",
  "nome gleba": "glebaApelido",
  "area": "glebaApelido",
  "área": "glebaApelido",
  "terreno": "glebaApelido",
  
  // Gleba número/código variations
  "numero": "glebaNumero",
  "número": "glebaNumero",
  "numero da gleba": "glebaNumero",
  "número da gleba": "glebaNumero",
  "codigo gleba": "glebaNumero",
  "código gleba": "glebaNumero",
  "cod gleba": "glebaNumero",
  "n°": "glebaNumero",
  "nº": "glebaNumero",
  "n": "glebaNumero",
  "#": "glebaNumero",
  "id": "glebaNumero",
  "cod": "glebaNumero",
  "código": "glebaNumero",
  "codigo": "glebaNumero",
  
  // Data variations
  "data": "dataProposta",
  "data proposta": "dataProposta",
  "data da proposta": "dataProposta",
  "dt": "dataProposta",
  "dt proposta": "dataProposta",
  "date": "dataProposta",
  
  // Tipo variations
  "tipo": "tipo",
  "tipo proposta": "tipo",
  "tipo da proposta": "tipo",
  "modalidade": "tipo",
  "type": "tipo",
  
  // Descrição variations
  "descricao": "descricao",
  "descrição": "descricao",
  "observacao": "descricao",
  "observação": "descricao",
  "obs": "descricao",
  "notas": "descricao",
  "comentario": "descricao",
  "comentário": "descricao",
  "detalhes": "descricao",
  "responsável": "descricao",
  "responsavel": "descricao",
  
  // Arquivo variations
  "arquivo": "arquivoLink",
  "link": "arquivoLink",
  "link arquivo": "arquivoLink",
  "carta": "arquivoLink",
  "carta proposta": "arquivoLink",
  "carta-proposta": "arquivoLink",
  "url": "arquivoLink",
  "anexo": "arquivoLink",
  "documento": "arquivoLink",
  "doc": "arquivoLink",
  "pdf": "arquivoLink",
  "file": "arquivoLink",
};

const TIPO_MAPPINGS: Record<string, "compra" | "parceria" | "mista"> = {
  "compra": "compra",
  "venda": "compra",
  "aquisição": "compra",
  "aquisicao": "compra",
  "parceria": "parceria",
  "permuta": "parceria",
  "mista": "mista",
  "híbrida": "mista",
  "hibrida": "mista",
};

function detectDelimiter(text: string): string {
  const firstLine = text.split("\n")[0];
  const delimiters = ["\t", ";", ","];
  
  for (const delimiter of delimiters) {
    if (firstLine.includes(delimiter)) {
      return delimiter;
    }
  }
  return "\t";
}

function parseSpreadsheetData(text: string): { propostas: ParsedProposta[]; detectedHeaders: string[]; unmappedHeaders: string[] } {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return { propostas: [], detectedHeaders: [], unmappedHeaders: [] };

  const delimiter = detectDelimiter(text);
  const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());
  const columnIndexes: Record<keyof ParsedProposta, number> = {} as any;
  
  const detectedHeaders: string[] = [];
  const unmappedHeaders: string[] = [];

  headers.forEach((header, index) => {
    const mappedKey = COLUMN_MAPPINGS[header];
    if (mappedKey) {
      columnIndexes[mappedKey] = index;
      detectedHeaders.push(header);
    } else if (header) {
      unmappedHeaders.push(header);
    }
  });

  // Check if at least one required column was found
  if (columnIndexes.glebaApelido === undefined && columnIndexes.glebaNumero === undefined) {
    return { propostas: [], detectedHeaders, unmappedHeaders };
  }

  const propostas: ParsedProposta[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map((v) => v.trim());
    if (values.every((v) => !v)) continue;

    const glebaApelido = columnIndexes.glebaApelido !== undefined
      ? values[columnIndexes.glebaApelido] || ""
      : "";

    const glebaNumeroStr = columnIndexes.glebaNumero !== undefined
      ? values[columnIndexes.glebaNumero] || ""
      : "";

    const dataProposta = columnIndexes.dataProposta !== undefined
      ? values[columnIndexes.dataProposta] || ""
      : "";

    const tipoRaw = columnIndexes.tipo !== undefined
      ? values[columnIndexes.tipo]?.toLowerCase() || ""
      : "";

    const tipo = TIPO_MAPPINGS[tipoRaw] || "compra";

    const descricao = columnIndexes.descricao !== undefined
      ? values[columnIndexes.descricao] || undefined
      : undefined;

    const arquivoLink = columnIndexes.arquivoLink !== undefined
      ? values[columnIndexes.arquivoLink] || undefined
      : undefined;

    if (glebaApelido || glebaNumeroStr) {
      propostas.push({
        glebaApelido,
        glebaNumero: glebaNumeroStr ? parseInt(glebaNumeroStr, 10) : undefined,
        dataProposta,
        tipo,
        descricao,
        arquivoLink,
      });
    }
  }

  return { propostas, detectedHeaders, unmappedHeaders };
}

function parseDate(dateStr: string): string {
  // Try DD/MM/YYYY
  const brMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Try YYYY-MM-DD
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return dateStr;
  }

  // Default to today
  return new Date().toISOString().split("T")[0];
}

export function ImportPropostasDialog() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [pastedData, setPastedData] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const { glebas, refetch: refetchGlebas } = useGlebas();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleImport = async () => {
    if (!pastedData.trim() || !user) {
      toast.error("Cole os dados da planilha primeiro");
      return;
    }

    const parseResult = parseSpreadsheetData(pastedData);
    
    if (parseResult.propostas.length === 0) {
      const headerInfo = parseResult.unmappedHeaders.length > 0 
        ? `Cabeçalhos não reconhecidos: ${parseResult.unmappedHeaders.join(", ")}` 
        : "Nenhum cabeçalho reconhecido.";
      toast.error(`Nenhum dado válido encontrado. ${headerInfo} Use 'Gleba', 'Número', 'Data', 'Tipo' ou 'Link'.`);
      return;
    }

    const parsedPropostas = parseResult.propostas;
    
    setIsProcessing(true);
    setResults([]);
    setProgress(0);

    const importResults: ImportResult[] = [];

    for (let i = 0; i < parsedPropostas.length; i++) {
      const proposta = parsedPropostas[i];
      const progressPercent = Math.round(((i + 1) / parsedPropostas.length) * 100);
      setProgress(progressPercent);

      try {
        // Find gleba by number or apelido
        let gleba = glebas.find((g) => {
          if (proposta.glebaNumero && g.numero === proposta.glebaNumero) return true;
          if (proposta.glebaApelido && g.apelido.toLowerCase() === proposta.glebaApelido.toLowerCase()) return true;
          return false;
        });

        if (!gleba) {
          importResults.push({
            numero: proposta.glebaNumero,
            gleba: proposta.glebaApelido || `#${proposta.glebaNumero}`,
            success: false,
            message: "Gleba não encontrada",
          });
          continue;
        }

        // Download file if link provided
        let arquivoCarta: string | null = null;
        if (proposta.arquivoLink) {
          try {
            const response = await supabase.functions.invoke("download-proposta-file", {
              body: { url: proposta.arquivoLink },
            });

            if (response.error) {
              importResults.push({
                numero: gleba.numero || undefined,
                gleba: gleba.apelido,
                success: false,
                message: `Erro ao baixar arquivo: ${response.error.message}`,
                isWarning: true,
              });
            } else if (response.data?.filePath) {
              arquivoCarta = response.data.filePath;
            }
          } catch (err) {
            importResults.push({
              numero: gleba.numero || undefined,
              gleba: gleba.apelido,
              success: false,
              message: `Erro ao baixar arquivo: link inválido ou inacessível`,
              isWarning: true,
            });
          }
        }

        // Create proposta
        const { error } = await supabase.from("propostas").insert({
          gleba_id: gleba.id,
          data_proposta: parseDate(proposta.dataProposta),
          tipo: proposta.tipo,
          descricao: proposta.descricao || null,
          arquivo_carta: arquivoCarta,
          created_by: user.id,
        });

        if (error) throw error;

        importResults.push({
          numero: gleba.numero || undefined,
          gleba: gleba.apelido,
          success: true,
          message: arquivoCarta ? "Importada com arquivo" : "Importada sem arquivo",
        });
      } catch (error: any) {
        importResults.push({
          numero: proposta.glebaNumero,
          gleba: proposta.glebaApelido || `#${proposta.glebaNumero}`,
          success: false,
          message: error.message || "Erro desconhecido",
        });
      }

      setResults([...importResults]);
    }

    setIsProcessing(false);
    queryClient.invalidateQueries({ queryKey: ["propostas"] });

    const successCount = importResults.filter((r) => r.success).length;
    const warningCount = importResults.filter((r) => r.isWarning).length;
    toast.success(`Importação concluída: ${successCount} propostas importadas${warningCount > 0 ? `, ${warningCount} avisos` : ""}`);
  };

  const handleReset = () => {
    setPastedData("");
    setResults([]);
    setProgress(0);
  };

  // Minimized floating bar
  if (minimized && isProcessing) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-3 w-80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Importando propostas...</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setMinimized(false)}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">{progress}% concluído</p>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-row items-center justify-between">
          <div>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Importar Propostas
            </DialogTitle>
            <DialogDescription>
              Cole dados de uma planilha para importar propostas em lote
            </DialogDescription>
          </div>
          {isProcessing && (
            <Button variant="ghost" size="icon" onClick={() => setMinimized(true)}>
              <Minimize2 className="h-4 w-4" />
            </Button>
          )}
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Instructions */}
          <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-2">
            <p className="font-medium">Colunas esperadas:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>Gleba / Número</strong> - Apelido ou número da gleba</li>
              <li><strong>Data</strong> - Data da proposta (DD/MM/AAAA)</li>
              <li><strong>Tipo</strong> - compra, parceria ou mista</li>
              <li><strong>Descrição</strong> - Descrição opcional</li>
              <li><strong>Arquivo/Link</strong> - Link para arquivo (PDF, PPT, etc.)</li>
            </ul>
          </div>

          {/* Paste Area */}
          <Textarea
            placeholder="Cole os dados copiados da planilha aqui (com cabeçalhos)..."
            value={pastedData}
            onChange={(e) => setPastedData(e.target.value)}
            className="min-h-[120px] font-mono text-sm"
            disabled={isProcessing}
          />

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importando...
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <ScrollArea className="flex-1 min-h-[150px] max-h-[200px] border rounded-lg p-3">
              <div className="space-y-1">
                {results.map((result, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 text-sm py-1 ${
                      result.success
                        ? "text-green-600"
                        : result.isWarning
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    )}
                    <span>
                      <strong>#{result.numero || "?"}</strong> {result.gleba}: {result.message}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            {results.length > 0 && !isProcessing && (
              <Button variant="outline" onClick={handleReset}>
                Limpar
              </Button>
            )}
            <Button onClick={handleImport} disabled={isProcessing || !pastedData.trim()}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
