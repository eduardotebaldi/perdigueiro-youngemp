import { Link } from "react-router-dom";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Kanban, Map, CalendarDays, FileText, Building, Building2 } from "lucide-react";

const quickAccessItems = [
  {
    title: "Kanban de Glebas",
    description: "Visualize e gerencie suas glebas em um quadro Kanban interativo",
    icon: Kanban,
    href: "/glebas",
  },
  {
    title: "Mapa 3D",
    description: "Visualize todas as glebas no mapa 3D com Google Earth",
    icon: Map,
    href: "/mapa",
  },
  {
    title: "Propostas",
    description: "Gerencie as propostas enviadas para as glebas",
    icon: FileText,
    href: "/propostas",
  },
  {
    title: "Atividades",
    description: "Registre e acompanhe todas as atividades realizadas",
    icon: CalendarDays,
    href: "/atividades",
  },
  {
    title: "Cidades",
    description: "Cadastre cidades e seus planos diretores",
    icon: Building,
    href: "/cidades",
  },
  {
    title: "Imobiliárias",
    description: "Gerencie os parceiros e imobiliárias",
    icon: Building2,
    href: "/imobiliarias",
  },
];

export function QuickAccess() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Acesso Rápido</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quickAccessItems.map((item) => (
          <Link key={item.href} to={item.href}>
            <Card className="hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
