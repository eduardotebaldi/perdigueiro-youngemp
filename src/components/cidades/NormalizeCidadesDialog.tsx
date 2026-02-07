import { useState } from "react";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useCidades } from "@/hooks/useCidades";
import { useCidadesBrasil } from "@/hooks/useCidadesBrasil";
import { supabase } from "@/integrations/supabase/client";
import { buscarPopulacaoMunicipio } from "@/lib/ibgeApi";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface NormalizationResult {
  cidade: string;
  novoNome?: string;
  populacao?: number | null;
  success: boolean;
  message: string;
}

export function NormalizeCidadesDialog() {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<NormalizationResult[]>([]);
  const { cidades } = useCidades();
  const { data: cidadesIBGE } = useCidadesBrasil();
  const queryClient = useQueryClient();

  // Find cities that need normalization (don't have "/UF" pattern)
  const cidadesParaNormalizar = cidades?.filter(c => !c.nome.match(/\/[A-Z]{2}$/)) || [];

  const handleNormalize = async () => {
    if (!cidadesIBGE || cidadesIBGE.length === 0) {
      toast.error("Aguarde o carregamento dos dados do IBGE");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    const normResults: NormalizationResult[] = [];

    for (let i = 0; i < cidadesParaNormalizar.length; i++) {
      const cidade = cidadesParaNormalizar[i];
      const progressPercent = Math.round(((i + 1) / cidadesParaNormalizar.length) * 100);
      setProgress(progressPercent);

      try {
        // Normalize city name - remove " - UF" pattern and search
        const nomeNormalizado = cidade.nome
          .replace(/\s*-\s*[A-Z]{2}$/i, "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        // Find matching city in IBGE data
        const cidadeIBGE = cidadesIBGE.find(c => {
          const nomeIBGE = c.nome
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          return nomeIBGE === nomeNormalizado;
        });

        if (!cidadeIBGE) {
          // Try partial match
          const matches = cidadesIBGE.filter(c => {
            const nomeIBGE = c.nome
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            return nomeIBGE.includes(nomeNormalizado) || nomeNormalizado.includes(nomeIBGE);
          });

          if (matches.length === 0) {
            normResults.push({
              cidade: cidade.nome,
              success: false,
              message: "Cidade não encontrada no IBGE",
            });
            continue;
          }

          // If multiple matches, we can't auto-determine
          if (matches.length > 1) {
            normResults.push({
              cidade: cidade.nome,
              success: false,
              message: `Múltiplas correspondências: ${matches.slice(0, 3).map(m => m.nomeCompleto).join(", ")}`,
            });
            continue;
          }

          // Single match found
          const match = matches[0];
          let populacao: number | null = null;
          
          try {
            populacao = await buscarPopulacaoMunicipio(match.id);
          } catch (err) {
            console.warn("Erro ao buscar população:", err);
          }

          const { error } = await supabase
            .from("cidades")
            .update({
              nome: match.nomeCompleto,
              codigo_ibge: match.id,
              populacao: populacao,
            })
            .eq("id", cidade.id);

          if (error) throw error;

          normResults.push({
            cidade: cidade.nome,
            novoNome: match.nomeCompleto,
            populacao,
            success: true,
            message: "Atualizado com sucesso",
          });
          continue;
        }

        // Direct match found
        let populacao: number | null = null;
        try {
          populacao = await buscarPopulacaoMunicipio(cidadeIBGE.id);
        } catch (err) {
          console.warn("Erro ao buscar população:", err);
        }

        const { error } = await supabase
          .from("cidades")
          .update({
            nome: cidadeIBGE.nomeCompleto,
            codigo_ibge: cidadeIBGE.id,
            populacao: populacao,
          })
          .eq("id", cidade.id);

        if (error) throw error;

        normResults.push({
          cidade: cidade.nome,
          novoNome: cidadeIBGE.nomeCompleto,
          populacao,
          success: true,
          message: "Atualizado com sucesso",
        });
      } catch (error: any) {
        normResults.push({
          cidade: cidade.nome,
          success: false,
          message: error.message || "Erro desconhecido",
        });
      }

      setResults([...normResults]);
    }

    setIsProcessing(false);
    queryClient.invalidateQueries({ queryKey: ["cidades"] });

    const successCount = normResults.filter(r => r.success).length;
    toast.success(`Normalização concluída: ${successCount}/${cidadesParaNormalizar.length} cidades atualizadas`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={cidadesParaNormalizar.length === 0}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Normalizar ({cidadesParaNormalizar.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Normalizar Cidades</DialogTitle>
          <DialogDescription>
            {cidadesParaNormalizar.length} cidade(s) sem formato "Cidade/UF".
            Esta ação irá buscar os dados corretos do IBGE e atualizar a população.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Cities to normalize list */}
          {!isProcessing && results.length === 0 && (
            <ScrollArea className="max-h-48 border rounded-lg p-3">
              <div className="space-y-1 text-sm">
                {cidadesParaNormalizar.map((cidade) => (
                  <div key={cidade.id} className="text-muted-foreground">
                    • {cidade.nome}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Normalizando...
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <ScrollArea className="flex-1 min-h-[150px] border rounded-lg p-3">
              <div className="space-y-2">
                {results.map((result, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 text-sm py-1 ${
                      result.success ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <strong>{result.cidade}</strong>
                      {result.novoNome && (
                        <span className="text-muted-foreground"> → {result.novoNome}</span>
                      )}
                      {result.populacao && (
                        <span className="text-muted-foreground ml-1">
                          ({(result.populacao / 1000).toFixed(0)}K hab.)
                        </span>
                      )}
                      {!result.success && (
                        <span className="block text-xs">{result.message}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            {results.length > 0 && !isProcessing && (
              <Button variant="outline" onClick={() => { setResults([]); setOpen(false); }}>
                Fechar
              </Button>
            )}
            {results.length === 0 && (
              <Button onClick={handleNormalize} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Iniciar Normalização
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
