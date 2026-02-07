import { useEffect, useRef } from "react";
import {
  Cartesian3,
  Color,
  PolygonHierarchy,
  createGooglePhotorealistic3DTileset,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  defined,
  Viewer,
  Cesium3DTileset,
  Cartographic,
  Math as CesiumMath,
  ClassificationType,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { Tables } from "@/integrations/supabase/types";

type Gleba = Tables<"glebas">;

// ⚠️ IMPORTANTE: Sua Google Maps API Key
const GOOGLE_MAPS_API_KEY = "AIzaSyDqTgpc8FdUMf622yGI7IFHDcS_e9JncBI";

// Cores por status
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

    if (geojson.type === "FeatureCollection" && geojson.features?.length > 0) {
      return geoJsonToCartesian3Array(geojson.features[0]);
    }

    if (geojson.type === "Feature" && geojson.geometry) {
      return geoJsonToCartesian3Array(geojson.geometry);
    }

    if (geojson.type === "Polygon" && geojson.coordinates?.[0]) {
      coordinates = geojson.coordinates[0];
    } else if (geojson.type === "MultiPolygon" && geojson.coordinates?.[0]?.[0]) {
      coordinates = geojson.coordinates[0][0];
    } else if (geojson.type === "Point" && geojson.coordinates) {
      return [Cartesian3.fromDegrees(geojson.coordinates[0], geojson.coordinates[1])];
    } else {
      return null;
    }

    return coordinates.map((coord) => Cartesian3.fromDegrees(coord[0], coord[1]));
  } catch (error) {
    console.error("Erro ao converter GeoJSON:", error);
    return null;
  }
}

// Calcula o centro de um polígono em graus
function getPolygonCenterDegrees(geojson: any): { lon: number; lat: number } | null {
  if (!geojson) return null;

  try {
    let coordinates: number[][] = [];

    if (geojson.type === "FeatureCollection" && geojson.features?.length > 0) {
      return getPolygonCenterDegrees(geojson.features[0]);
    }

    if (geojson.type === "Feature" && geojson.geometry) {
      return getPolygonCenterDegrees(geojson.geometry);
    }

    if (geojson.type === "Polygon" && geojson.coordinates?.[0]) {
      coordinates = geojson.coordinates[0];
    } else if (geojson.type === "MultiPolygon" && geojson.coordinates?.[0]?.[0]) {
      coordinates = geojson.coordinates[0][0];
    } else if (geojson.type === "Point" && geojson.coordinates) {
      return { lon: geojson.coordinates[0], lat: geojson.coordinates[1] };
    } else {
      return null;
    }

    let sumLon = 0, sumLat = 0;
    for (const coord of coordinates) {
      sumLon += coord[0];
      sumLat += coord[1];
    }
    return { lon: sumLon / coordinates.length, lat: sumLat / coordinates.length };
  } catch {
    return null;
  }
}

