import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Glebas from "./pages/Glebas";
import Cidades from "./pages/Cidades";
import Mapa from "./pages/Mapa";
import Atividades from "./pages/Atividades";
import Imobiliarias from "./pages/Imobiliarias";
import Propostas from "./pages/Propostas";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Rotas protegidas com layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Placeholder routes - serão implementadas depois */}
            <Route
              path="/glebas"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Glebas />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/mapa"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Mapa />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/propostas"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Propostas />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cidades"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Cidades />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/imobiliarias"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Imobiliarias />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/atividades"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Atividades />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute requireAdmin>
                  <AppLayout>
                    <Configuracoes />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;