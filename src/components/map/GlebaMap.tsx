import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Tables } from "@/integrations/supabase/types";
import { kml } from "@tmcw/togeojson";
import JSZip from "jszip";

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

// Tipos de camadas de mapa
const TILE_LAYERS = {
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    name: "Ruas",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    name: "Satélite",
  },
  hybrid: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    name: "Híbrido",
  },
};

// Camada de labels para sobrepor no satélite (inclui nomes e fronteiras)
const LABELS_LAYER = {
  url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png",
  attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
};

// Camada de fronteiras administrativas
const BOUNDARIES_LAYER = {
  url: "https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lines/{z}/{x}/{y}{r}.png",
  attribution: '&copy; <a href="https://stamen.com/">Stamen</a>',
};

interface GlebaMapProps {
  glebas: Gleba[];
  onSelectGleba?: (gleba: Gleba) => void;
  center?: [number, number];
  zoom?: number;
  isFullscreen?: boolean;
  mapType?: "street" | "satellite" | "hybrid";
  onKmzImport?: (geojson: any) => void;
}

export function GlebaMap({
  glebas,
  onSelectGleba,
  center = [-15.7942, -47.8822],
  zoom = 10,
  isFullscreen = false,
  mapType = "street",
  onKmzImport,
}: GlebaMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  const boundariesLayerRef = useRef<L.TileLayer | null>(null);
  const kmzLayerRef = useRef<L.GeoJSON | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Inicializar mapa
  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView(center, zoom);

      const layer = TILE_LAYERS[mapType];
      tileLayerRef.current = L.tileLayer(layer.url, {
        attribution: layer.attribution,
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Atualizar tipo de mapa
  useEffect(() => {
    if (!mapRef.current) return;

    // Remover camadas anteriores
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }
    if (labelsLayerRef.current) {
      labelsLayerRef.current.remove();
      labelsLayerRef.current = null;
    }
    if (boundariesLayerRef.current) {
      boundariesLayerRef.current.remove();
      boundariesLayerRef.current = null;
    }

    // Adicionar camada base
    const layer = TILE_LAYERS[mapType];
    tileLayerRef.current = L.tileLayer(layer.url, {
      attribution: layer.attribution,
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Adicionar fronteiras e labels para satélite e híbrido
    if (mapType === "satellite" || mapType === "hybrid") {
      // Camada de fronteiras (linhas de estados, países, etc)
      boundariesLayerRef.current = L.tileLayer(
        "https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lines/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 19,
          opacity: 0.4,
          subdomains: "abcd",
        }
      ).addTo(mapRef.current);

      // Camada de labels (nomes de cidades, estados, etc)
      labelsLayerRef.current = L.tileLayer(LABELS_LAYER.url, {
        attribution: LABELS_LAYER.attribution,
        maxZoom: 19,
        pane: "overlayPane",
      }).addTo(mapRef.current);
    }
  }, [mapType]);

  // Atualizar tamanho do mapa quando fullscreen muda
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }
  }, [isFullscreen]);

  // Atualizar marcadores
  useEffect(() => {
    if (!mapRef.current) return;

    // Limpar marcadores antigos
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Adicionar marcadores para cada gleba
    glebas.forEach((gleba) => {
      const lat = -15.7942 + (Math.random() * 0.2 - 0.1);
      const lng = -47.8822 + (Math.random() * 0.2 - 0.1);
      const color = STATUS_COLORS[gleba.status] || "#64748b";

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

      const marker = L.marker([lat, lng], { icon }).addTo(mapRef.current!);

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
      marker.on("click", () => onSelectGleba?.(gleba));
      markersRef.current.push(marker);
    });
  }, [glebas, onSelectGleba]);

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />;
}

// Função para importar arquivo KMZ
export async function parseKmzFile(file: File): Promise<any> {
  const arrayBuffer = await file.arrayBuffer();

  if (file.name.endsWith(".kmz")) {
    // KMZ é um arquivo zip contendo um KML
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(arrayBuffer);
    
    // Procurar arquivo KML dentro do zip
    const kmlFile = Object.keys(zipContent.files).find(
      (name) => name.endsWith(".kml")
    );
    
    if (!kmlFile) {
      throw new Error("Nenhum arquivo KML encontrado no KMZ");
    }
    
    const kmlContent = await zipContent.files[kmlFile].async("string");
    const parser = new DOMParser();
    const kmlDoc = parser.parseFromString(kmlContent, "text/xml");
    return kml(kmlDoc);
  } else {
    // Arquivo KML direto
    const decoder = new TextDecoder();
    const kmlContent = decoder.decode(arrayBuffer);
    const parser = new DOMParser();
    const kmlDoc = parser.parseFromString(kmlContent, "text/xml");
    return kml(kmlDoc);
  }
}