export function GlebaMap3D({
  glebas,
  onSelectGleba,
  selectedGlebaId,
}: GlebaMap3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const tilesetRef = useRef<Cesium3DTileset | null>(null);
  const handlerRef = useRef<ScreenSpaceEventHandler | null>(null);

  // Inicializar o viewer
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const viewer = new Viewer(containerRef.current, {
      timeline: false,
      animation: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      selectionIndicator: true,
      navigationHelpButton: false,
      infoBox: true,
      fullscreenButton: false,
    });

    viewerRef.current = viewer;

    // Ocultar widgets
    const timelineContainer = viewer.timeline?.container as HTMLElement;
    const animationContainer = viewer.animation?.container as HTMLElement;
    if (timelineContainer) timelineContainer.style.display = "none";
    if (animationContainer) animationContainer.style.display = "none";

    // Habilitar iluminação
    viewer.scene.globe.enableLighting = true;

    // Carregar Google 3D Tiles
    createGooglePhotorealistic3DTileset({ key: GOOGLE_MAPS_API_KEY })
      .then((tileset) => {
        viewer.scene.primitives.add(tileset);
        tilesetRef.current = tileset;
      })
      .catch((error) => {
        console.error("Erro ao carregar Google 3D Tiles:", error);
      });

    // Posição inicial (Brasil)
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(-47.8822, -15.7942, 50000),
      duration: 2,
    });

    return () => {
      if (handlerRef.current) {
        handlerRef.current.destroy();
        handlerRef.current = null;
      }
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  // Adicionar entidades das glebas
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // Limpar entidades existentes
    viewer.entities.removeAll();

    let firstGlebaCenter: { lon: number; lat: number } | null = null;

    // Adicionar cada gleba como entidade
    glebas.forEach((gleba, index) => {
      if (!gleba.poligono_geojson) return;

      const coordinates = geoJsonToCartesian3Array(gleba.poligono_geojson);
      if (!coordinates || coordinates.length < 3) return;

      // Guardar centro da primeira gleba para voar até ela
      if (index === 0 && !firstGlebaCenter) {
        firstGlebaCenter = getPolygonCenterDegrees(gleba.poligono_geojson);
      }

      const fillColor = STATUS_COLORS[gleba.status] || Color.GRAY.withAlpha(0.6);
      const outlineColor = STATUS_OUTLINE_COLORS[gleba.status] || Color.GRAY;

      viewer.entities.add({
        id: gleba.id,
        name: gleba.apelido,
        description: `
          <h3>${gleba.apelido}</h3>
          <p><strong>Status:</strong> ${gleba.status.replace(/_/g, " ")}</p>
          ${gleba.tamanho_m2 ? `<p><strong>Área:</strong> ${gleba.tamanho_m2.toLocaleString()} m²</p>` : ""}
          ${gleba.preco ? `<p><strong>Preço:</strong> R$ ${gleba.preco.toLocaleString()}</p>` : ""}
        `,
        polygon: {
          hierarchy: new PolygonHierarchy(coordinates),
          material: fillColor,
          outline: true,
          outlineColor: outlineColor,
          outlineWidth: 2,
          classificationType: ClassificationType.CESIUM_3D_TILE,
        },
      });
    });

    // Voar para a primeira gleba quando as glebas forem carregadas
    if (firstGlebaCenter && glebas.length > 0) {
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(firstGlebaCenter.lon, firstGlebaCenter.lat, 15000),
        duration: 2,
      });
    }
  }, [glebas]);

  // Handler de clique
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !onSelectGleba) return;

    if (handlerRef.current) {
      handlerRef.current.destroy();
    }

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: any) => {
      const pickedObject = viewer.scene.pick(click.position);
      if (defined(pickedObject) && pickedObject.id?.id) {
        const glebaId = pickedObject.id.id;
        const gleba = glebas.find((g) => g.id === glebaId);
        if (gleba) {
          onSelectGleba(gleba);
        }
      }
    }, ScreenSpaceEventType.LEFT_CLICK);

    handlerRef.current = handler;

    return () => {
      if (handlerRef.current) {
        handlerRef.current.destroy();
        handlerRef.current = null;
      }
    };
  }, [glebas, onSelectGleba]);

  // FlyTo quando uma gleba é selecionada
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!selectedGlebaId || !viewer) return;

    const gleba = glebas.find((g) => g.id === selectedGlebaId);
    if (!gleba?.poligono_geojson) return;

    const center = getPolygonCenterDegrees(gleba.poligono_geojson);
    if (!center) return;

    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(center.lon, center.lat, 5000),
      duration: 1.5,
    });
  }, [selectedGlebaId, glebas]);

  return (
    <div 
      ref={containerRef} 
      style={{ height: "100%", width: "100%" }}
    />
  );
}

// Manter a função parseKmzFile para compatibilidade
export { parseKmzFile } from "./GlebaMap";
