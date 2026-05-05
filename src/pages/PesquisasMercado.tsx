import { useState, useRef } from "react";
import { format } from "date-fns";
import { Plus, Search, MapPin, Trash2, ChevronRight, CalendarDays, DollarSign, Ruler, FileText, ExternalLink, Pencil, Image as ImageIcon, Upload, X } from "lucide-react";
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
import { usePesquisasMercado, usePesquisaTerrenos, PesquisaMercado, PesquisaTerreno } from "@/hooks/usePesquisasMercado";
import { useCidades } from "@/hooks/useCidades";
import { supabase } from "@/integrations/supabase/client";
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

interface TerrenoFormState {
  nome: string;
  preco: string;
  tamanho_m2: string;
  condicoes_pagamento: string;
  tipo_terreno: string;
  observacoes: string;
  url_anuncio: string;
  coordenadas: string; // "lat, lng"
  imagem_url: string | null;
}

function emptyForm(): TerrenoFormState {
  return { nome: "", preco: "", tamanho_m2: "", condicoes_pagamento: "", tipo_terreno: "", observacoes: "", url_anuncio: "", coordenadas: "", imagem_url: null };
}

function parseCoords(s: string): { lat: number | null; lng: number | null } {
  if (!s.trim()) return { lat: null, lng: null };
  const m = s.replace(/\s/g, "").match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
  if (!m) return { lat: NaN, lng: NaN };
  return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
}

