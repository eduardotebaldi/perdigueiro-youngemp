import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Search, MapPin, Trash2, ChevronRight, CalendarDays, DollarSign, Ruler, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePesquisasMercado, usePesquisaTerrenos, PesquisaMercado } from "@/hooks/usePesquisasMercado";
import { useCidades } from "@/hooks/useCidades";
import { toast } from "sonner";

export default function PesquisasMercado() {
  const { pesquisas, isLoading, createPesquisa, deletePesquisa } = usePesquisasMercado();
  const { cidades } = useCidades();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPesquisa, setSelectedPesquisa] = useState<PesquisaMercado | null>(null);
  const [search, setSearch] = useState("");

  // Create form
  const [nome, setNome] = useState("");
  const [cidadeId, setCidadeId] = useState<string>("none");
  const [dataPesquisa, setDataPesquisa] = useState(format(new Date(), "yyyy-MM-dd"));
  const [observacoes, setObservacoes] = useState("");

  const handleCreate = async () => {
    if (!nome.trim()) { toast.error("Informe o nome"); return; }
    try {
      await createPesquisa.mutateAsync({
        nome: nome.trim(),
        cidade_id: cidadeId === "none" ? null : cidadeId,
        data_pesquisa: dataPesquisa,
        observacoes: observacoes || undefined,
      });
      toast.success("Pesquisa criada!");
      setCreateOpen(false);
      setNome(""); setCidadeId("none"); setObservacoes("");
    } catch {
      toast.error("Erro ao criar pesquisa");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePesquisa.mutateAsync(id);
      if (selectedPesquisa?.id === id) setSelectedPesquisa(null);
      toast.success("Pesquisa removida!");
    } catch {
      toast.error("Erro ao remover pesquisa");
    }
  };

  const filtered = pesquisas.filter((p) =>
    !search || p.nome.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedPesquisa) {
    return <PesquisaDetail pesquisa={selectedPesquisa} onBack={() => setSelectedPesquisa(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pesquisas de Mercado</h1>
          <p className="text-muted-foreground">Mapeie terrenos concorrentes à venda para análise de viabilidade</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nova Pesquisa</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Pesquisa de Mercado</DialogTitle>
              <DialogDescription>Defina os dados da pesquisa. Depois você poderá adicionar terrenos.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome *</label>
                <Input placeholder="ex: Pesquisa-AlegreteRS-250326" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cidade</label>
                <Select value={cidadeId} onValueChange={setCidadeId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {cidades?.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data</label>
                <Input type="date" value={dataPesquisa} onChange={(e) => setDataPesquisa(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Observações</label>
                <Textarea placeholder="Observações..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={createPesquisa.isPending}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar pesquisas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="mx-auto h-12 w-12 mb-4 opacity-30" />
          <p>Nenhuma pesquisa encontrada</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pesquisa) => (
            <Card key={pesquisa.id} className="group cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedPesquisa(pesquisa)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{pesquisa.nome}</CardTitle>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardDescription className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {format(new Date(pesquisa.data_pesquisa + "T00:00:00"), "dd/MM/yyyy")}
                  </span>
                  {pesquisa.cidade && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {pesquisa.cidade.nome}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  {pesquisa.observacoes && <p className="text-xs text-muted-foreground truncate flex-1">{pesquisa.observacoes}</p>}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir pesquisa?</AlertDialogTitle>
                        <AlertDialogDescription>Todos os terrenos associados serão removidos.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(pesquisa.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PesquisaDetail({ pesquisa, onBack }: { pesquisa: PesquisaMercado; onBack: () => void }) {
  const { terrenos, isLoading, createTerreno, deleteTerreno } = usePesquisaTerrenos(pesquisa.id);
  const [addOpen, setAddOpen] = useState(false);

  // Terreno form
  const [tNome, setTNome] = useState("");
  const [tPreco, setTPreco] = useState("");
  const [tTamanho, setTTamanho] = useState("");
  const [tCondicoes, setTCondicoes] = useState("");
  const [tTipo, setTTipo] = useState("");
  const [tObs, setTObs] = useState("");
  const [tUrl, setTUrl] = useState("");

  const handleAdd = async () => {
    if (!tNome.trim()) { toast.error("Informe o nome"); return; }
    try {
      await createTerreno.mutateAsync({
        pesquisa_id: pesquisa.id,
        nome: tNome.trim(),
        preco: tPreco ? parseFloat(tPreco) : null,
        tamanho_m2: tTamanho ? parseFloat(tTamanho) : null,
        condicoes_pagamento: tCondicoes || null,
        tipo_terreno: tTipo || null,
        observacoes: tObs || null,
        url_anuncio: tUrl || null,
      });
      toast.success("Terreno adicionado!");
      setAddOpen(false);
      setTNome(""); setTPreco(""); setTTamanho(""); setTCondicoes(""); setTTipo(""); setTObs(""); setTUrl("");
    } catch {
      toast.error("Erro ao adicionar terreno");
    }
  };

  const precoM2 = (preco: number | null, tamanho: number | null) => {
    if (!preco || !tamanho || tamanho === 0) return null;
    return (preco / tamanho).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>← Voltar</Button>
        <div>
          <h1 className="text-2xl font-bold">{pesquisa.nome}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-3">
            <span>{format(new Date(pesquisa.data_pesquisa + "T00:00:00"), "dd/MM/yyyy")}</span>
            {pesquisa.cidade && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{pesquisa.cidade.nome}</span>}
          </p>
        </div>
      </div>

      {pesquisa.observacoes && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm">{pesquisa.observacoes}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Terrenos ({terrenos.length})</h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" />Adicionar Terreno</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Terreno</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input placeholder="Nome / Identificação *" value={tNome} onChange={(e) => setTNome(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Preço (R$)" value={tPreco} onChange={(e) => setTPreco(e.target.value)} />
                <Input type="number" placeholder="Tamanho (m²)" value={tTamanho} onChange={(e) => setTTamanho(e.target.value)} />
              </div>
              <Input placeholder="Condições de pagamento" value={tCondicoes} onChange={(e) => setTCondicoes(e.target.value)} />
              <Input placeholder="Tipo do terreno" value={tTipo} onChange={(e) => setTTipo(e.target.value)} />
              <Input placeholder="URL do anúncio" value={tUrl} onChange={(e) => setTUrl(e.target.value)} />
              <Textarea placeholder="Observações" value={tObs} onChange={(e) => setTObs(e.target.value)} rows={2} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
              <Button onClick={handleAdd} disabled={createTerreno.isPending}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2].map((i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : terrenos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum terreno cadastrado</p>
          <p className="text-sm">Adicione terrenos para mapear a concorrência</p>
        </div>
      ) : (
        <div className="space-y-2">
          {terrenos.map((t) => (
            <Card key={t.id} className="group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t.nome}</span>
                      {t.tipo_terreno && <Badge variant="outline" className="text-xs">{t.tipo_terreno}</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {t.preco && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          R$ {t.preco.toLocaleString("pt-BR")}
                        </span>
                      )}
                      {t.tamanho_m2 && (
                        <span className="flex items-center gap-1">
                          <Ruler className="h-3 w-3" />
                          {t.tamanho_m2.toLocaleString("pt-BR")} m²
                        </span>
                      )}
                      {precoM2(t.preco, t.tamanho_m2) && (
                        <span className="text-primary font-medium">
                          R$ {parseFloat(precoM2(t.preco, t.tamanho_m2)!).toLocaleString("pt-BR")}/m²
                        </span>
                      )}
                    </div>
                    {t.condicoes_pagamento && <p className="text-xs text-muted-foreground">{t.condicoes_pagamento}</p>}
                    {t.observacoes && <p className="text-xs text-muted-foreground italic">{t.observacoes}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    {t.url_anuncio && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(t.url_anuncio!, "_blank")}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir terreno?</AlertDialogTitle>
                          <AlertDialogDescription>O terreno "{t.nome}" será removido.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteTerreno.mutate(t.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
