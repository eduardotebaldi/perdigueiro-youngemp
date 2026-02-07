import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useGlebas, STATUS_LABELS } from "@/hooks/useGlebas";
import { useCidades } from "@/hooks/useCidades";
import { useImobiliarias } from "@/hooks/useImobiliarias";

interface ParsedRow {
  numero?: string;
  apelido: string;
  kmzLink?: string;
  percentualPedida?: number;
  tamanho?: number;
  proprietario?: string;
  contatoProprietario?: string;
  observacoes?: string;
  imobiliaria?: string;
  status?: string;
  cidade?: string;
  dataPreco?: string;
  aceitaParceria?: boolean;
}

interface ImportResult {
  apelido: string;
  success: boolean;
  message: string;
}

const STATUS_MAP: Record<string, string> = {
  "identificada": "identificada",
  "identificado": "identificada",
  "info recebidas": "informacoes_recebidas",
  "informações recebidas": "informacoes_recebidas",
  "visita realizada": "visita_realizada",
  "visitada": "visita_realizada",
  "proposta enviada": "proposta_enviada",
  "proposta": "proposta_enviada",
  "protocolo assinado": "protocolo_assinado",
  "protocolo": "protocolo_assinado",
  "descartada": "descartada",
  "descartado": "descartada",
  "recusada": "proposta_recusada",
  "proposta recusada": "proposta_recusada",
  "fechado": "negocio_fechado",
  "negócio fechado": "negocio_fechado",
  "negocio fechado": "negocio_fechado",
  "standby": "standby",
  "aguardando": "standby",
};

