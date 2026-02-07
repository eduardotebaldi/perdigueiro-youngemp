import { useEffect, useRef, useCallback } from "react";
import { Viewer, Entity, PolygonGraphics, CameraFlyTo } from "resium";
import {
  Ion,
  Cartesian3,
  Color,
  PolygonHierarchy,
  Cesium3DTileset,
  createGooglePhotorealistic3DTileset,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  defined,
  Viewer as CesiumViewer,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { Tables } from "@/integrations/supabase/types";

type Gleba = Tables<"glebas">;

// ⚠️ IMPORTANTE: Insira sua API Key do Google Maps aqui
// Para obter: https://console.cloud.google.com/apis/credentials
// Habilite a API "Map Tiles API"
const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";

// Cores por status (formato Cesium RGBA 0-1)
const STATUS_COLORS: Record<string, Color> = {
  identificada: Color.fromCssColorString("#3b82f6").withAlpha(0.6),
  informacoes_recebidas: Color.fromCssColorString("#06b6d4").withAlpha(0.6),
  visita_realizada: Color.fromCssColorString("#14b8a6").withAlpha(0.6),
  proposta_enviada: Color.fromCssColorString("#f59e0b").withAlpha(0.6),
  protocolo_assinado: Color.fromCssColorString("#f97316").withAlpha(0.6),
  descartada: Color.fromCssColorString("#ef4444").withAlpha(0.6),
  proposta_recusada: Color.fromCssColorString("#f43f5e").withAlpha(0.6),
  negocio_fechado: Color.fromCssColorString("#22c55e").withAlpha(0.6),
  standby: Color.fromCssColorString("#a855f7").withAlpha(0.6),
};

const STATUS_OUTLINE_COLORS: Record<string, Color> = {
  identificada: Color.fromCssColorString("#3b82f6"),
  informacoes_recebidas: Color.fromCssColorString("#06b6d4"),
  visita_realizada: Color.fromCssColorString("#14b8a6"),
  proposta_enviada: Color.fromCssColorString("#f59e0b"),
  protocolo_assinado: Color.fromCssColorString("#f97316"),
  descartada: Color.fromCssColorString("#ef4444"),
  proposta_recusada: Color.fromCssColorString("#f43f5e"),
  negocio_fechado: Color.fromCssColorString("#22c55e"),
  standby: Color.fromCssColorString("#a855f7"),
};

interface GlebaMap3DProps {
  glebas: Gleba[];
  onSelectGleba?: (gleba: Gleba) => void;
  selectedGlebaId?: string | null;
  isFullscreen?: boolean;
}

// Converte GeoJSON para array de Cartesian3
function geoJsonToCartesian3Array(geojson: any): Cartesian3[] | null {
  if (!geojson) return null;

  try {
    let coordinates: number[][] = [];

    // Handle FeatureCollection
    if (geojson.type === "FeatureCollection" && geojson.features?.length > 0) {
      return geoJsonToCartesian3Array(geojson.features[0]);
    }

    // Handle Feature
    if (geojson.type === "Feature" && geojson.geometry) {
      return geoJsonToCartesian3Array(geojson.geometry);
    }

    // Handle Polygon
    if (geojson.type === "Polygon" && geojson.coordinates?.[0]) {
      coordinates = geojson.coordinates[0];
    }
    // Handle MultiPolygon (use first polygon)
    else if (geojson.type === "MultiPolygon" && geojson.coordinates?.[0]?.[0]) {
      coordinates = geojson.coordinates[0][0];
    }
    // Handle Point
    else if (geojson.type === "Point" && geojson.coordinates) {
      return [Cartesian3.fromDegrees(geojson.coordinates[0], geojson.coordinates[1])];
    } else {
      return null;
    }

    // Converter coordenadas [lng, lat] para Cartesian3
    return coordinates.map((coord) =>
      Cartesian3.fromDegrees(coord[0], coord[1])
    );
  } catch (error) {
    console.error("Erro ao converter GeoJSON:", error);
    return null;
  }
}

// Calcula o centro de um polígono
function getPolygonCenter(coordinates: Cartesian3[]): Cartesian3 | null {
  if (!coordinates || coordinates.length === 0) return null;

  let sumX = 0, sumY = 0, sumZ = 0;
  for (const coord of coordinates) {
    sumX += coord.x;
    sumY += coord.y;
    sumZ += coord.z;
  }
  const count = coordinates.length;
  return new Cartesian3(sumX / count, sumY / count, sumZ / count);
}

export function GlebaMap3D({
  glebas,
  onSelectGleba,
  selectedGlebaId,
  isFullscreen = false,
}: GlebaMap3DProps) {
  const viewerRef = useRef<CesiumViewer | null>(null);
  const tilesetRef = useRef<Cesium3DTileset | null>(null);

  // Configurar Google 3D Tiles quando o viewer estiver pronto
  const handleViewerReady = useCallback(async (viewer: CesiumViewer) => {
    viewerRef.current = viewer;

    // Remover widgets desnecessários
    const timelineContainer = viewer.timeline?.container as HTMLElement;
    const animationContainer = viewer.animation?.container as HTMLElement;
    if (timelineContainer) timelineContainer.style.display = "none";
    if (animationContainer) animationContainer.style.display = "none";
    
    // Configurar terreno e iluminação
    viewer.scene.globe.enableLighting = true;

    // Carregar Google Photorealistic 3D Tiles
    try {
      if (GOOGLE_MAPS_API_KEY !== "YOUR_GOOGLE_MAPS_API_KEY") {
        const tileset = await createGooglePhotorealistic3DTileset(GOOGLE_MAPS_API_KEY);
        viewer.scene.primitives.add(tileset);
        tilesetRef.current = tileset;
      } else {
        console.warn("Google Maps API Key não configurada. Configure a constante GOOGLE_MAPS_API_KEY.");
      }
    } catch (error) {
      console.error("Erro ao carregar Google 3D Tiles:", error);
    }

    // Configurar handler de clique
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: any) => {
      const pickedObject = viewer.scene.pick(click.position);
      if (defined(pickedObject) && pickedObject.id) {
        const glebaId = pickedObject.id.id;
        const gleba = glebas.find((g) => g.id === glebaId);
        if (gleba && onSelectGleba) {
          onSelectGleba(gleba);
        }
      }
    }, ScreenSpaceEventType.LEFT_CLICK);

    // Posição inicial (Brasil - Brasília)
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(-47.8822, -15.7942, 50000),
      duration: 2,
    });
  }, [glebas, onSelectGleba]);

  // FlyTo quando uma gleba é selecionada na sidebar
  useEffect(() => {
    if (!selectedGlebaId || !viewerRef.current) return;

    const gleba = glebas.find((g) => g.id === selectedGlebaId);
    if (!gleba?.poligono_geojson) return;

    const coordinates = geoJsonToCartesian3Array(gleba.poligono_geojson);
    if (!coordinates) return;

    const center = getPolygonCenter(coordinates);
    if (!center) return;

    viewerRef.current.camera.flyTo({
      destination: Cartesian3.fromDegrees(
        // Precisa converter de volta para degrees - simplificando aqui
        -47.8822, // TODO: calcular centro real
        -15.7942,
        5000
      ),
      duration: 1.5,
    });
  }, [selectedGlebaId, glebas]);

  // Preparar entidades das glebas
  const glebaEntities = glebas
    .filter((gleba) => gleba.poligono_geojson)
    .map((gleba) => {
      const coordinates = geoJsonToCartesian3Array(gleba.poligono_geojson);
      if (!coordinates || coordinates.length < 3) return null;

      const fillColor = STATUS_COLORS[gleba.status] || Color.GRAY.withAlpha(0.6);
      const outlineColor = STATUS_OUTLINE_COLORS[gleba.status] || Color.GRAY;

      return (
        <Entity
          key={gleba.id}
          id={gleba.id}
          name={gleba.apelido}
          description={`
            <h3>${gleba.apelido}</h3>
            <p><strong>Status:</strong> ${gleba.status.replace(/_/g, " ")}</p>
            ${gleba.tamanho_m2 ? `<p><strong>Área:</strong> ${gleba.tamanho_m2.toLocaleString()} m²</p>` : ""}
            ${gleba.preco ? `<p><strong>Preço:</strong> R$ ${gleba.preco.toLocaleString()}</p>` : ""}
          `}
        >
          <PolygonGraphics
            hierarchy={new PolygonHierarchy(coordinates)}
            material={fillColor}
            outline
            outlineColor={outlineColor}
            outlineWidth={2}
            classificationType={1} // CESIUM_3D_TILE - clamp to 3D tiles
            height={0}
            extrudedHeight={undefined}
          />
        </Entity>
      );
    })
    .filter(Boolean);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Viewer
        full
        timeline={false}
        animation={false}
        baseLayerPicker={false}
        geocoder={false}
        homeButton={false}
        sceneModePicker={false}
        selectionIndicator
        navigationHelpButton={false}
        infoBox
        ref={(ref) => {
          if (ref?.cesiumElement) {
            handleViewerReady(ref.cesiumElement);
          }
        }}
      >
        {glebaEntities}
      </Viewer>

      {/* Aviso se API Key não configurada */}
      {GOOGLE_MAPS_API_KEY === "YOUR_GOOGLE_MAPS_API_KEY" && (
        <div className="absolute top-4 left-4 bg-warning/20 border border-warning text-warning-foreground px-4 py-2 rounded-lg text-sm max-w-md z-10">
          <strong>⚠️ API Key não configurada</strong>
          <p className="mt-1">
            Configure a constante <code className="bg-muted px-1 rounded">GOOGLE_MAPS_API_KEY</code> em{" "}
            <code className="bg-muted px-1 rounded">src/components/map/GlebaMap3D.tsx</code> para habilitar os Google 3D Tiles.
          </p>
        </div>
      )}
    </div>
  );
}

// Manter a função parseKmzFile para compatibilidade
export { parseKmzFile } from "./GlebaMap";
