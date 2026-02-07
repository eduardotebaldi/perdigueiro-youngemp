import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Users, Plus, Trash2, Shield, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface UserWithRole {
  id: string;
  email: string;
  role: "admin" | "user";
  created_at: string;
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
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Configurações</h1>
        </div>
        <p className="text-muted-foreground">
          Gerencie usuários e permissões do sistema
        </p>
      </div>

      {/* Users Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuários
              </CardTitle>
              <CardDescription>
                Gerencie os usuários e suas permissões de acesso
              </CardDescription>
            </div>
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
      </Card>
    </div>
  );
}