function PesquisaDetail({ pesquisa, onBack }: { pesquisa: PesquisaMercado; onBack: () => void }) {
  const { terrenos, isLoading, createTerreno, updateTerreno, deleteTerreno } = usePesquisaTerrenos(pesquisa.id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TerrenoFormState>(emptyForm());
  const [uploading, setUploading] = useState(false);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCreate = () => { setEditingId(null); setForm(emptyForm()); setDialogOpen(true); };
  const openEdit = (t: PesquisaTerreno) => {
    setEditingId(t.id);
    setForm({
      nome: t.nome,
      preco: t.preco?.toString() ?? "",
      tamanho_m2: t.tamanho_m2?.toString() ?? "",
      condicoes_pagamento: t.condicoes_pagamento ?? "",
      tipo_terreno: t.tipo_terreno ?? "",
      observacoes: t.observacoes ?? "",
      url_anuncio: t.url_anuncio ?? "",
      coordenadas: t.latitude && t.longitude ? `${t.latitude}, ${t.longitude}` : "",
      imagem_url: t.imagem_url ?? null,
    });
    setDialogOpen(true);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${pesquisa.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("pesquisa-imagens").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("pesquisa-imagens").getPublicUrl(path);
      setForm((f) => ({ ...f, imagem_url: data.publicUrl }));
      toast.success("Imagem enviada!");
    } catch (e: any) {
      toast.error("Erro ao enviar imagem: " + (e?.message || ""));
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          await uploadImage(file);
          return;
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (!form.nome.trim()) { toast.error("Informe o nome"); return; }
    const coords = parseCoords(form.coordenadas);
    if (form.coordenadas && (Number.isNaN(coords.lat) || Number.isNaN(coords.lng))) {
      toast.error("Coordenadas inválidas. Use: lat, lng");
      return;
    }
    const payload = {
      nome: form.nome.trim(),
      preco: form.preco ? parseFloat(form.preco) : null,
      tamanho_m2: form.tamanho_m2 ? parseFloat(form.tamanho_m2) : null,
      condicoes_pagamento: form.condicoes_pagamento || null,
      tipo_terreno: form.tipo_terreno || null,
      observacoes: form.observacoes || null,
      url_anuncio: form.url_anuncio || null,
      latitude: coords.lat,
      longitude: coords.lng,
      imagem_url: form.imagem_url,
    };
    try {
      if (editingId) {
        await updateTerreno.mutateAsync({ id: editingId, ...payload });
        toast.success("Terreno atualizado!");
      } else {
        await createTerreno.mutateAsync({ pesquisa_id: pesquisa.id, ...payload });
        toast.success("Terreno adicionado!");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Erro ao salvar terreno");
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
        <Button size="sm" onClick={openCreate}><Plus className="mr-1 h-4 w-4" />Adicionar Terreno</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" onPaste={handlePaste}>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Terreno" : "Adicionar Terreno"}</DialogTitle>
            <DialogDescription>Dica: você pode colar (Ctrl+V) uma imagem nesta janela.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input placeholder="Nome / Identificação *" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Preço (R$)" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} />
              <Input type="number" placeholder="Tamanho (m²)" value={form.tamanho_m2} onChange={(e) => setForm({ ...form, tamanho_m2: e.target.value })} />
            </div>
            <Input placeholder="Condições de pagamento" value={form.condicoes_pagamento} onChange={(e) => setForm({ ...form, condicoes_pagamento: e.target.value })} />
            <Input placeholder="Tipo do terreno" value={form.tipo_terreno} onChange={(e) => setForm({ ...form, tipo_terreno: e.target.value })} />
            <Input placeholder="URL do anúncio" value={form.url_anuncio} onChange={(e) => setForm({ ...form, url_anuncio: e.target.value })} />
            <Input placeholder="Coordenadas (lat, lng) — ex: -29.7869, -55.7619" value={form.coordenadas} onChange={(e) => setForm({ ...form, coordenadas: e.target.value })} />
            <Textarea placeholder="Observações" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} />

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2"><ImageIcon className="h-4 w-4" />Imagem (print do anúncio)</label>
              {form.imagem_url ? (
                <div className="relative inline-block">
                  <img src={form.imagem_url} alt="Preview" className="max-h-40 rounded border" />
                  <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => setForm({ ...form, imagem_url: null })}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    <Upload className="h-4 w-4 mr-1" />{uploading ? "Enviando..." : "Selecionar arquivo"}
                  </Button>
                  <span className="text-xs text-muted-foreground">ou cole (Ctrl+V) uma imagem</span>
                </div>
              )}
              <input
                ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); if (fileInputRef.current) fileInputRef.current.value = ""; }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <div>
              {editingId && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" type="button">
                      <Trash2 className="h-4 w-4 mr-1" />Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir terreno?</AlertDialogTitle>
                      <AlertDialogDescription>O terreno "{form.nome}" será removido.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          try {
                            await deleteTerreno.mutateAsync(editingId);
                            toast.success("Terreno removido!");
                            setDialogOpen(false);
                          } catch { toast.error("Erro ao remover"); }
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createTerreno.isPending || updateTerreno.isPending}>
                {editingId ? "Salvar" : "Adicionar"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image preview lightbox */}
      <Dialog open={!!previewImg} onOpenChange={(o) => !o && setPreviewImg(null)}>
        <DialogContent className="max-w-3xl">
          {previewImg && <img src={previewImg} alt="Preview" className="w-full h-auto rounded" />}
        </DialogContent>
      </Dialog>

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
            <Card key={t.id} className="group cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEdit(t)}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {t.imagem_url && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewImg(t.imagem_url); }}
                      className="shrink-0"
                    >
                      <img src={t.imagem_url} alt={t.nome} className="h-16 w-16 object-cover rounded border hover:opacity-80 transition" />
                    </button>
                  )}
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{t.nome}</span>
                      {t.tipo_terreno && <Badge variant="outline" className="text-xs">{t.tipo_terreno}</Badge>}
                      {t.latitude && t.longitude && (
                        <Badge variant="secondary" className="text-xs gap-1"><MapPin className="h-3 w-3" />Geo</Badge>
                      )}
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
                  <div className="flex items-center gap-1 shrink-0">
                    {t.url_anuncio && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); window.open(t.url_anuncio!, "_blank"); }}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(t); }} title="Editar">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
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
