import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Status colors for Google Earth (AABBGGRR format - Alpha, Blue, Green, Red)
const STATUS_COLORS: Record<string, string> = {
  identificada: "ff0000ff", // Red
  informacoes_recebidas: "ff00a5ff", // Orange
  visita_realizada: "ff00ffff", // Yellow
  proposta_enviada: "ffff0000", // Blue
  protocolo_assinado: "ff00ff00", // Green
  descartada: "ff808080", // Gray
  proposta_recusada: "ff0000aa", // Dark Red
  negocio_fechado: "ff00aa00", // Dark Green
  standby: "ffaa00aa", // Purple
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

interface Gleba {
  id: string;
  apelido: string;
  status: string;
  tamanho_m2: number | null;
  preco: number | null;
  proprietario_nome: string | null;
  poligono_geojson: any;
  prioridade: boolean;
  cidade?: { nome: string } | null;
}

function formatCurrency(value: number | null): string {
  if (value === null) return "Não informado";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatArea(value: number | null): string {
  if (value === null) return "Não informado";
  return new Intl.NumberFormat("pt-BR").format(value) + " m²";
}

function geoJsonToKmlCoordinates(geojson: any): { coordinates: string; type: string } | null {
  if (!geojson) return null;

  try {
    // Handle FeatureCollection - get first feature's geometry
    if (geojson.type === "FeatureCollection" && geojson.features?.length > 0) {
      return geoJsonToKmlCoordinates(geojson.features[0]);
    }
    
    // Handle Feature - extract geometry
    if (geojson.type === "Feature" && geojson.geometry) {
      return geoJsonToKmlCoordinates(geojson.geometry);
    }

    // Handle Polygon
    if (geojson.type === "Polygon" && geojson.coordinates?.[0]) {
      const coords = geojson.coordinates[0]
        .map((coord: number[]) => `${coord[0]},${coord[1]},0`)
        .join(" ");
      return { coordinates: coords, type: "Polygon" };
    }
    
    // Handle Point
    if (geojson.type === "Point" && geojson.coordinates) {
      return { 
        coordinates: `${geojson.coordinates[0]},${geojson.coordinates[1]},0`,
        type: "Point"
      };
    }
    
    // Handle MultiPolygon - use first polygon
    if (geojson.type === "MultiPolygon" && geojson.coordinates?.[0]?.[0]) {
      const coords = geojson.coordinates[0][0]
        .map((coord: number[]) => `${coord[0]},${coord[1]},0`)
        .join(" ");
      return { coordinates: coords, type: "Polygon" };
    }

    return null;
  } catch {
    return null;
  }
}

function generatePlacemarkDescription(
  gleba: Gleba,
  appUrl: string
): string {
  const statusColor = STATUS_COLORS[gleba.status] || "ffffffff";
  const statusLabel = STATUS_LABELS[gleba.status] || gleba.status;
  const detailsUrl = `${appUrl}/glebas?id=${gleba.id}`;

  return `<![CDATA[
    <div style="font-family: Arial, sans-serif; max-width: 300px;">
      <h3 style="margin: 0 0 10px 0; color: #333;">${escapeXml(gleba.apelido)}</h3>
      
      <div style="margin-bottom: 8px;">
        <strong>Status:</strong> 
        <span style="background-color: #${statusColor.slice(2)}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
          ${statusLabel}
        </span>
      </div>
      
      ${gleba.cidade ? `<div style="margin-bottom: 5px;"><strong>Cidade:</strong> ${escapeXml(gleba.cidade.nome)}</div>` : ""}
      
      <div style="margin-bottom: 5px;"><strong>Área:</strong> ${formatArea(gleba.tamanho_m2)}</div>
      
      <div style="margin-bottom: 5px;"><strong>Valor:</strong> ${formatCurrency(gleba.preco)}</div>
      
      ${gleba.proprietario_nome ? `<div style="margin-bottom: 5px;"><strong>Proprietário:</strong> ${escapeXml(gleba.proprietario_nome)}</div>` : ""}
      
      ${gleba.prioridade ? `<div style="margin-bottom: 10px; color: #ff6600; font-weight: bold;">⭐ Prioridade</div>` : ""}
      
      <div style="margin-top: 15px;">
        <a href="${detailsUrl}" target="_blank" style="
          display: inline-block;
          background-color: #FE5009;
          color: white;
          padding: 8px 16px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
        ">Abrir no Sistema</a>
      </div>
    </div>
  ]]>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateKml(glebas: Gleba[], appUrl: string): string {
  const placemarks = glebas
    .filter((g) => g.poligono_geojson)
    .map((gleba) => {
      const result = geoJsonToKmlCoordinates(gleba.poligono_geojson);
      if (!result) return "";

      const { coordinates, type } = result;
      const color = STATUS_COLORS[gleba.status] || "ffffffff";

      const geometry = type === "Polygon"
        ? `<Polygon>
            <outerBoundaryIs>
              <LinearRing>
                <coordinates>${coordinates}</coordinates>
              </LinearRing>
            </outerBoundaryIs>
          </Polygon>`
        : `<Point><coordinates>${coordinates}</coordinates></Point>`;

      return `
        <Placemark id="${gleba.id}">
          <name>${escapeXml(gleba.apelido)}</name>
          <description>${generatePlacemarkDescription(gleba, appUrl)}</description>
          <Style>
            <PolyStyle>
              <color>${color}</color>
              <fill>1</fill>
              <outline>1</outline>
            </PolyStyle>
            <LineStyle>
              <color>${color}</color>
              <width>2</width>
            </LineStyle>
            <IconStyle>
              <color>${color}</color>
            </IconStyle>
          </Style>
          ${geometry}
        </Placemark>
      `;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Glebas - Young Empreendimentos</name>
    <description>Mapa de glebas mapeadas pelo sistema</description>
    <open>1</open>
    
    ${placemarks}
    
  </Document>
</kml>`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all glebas with geometry
    const { data: glebas, error } = await supabase
      .from("glebas")
      .select(`
        id,
        apelido,
        status,
        tamanho_m2,
        preco,
        proprietario_nome,
        poligono_geojson,
        prioridade,
        cidade:cidades(nome)
      `)
      .not("poligono_geojson", "is", null);

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch glebas" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get app URL from request origin or use default
    const url = new URL(req.url);
    const appUrl = url.searchParams.get("app_url") || "https://id-preview--0050eb8f-48d2-48db-a3d1-51a30000b8b0.lovable.app";

    const kml = generateKml(glebas || [], appUrl);

    return new Response(kml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.google-earth.kml+xml",
        "Content-Disposition": 'inline; filename="glebas.kml"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error generating KML:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