export function ImportGlebasDialog() {
  const [open, setOpen] = useState(false);
  const [pastedData, setPastedData] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [step, setStep] = useState<"paste" | "preview" | "importing" | "done">("paste");

  const { refetch } = useGlebas();
  const { cidades } = useCidades();
  const { imobiliarias } = useImobiliarias();

  const parseData = () => {
    if (!pastedData.trim()) {
      toast.error("Cole os dados da planilha primeiro");
      return;
    }

    const lines = pastedData.trim().split("\n");
    if (lines.length < 2) {
      toast.error("A planilha precisa ter pelo menos um cabeçalho e uma linha de dados");
      return;
    }

    // Parse header (first line)
    const headers = lines[0].split("\t").map((h) => h.toLowerCase().trim());
    
    // Find column indexes
    const findCol = (patterns: string[]) => 
      headers.findIndex((h) => patterns.some((p) => h.includes(p)));

    const colIndexes = {
      numero: findCol(["numero", "nº", "n°", "#"]),
      apelido: findCol(["apelido", "nome", "gleba"]),
      kmzLink: findCol(["link"]),
      percentual: findCol(["% pedida", "percentual", "pedida"]),
      tamanho: findCol(["tamanho", "área", "area", "m²", "m2", "hectare"]),
      proprietario: findCol(["proprietário", "proprietario", "dono"]),
      contato: findCol(["contato", "telefone", "celular"]),
      observacoes: findCol(["observ", "comentário", "comentario", "nota"]),
      imobiliaria: findCol(["imobiliária", "imobiliaria", "corretor"]),
      status: findCol(["status", "situação", "situacao", "fase"]),
      cidade: findCol(["cidade", "município", "municipio", "local"]),
      dataPreco: findCol(["data", "preço", "preco"]),
      parceria: findCol(["parceria", "permuta", "troca"]),
    };

    if (colIndexes.apelido === -1) {
      toast.error("Coluna 'Apelido' ou 'Nome' não encontrada no cabeçalho");
      return;
    }

    // Parse data rows
    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split("\t");
      const apelido = cols[colIndexes.apelido]?.trim();
      
      if (!apelido) continue;

      const parseNumber = (val: string | undefined) => {
        if (!val) return undefined;
        const cleaned = val.replace(/[^\d.,]/g, "").replace(",", ".");
        return parseFloat(cleaned) || undefined;
      };

      const parseBool = (val: string | undefined) => {
        if (!val) return undefined;
        const lower = val.toLowerCase().trim();
        return ["sim", "yes", "s", "1", "true", "x"].includes(lower);
      };

      rows.push({
        numero: colIndexes.numero >= 0 ? cols[colIndexes.numero]?.trim() : undefined,
        apelido,
        kmzLink: colIndexes.kmzLink >= 0 ? cols[colIndexes.kmzLink]?.trim() : undefined,
        percentualPedida: colIndexes.percentual >= 0 ? parseNumber(cols[colIndexes.percentual]) : undefined,
        tamanho: colIndexes.tamanho >= 0 ? parseNumber(cols[colIndexes.tamanho]) : undefined,
        proprietario: colIndexes.proprietario >= 0 ? cols[colIndexes.proprietario]?.trim() : undefined,
        contatoProprietario: colIndexes.contato >= 0 ? cols[colIndexes.contato]?.trim() : undefined,
        observacoes: colIndexes.observacoes >= 0 ? cols[colIndexes.observacoes]?.trim() : undefined,
        imobiliaria: colIndexes.imobiliaria >= 0 ? cols[colIndexes.imobiliaria]?.trim() : undefined,
        status: colIndexes.status >= 0 ? cols[colIndexes.status]?.trim() : undefined,
        cidade: colIndexes.cidade >= 0 ? cols[colIndexes.cidade]?.trim() : undefined,
        dataPreco: colIndexes.dataPreco >= 0 ? cols[colIndexes.dataPreco]?.trim() : undefined,
        aceitaParceria: colIndexes.parceria >= 0 ? parseBool(cols[colIndexes.parceria]) : undefined,
      });
    }

    if (rows.length === 0) {
      toast.error("Nenhuma linha válida encontrada");
      return;
    }

    setParsedRows(rows);
    setStep("preview");
    toast.success(`${rows.length} linhas encontradas`);
  };

  const mapStatus = (statusText?: string): string => {
    if (!statusText) return "identificada";
    const lower = statusText.toLowerCase().trim();
    return STATUS_MAP[lower] || "identificada";
  };

  const findCidadeId = (cidadeNome?: string): string | null => {
    if (!cidadeNome || !cidades) return null;
    const lower = cidadeNome.toLowerCase().trim();
    const found = cidades.find((c) => c.nome.toLowerCase().includes(lower));
    return found?.id || null;
  };

  const findImobiliariaId = (imobiliariaNome?: string): string | null => {
    if (!imobiliariaNome || !imobiliarias) return null;
    const lower = imobiliariaNome.toLowerCase().trim();
    const found = imobiliarias.find((i) => i.nome.toLowerCase().includes(lower));
    return found?.id || null;
  };

  const startImport = async () => {
    setIsImporting(true);
    setStep("importing");
    setProgress(0);
    setResults([]);

    const importResults: ImportResult[] = [];

    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      
      try {
        let kmzStoragePath: string | null = null;
        let geojson: any = null;

        // Process KMZ if link provided
        if (row.kmzLink && row.kmzLink.trim()) {
          try {
            console.log(`Processing KMZ for ${row.apelido}: ${row.kmzLink}`);
            const { data, error } = await supabase.functions.invoke("process-kmz", {
              body: { kmzUrl: row.kmzLink.trim(), glebaApelido: row.apelido },
            });

            if (error) {
              console.error(`KMZ error response: ${JSON.stringify(error)}`);
              throw error;
            }
            
            if (data && data.success) {
              console.log(`KMZ processed successfully for ${row.apelido}`);
              kmzStoragePath = data.kmzStoragePath;
              geojson = data.geojson;
            } else {
              console.warn(`KMZ processing returned false success for ${row.apelido}`);
            }
          } catch (kmzError: any) {
            console.warn(`KMZ processing failed for ${row.apelido}:`, kmzError.message || kmzError);
            // Continue without KMZ data
          }
        }

        // Create gleba record
        const { error: insertError } = await supabase.from("glebas").insert({
          apelido: row.apelido,
          status: mapStatus(row.status) as any,
          cidade_id: findCidadeId(row.cidade),
          imobiliaria_id: findImobiliariaId(row.imobiliaria),
          proprietario_nome: row.proprietario || null,
          tamanho_m2: row.tamanho || null,
          percentual_permuta: row.percentualPedida || null,
          aceita_permuta: row.aceitaParceria ?? null,
          comentarios: row.observacoes || null,
          arquivo_kmz: kmzStoragePath,
          poligono_geojson: geojson,
        });

        if (insertError) throw insertError;

        importResults.push({
          apelido: row.apelido,
          success: true,
          message: geojson ? "Importado com polígono" : "Importado sem polígono",
        });
      } catch (error: any) {
        importResults.push({
          apelido: row.apelido,
          success: false,
          message: error.message || "Erro desconhecido",
        });
      }

      setProgress(Math.round(((i + 1) / parsedRows.length) * 100));
      setResults([...importResults]);
    }

    setIsImporting(false);
    setStep("done");
    await refetch();

    const successCount = importResults.filter((r) => r.success).length;
    toast.success(`Importação concluída: ${successCount}/${parsedRows.length} glebas`);
  };

  const reset = () => {
    setPastedData("");
    setParsedRows([]);
    setResults([]);
    setProgress(0);
    setStep("paste");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen && !isImporting) {
      reset();
    }
    if (!isImporting) {
      setOpen(isOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar Planilha
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Glebas do Google Sheets
          </DialogTitle>
          <DialogDescription>
            Copie e cole os dados da sua planilha (incluindo o cabeçalho) diretamente abaixo.
          </DialogDescription>
        </DialogHeader>

        {step === "paste" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Dados da Planilha (Ctrl+C do Google Sheets)</Label>
              <Textarea
                placeholder="Cole aqui os dados copiados da planilha (com cabeçalho)..."
                className="min-h-[200px] font-mono text-xs"
                value={pastedData}
                onChange={(e) => setPastedData(e.target.value)}
              />
            </div>
            
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <h4 className="font-medium text-sm">Colunas reconhecidas:</h4>
              <p className="text-xs text-muted-foreground">
                Apelido/Nome, Link KMZ/Matrícula, % Pedida, Tamanho, Proprietário, 
                Observações, Imobiliária, Status, Cidade, Aceita Parceria
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={parseData}>
                Analisar Dados
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{parsedRows.length} glebas</Badge>
              <span className="text-sm text-muted-foreground">prontas para importar</span>
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-4 space-y-2">
                {parsedRows.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded bg-muted/30">
                    <span className="font-mono text-xs text-muted-foreground w-8">
                      {idx + 1}
                    </span>
                    <span className="font-medium flex-1 truncate">{row.apelido}</span>
                    <Badge variant="outline" className="text-xs">
                      {STATUS_LABELS[mapStatus(row.status)] || row.status || "Identificada"}
                    </Badge>
                    {row.kmzLink && (
                      <Badge variant="secondary" className="text-xs">KMZ</Badge>
                    )}
                    {row.cidade && (
                      <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                        {row.cidade}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep("paste")}>
                Voltar
              </Button>
              <Button onClick={startImport}>
                Iniciar Importação
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="space-y-4 py-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Importando glebas... {results.length}/{parsedRows.length}
              </p>
            </div>
            <Progress value={progress} className="w-full" />
            
            <ScrollArea className="h-[200px] border rounded-lg">
              <div className="p-4 space-y-1">
                {results.map((result, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    {result.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="font-medium">{result.apelido}</span>
                    <span className="text-muted-foreground">{result.message}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <div className="text-center">
                <h3 className="font-semibold text-lg">Importação Concluída!</h3>
                <p className="text-sm text-muted-foreground">
                  {results.filter((r) => r.success).length} de {results.length} glebas importadas
                </p>
              </div>
            </div>

            <ScrollArea className="h-[200px] border rounded-lg">
              <div className="p-4 space-y-1">
                {results.map((result, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    {result.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="font-medium">{result.apelido}</span>
                    <span className="text-muted-foreground">{result.message}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-end">
              <Button onClick={() => { reset(); setOpen(false); }}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
