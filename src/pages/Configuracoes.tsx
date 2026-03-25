import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Users, Plus, Trash2, Shield, ShieldCheck, Loader2, Pencil, Check, X, RefreshCw, MapPin, ChevronDown, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ReportConfigCard } from "@/components/configuracoes/ReportConfigCard";
import { useTiposArquivo } from "@/hooks/useTiposArquivo";

interface UserWithRole {
  id: string;
  email: string;
  role: "admin" | "user";
  created_at: string;
  nome: string;
}

export default function Configuracoes() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "user">("user");
  const [isCreating, setIsCreating] = useState(false);

  // Fetch all users with their roles (admin only via RPC function)
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_all_users_with_roles" as any);
      
      if (error) {
        console.error("Erro ao buscar usuários:", error);
        throw error;
      }
      
      return (data || []) as UserWithRole[];
    },
  });

  // Create new user mutation
  const createUser = useMutation({
    mutationFn: async ({ email, password, role }: { email: string; password: string; role: "admin" | "user" }) => {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: { email, password, role },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Usuário criado com sucesso!");
      setCreateDialogOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("user");
    },
    onError: (error: any) => {
      console.error("Erro ao criar usuário:", error);
      toast.error(error.message || "Erro ao criar usuário");
    },
  });

  // Update user role mutation
  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "user" }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Permissão atualizada!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar permissão:", error);
      toast.error("Erro ao atualizar permissão");
    },
  });

  // Update user name mutation
  const updateName = useMutation({
    mutationFn: async ({ userId, nome }: { userId: string; nome: string }) => {
      const { error } = await supabase
        .from("user_profiles" as any)
        .update({ nome })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Nome atualizado!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar nome:", error);
      toast.error("Erro ao atualizar nome");
    },
  });

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { userId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Usuário excluído!");
    },
    onError: (error: any) => {
      console.error("Erro ao excluir usuário:", error);
      toast.error(error.message || "Erro ao excluir usuário");
    },
  });

  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState("");

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (newUserPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setIsCreating(true);
    try {
      await createUser.mutateAsync({
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">

function TiposArquivoCard() {
  const { tiposArquivo, isLoading, createTipo, updateTipo, deleteTipo } = useTiposArquivo();
  const [newNome, setNewNome] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNome, setEditingNome] = useState("");

  const handleCreate = async () => {
    if (!newNome.trim()) return;
    try {
      await createTipo.mutateAsync(newNome.trim());
      setNewNome("");
      toast.success("Tipo de arquivo criado!");
    } catch {
      toast.error("Erro ao criar tipo de arquivo");
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingNome.trim()) return;
    try {
      await updateTipo.mutateAsync({ id, nome: editingNome.trim() });
      setEditingId(null);
      toast.success("Tipo atualizado!");
    } catch {
      toast.error("Erro ao atualizar tipo");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTipo.mutateAsync(id);
      toast.success("Tipo removido!");
    } catch {
      toast.error("Erro ao remover tipo. Verifique se não está em uso.");
    }
  };

  return (
    <Collapsible>
      <Card>
        <CardHeader>
          <CollapsibleTrigger className="flex-1 text-left group">
            <CardTitle className="flex items-center gap-2">
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
              <FileType className="h-5 w-5" />
              Tipos de Arquivo
            </CardTitle>
            <CardDescription className="ml-10">
              Gerencie os tipos de arquivo que podem ser atribuídos aos anexos das glebas
            </CardDescription>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Novo tipo de arquivo..."
                value={newNome}
                onChange={(e) => setNewNome(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              <Button onClick={handleCreate} disabled={createTipo.isPending || !newNome.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                Criar
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : tiposArquivo.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum tipo cadastrado</p>
            ) : (
              <div className="space-y-1">
                {tiposArquivo.map((tipo) => (
                  <div key={tipo.id} className="flex items-center justify-between gap-2 bg-muted/50 rounded-md px-3 py-2 group">
                    {editingId === tipo.id ? (
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          value={editingNome}
                          onChange={(e) => setEditingNome(e.target.value)}
                          className="h-8"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdate(tipo.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUpdate(tipo.id)}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm">{tipo.nome}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => { setEditingId(tipo.id); setEditingNome(tipo.nome); }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir tipo de arquivo?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  O tipo "{tipo.nome}" será removido. Isso só é possível se nenhum anexo estiver usando este tipo.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(tipo.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

      {/* Users Management */}
      <Collapsible defaultOpen>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger className="flex-1 text-left group">
                <CardTitle className="flex items-center gap-2">
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                  <Users className="h-5 w-5" />
                  Usuários
                </CardTitle>
                <CardDescription className="ml-10">
                  Gerencie os usuários e suas permissões de acesso
                </CardDescription>
              </CollapsibleTrigger>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Usuário</DialogTitle>
                    <DialogDescription>
                      Preencha os dados para criar uma nova conta de acesso ao sistema.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="usuario@email.com"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Nível de Acesso</Label>
                      <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as "admin" | "user")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Usuário
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4" />
                              Administrador
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Usuários podem criar e editar registros. Administradores têm acesso total.
                      </p>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateUser} disabled={isCreating}>
                      {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Criar Usuário
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !users || users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Permissão</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          {editingNameId === user.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editingNameValue}
                                onChange={(e) => setEditingNameValue(e.target.value)}
                                className="h-8 w-40"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    updateName.mutate({ userId: user.id, nome: editingNameValue });
                                    setEditingNameId(null);
                                  }
                                  if (e.key === "Escape") setEditingNameId(null);
                                }}
                              />
                              <Button
                                variant="ghost" size="icon" className="h-7 w-7"
                                onClick={() => {
                                  updateName.mutate({ userId: user.id, nome: editingNameValue });
                                  setEditingNameId(null);
                                }}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingNameId(null)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">{user.nome || "—"}</span>
                              <Button
                                variant="ghost" size="icon" className="h-7 w-7"
                                onClick={() => {
                                  setEditingNameId(user.id);
                                  setEditingNameValue(user.nome || "");
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(role) => updateRole.mutate({ userId: user.id, role: role as "admin" | "user" })}
                            disabled={user.id === currentUser?.id}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">
                                <Badge variant="secondary" className="gap-1">
                                  <Shield className="h-3 w-3" />
                                  Usuário
                                </Badge>
                              </SelectItem>
                              <SelectItem value="admin">
                                <Badge variant="default" className="gap-1">
                                  <ShieldCheck className="h-3 w-3" />
                                  Admin
                                </Badge>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          {user.id !== currentUser?.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. O usuário "{user.email}" será removido permanentemente do sistema.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteUser.mutate(user.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Tipos de Arquivo */}
      <TiposArquivoCard />

      {/* Relatórios */}
      <ReportConfigCard />

      {/* Reprocessar KMZs */}
      <ReprocessKmzCard />
    </div>
  );
}

function ReprocessKmzCard() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<{ apelido: string; success: boolean; message: string }[]>([]);
  const queryClient = useQueryClient();

  const { data: pendingGlebas, isLoading } = useQuery({
    queryKey: ["glebas-sem-poligono"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("glebas")
        .select("id, apelido, arquivo_kmz")
        .not("arquivo_kmz", "is", null)
        .is("poligono_geojson", null);
      if (error) throw error;
      return data || [];
    },
  });

  const handleReprocess = useCallback(async () => {
    if (!pendingGlebas || pendingGlebas.length === 0) return;
    setIsProcessing(true);
    setResults([]);
    setProgress({ current: 0, total: pendingGlebas.length });

    const newResults: typeof results = [];

    for (let i = 0; i < pendingGlebas.length; i++) {
      const gleba = pendingGlebas[i];
      setProgress({ current: i + 1, total: pendingGlebas.length });

      try {
        const { data, error } = await supabase.functions.invoke("process-kmz", {
          body: { kmzUrl: gleba.arquivo_kmz, glebaApelido: gleba.apelido },
        });

        if (error) throw error;

        if (data?.success && data.geojson) {
          const { error: updateError } = await supabase
            .from("glebas")
            .update({ poligono_geojson: data.geojson } as any)
            .eq("id", gleba.id);

          if (updateError) throw updateError;
          newResults.push({ apelido: gleba.apelido, success: true, message: "Polígono extraído" });
        } else {
          newResults.push({ apelido: gleba.apelido, success: false, message: data?.warning || "Sem polígono no arquivo" });
        }
      } catch (err: any) {
        newResults.push({ apelido: gleba.apelido, success: false, message: err.message || "Erro" });
      }

      setResults([...newResults]);
    }

    setIsProcessing(false);
    queryClient.invalidateQueries({ queryKey: ["glebas"] });
    queryClient.invalidateQueries({ queryKey: ["glebas-sem-poligono"] });

    const successCount = newResults.filter((r) => r.success).length;
    toast.success(`Reprocessamento concluído: ${successCount}/${pendingGlebas.length} polígonos extraídos`);
  }, [pendingGlebas, queryClient]);

  const pendingCount = pendingGlebas?.length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Reprocessar KMZs
            </CardTitle>
            <CardDescription>
              Extrair polígonos de glebas que possuem KMZ mas não têm polígono salvo
            </CardDescription>
          </div>
          <Button
            onClick={handleReprocess}
            disabled={isProcessing || isLoading || pendingCount === 0}
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {isProcessing
              ? `${progress.current}/${progress.total}`
              : `Reprocessar (${pendingCount})`}
          </Button>
        </div>
      </CardHeader>
      {results.length > 0 && (
        <CardContent>
          <div className="space-y-1 max-h-48 overflow-y-auto text-sm">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                {r.success ? (
                  <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                ) : (
                  <X className="h-3.5 w-3.5 text-destructive shrink-0" />
                )}
                <span className="font-medium truncate">{r.apelido}</span>
                <span className="text-muted-foreground text-xs truncate ml-auto">{r.message}</span>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
