import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";

type Gleba = Tables<"glebas">;

const STATUS_COLORS: Record<string, string> = {
  identificada: "#3b82f6",
  informacoes_recebidas: "#06b6d4",
  visita_realizada: "#14b8a6",
  proposta_enviada: "#f59e0b",
  protocolo_assinado: "#f97316",
  descartada: "#ef4444",
  proposta_recusada: "#f43f5e",
  negocio_fechado: "#22c55e",
  standby: "#a855f7",
};

const STATUS_LABELS: Record<string, string> = {
  identificada: "Identificada",
  informacoes_recebidas: "Informações Recebidas",
  visita_realizada: "Visita Realizada",
  proposta_enviada: "Proposta Enviada",
  protocolo_assinado: "Protocolo Assinado",
  descartada: "Descartada",
  proposta_recusada: "Proposta Recusada",
  negocio_fechado: "Negócio Fechado",
  standby: "Standby",
};

interface GlebaMapProps {
  glebas: Gleba[];
  onSelectGleba?: (gleba: Gleba) => void;
  center?: [number, number];
  zoom?: number;
}

export function GlebaMap({
  glebas,
  onSelectGleba,
  center = [-15.7942, -47.8822], // Brasília como padrão
  zoom = 10,
}: GlebaMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    // Inicializar mapa
    if (!mapRef.current) {
      mapRef.current = L.map("map").setView(center, zoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    // Limpar marcadores antigos
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Adicionar marcadores para cada gleba
    glebas.forEach((gleba) => {
      // Coordenadas padrão (Brasília) + variação aleatória
      const lat = -15.7942 + (Math.random() * 0.2 - 0.1);
      const lng = -47.8822 + (Math.random() * 0.2 - 0.1);
      const color = STATUS_COLORS[gleba.status] || "#64748b";

      // Criar ícone customizado
      const icon = L.divIcon({
        html: `
          <div style="
            background-color: ${color};
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: 3px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            font-size: 18px;
          ">
            📍
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
      });

      // Criar marcador
      const marker = L.marker([lat, lng], { icon }).addTo(mapRef.current!);

      // Popup com informações da gleba
      const popupContent = `
        <div style="font-family: system-ui, sans-serif; width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px;">${gleba.apelido}</h3>
          <div style="
            display: inline-block;
            background-color: ${color}20;
            color: ${color};
            border: 1px solid ${color};
            border-radius: 4px;
            padding: 2px 6px;
            font-size: 12px;
            margin-bottom: 8px;
          ">
            ${STATUS_LABELS[gleba.status] || gleba.status}
          </div>
          ${gleba.proprietario_nome ? `<p style="margin: 4px 0; font-size: 12px;"><strong>Prop.:</strong> ${gleba.proprietario_nome}</p>` : ""}
          ${gleba.tamanho_m2 ? `<p style="margin: 4px 0; font-size: 12px;"><strong>Área:</strong> ${gleba.tamanho_m2.toLocaleString()} m²</p>` : ""}
          ${gleba.preco ? `<p style="margin: 4px 0; font-size: 12px;"><strong>Preço:</strong> R$ ${gleba.preco.toLocaleString()}</p>` : ""}
        </div>
      `;

      marker.bindPopup(popupContent);

      // Click para selecionar
      marker.on("click", () => {
        onSelectGleba?.(gleba);
      });

      markersRef.current.push(marker);
    });
  }, [glebas, center, zoom, onSelectGleba]);

  return <div id="map" style={{ height: "100%", width: "100%" }} />;
}