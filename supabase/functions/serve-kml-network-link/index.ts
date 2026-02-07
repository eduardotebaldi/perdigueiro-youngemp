import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Simple token-based authentication for Network Link access
async function validateAccessToken(req: Request, supabase: any): Promise<boolean> {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  
  if (!token) {
    return false;
  }
  
  // Get stored token from system_config
  const { data } = await supabase
    .from("system_config")
    .select("value")
    .eq("key", "kml_access_token")
    .single();
  
  if (!data?.value) {
    // If no token configured, deny access
    return false;
  }
  
  return token === data.value;
}

// Status colors for Google Earth (AABBGGRR format - Alpha, Blue, Green, Red)
const STATUS_STYLES: Record<string, { fill: string; line: string; label: string }> = {
  identificada: { fill: "800000ff", line: "ff0000ff", label: "Identificada" }, // Red
  informacoes_recebidas: { fill: "8000a5ff", line: "ff00a5ff", label: "Informações Recebidas" }, // Orange
  visita_realizada: { fill: "8000ffff", line: "ff00ffff", label: "Visita Realizada" }, // Yellow
  proposta_enviada: { fill: "80ff0000", line: "ffff0000", label: "Proposta Enviada" }, // Blue
  protocolo_assinado: { fill: "8000ff00", line: "ff00ff00", label: "Protocolo Assinado" }, // Green
  descartada: { fill: "80808080", line: "ff808080", label: "Descartada" }, // Gray
  proposta_recusada: { fill: "800000aa", line: "ff0000aa", label: "Proposta Recusada" }, // Dark Red
  negocio_fechado: { fill: "8000aa00", line: "ff00aa00", label: "Negócio Fechado" }, // Dark Green
  standby: { fill: "80aa00aa", line: "ffaa00aa", label: "Standby" }, // Purple
};

interface Gleba {
  id: string;
  numero: number | null;
  apelido: string;
  status: string;
  tamanho_m2: number | null;
  preco: number | null;
  proprietario_nome: string | null;
  poligono_geojson: any;
  prioridade: boolean;
  aceita_permuta: string | null;
  comentarios: string | null;
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

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatPermuta(value: string | null): string {
  if (value === "sim") return "Sim";
  if (value === "nao") return "Não";
  return "Incerto";
}

function generatePlacemarkDescription(gleba: Gleba, appUrl: string): string {
  const style = STATUS_STYLES[gleba.status] || { label: gleba.status };
  const detailsUrl = `${appUrl}/glebas?id=${gleba.id}`;

  return `<![CDATA[
    <div style="font-family: Arial, sans-serif; max-width: 320px; padding: 10px;">
      <h2 style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 18px; border-bottom: 2px solid #FE5009; padding-bottom: 8px;">
        ${gleba.numero ? `#${gleba.numero} - ` : ""}${escapeXml(gleba.apelido)}
      </h2>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr>
          <td style="padding: 6px 0; color: #666; font-size: 13px;">Status:</td>
          <td style="padding: 6px 0; font-weight: bold; font-size: 13px;">${style.label}</td>
        </tr>
        ${gleba.cidade ? `
        <tr>
          <td style="padding: 6px 0; color: #666; font-size: 13px;">Cidade:</td>
          <td style="padding: 6px 0; font-size: 13px;">${escapeXml(gleba.cidade.nome)}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 6px 0; color: #666; font-size: 13px;">Área:</td>
          <td style="padding: 6px 0; font-size: 13px;">${formatArea(gleba.tamanho_m2)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666; font-size: 13px;">Valor:</td>
          <td style="padding: 6px 0; font-weight: bold; font-size: 13px;">${formatCurrency(gleba.preco)}</td>
        </tr>
        ${gleba.proprietario_nome ? `
        <tr>
          <td style="padding: 6px 0; color: #666; font-size: 13px;">Proprietário:</td>
          <td style="padding: 6px 0; font-size: 13px;">${escapeXml(gleba.proprietario_nome)}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 6px 0; color: #666; font-size: 13px;">Aceita Permuta:</td>
          <td style="padding: 6px 0; font-size: 13px;">${formatPermuta(gleba.aceita_permuta)}</td>
        </tr>
      </table>
      
      ${gleba.comentarios ? `
      <div style="margin-bottom: 12px; padding: 10px; background: #f5f5f5; border-radius: 6px; border-left: 3px solid #FE5009;">
        <div style="color: #666; font-size: 11px; margin-bottom: 4px;">Comentários:</div>
        <div style="font-size: 13px; color: #333;">${escapeXml(gleba.comentarios)}</div>
      </div>` : ""}
      
      ${gleba.prioridade ? `<div style="margin-bottom: 12px; color: #ff6600; font-weight: bold; font-size: 14px;">⭐ Gleba Prioritária</div>` : ""}
      
      <div style="text-align: center; margin-top: 15px;">
        <a href="${detailsUrl}" target="_blank" style="
          display: inline-block;
          background: linear-gradient(135deg, #FE5009 0%, #ff6b2b 100%);
          color: white;
          padding: 10px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">🔗 Abrir no Sistema</a>
      </div>
    </div>
  ]]>`;
}

function generateGlobalStyles(): string {
  let styles = "";
  
  for (const [status, { fill, line, label }] of Object.entries(STATUS_STYLES)) {
    styles += `
    <Style id="style_${status}">
      <PolyStyle>
        <color>${fill}</color>
        <fill>1</fill>
        <outline>1</outline>
      </PolyStyle>
      <LineStyle>
        <color>${line}</color>
        <width>2</width>
      </LineStyle>
      <IconStyle>
        <color>${line}</color>
        <scale>1.0</scale>
      </IconStyle>
      <BalloonStyle>
        <bgColor>ffffffff</bgColor>
        <textColor>ff000000</textColor>
      </BalloonStyle>
    </Style>`;
  }
  
  return styles;
}

function generateKml(glebas: Gleba[], appUrl: string): string {
  const placemarks = glebas
    .filter((g) => g.poligono_geojson)
    .map((gleba) => {
      const result = geoJsonToKmlCoordinates(gleba.poligono_geojson);
      if (!result) return "";

      const { coordinates, type } = result;
      const styleId = `style_${gleba.status}`;

      const geometry = type === "Polygon"
        ? `<Polygon>
            <extrude>0</extrude>
            <altitudeMode>clampToGround</altitudeMode>
            <outerBoundaryIs>
              <LinearRing>
                <coordinates>${coordinates}</coordinates>
              </LinearRing>
            </outerBoundaryIs>
          </Polygon>`
        : `<Point>
            <altitudeMode>clampToGround</altitudeMode>
            <coordinates>${coordinates}</coordinates>
          </Point>`;

      const title = gleba.numero ? `#${gleba.numero} - ${gleba.apelido}` : gleba.apelido;
      
      return `
    <Placemark id="${gleba.id}">
      <name>${escapeXml(title)}</name>
      <description>${generatePlacemarkDescription(gleba, appUrl)}</description>
      <styleUrl>#${styleId}</styleUrl>
      ${geometry}
    </Placemark>`;
    })
    .join("\n");

  // Group glebas by status for folders
  const glebasByStatus: Record<string, Gleba[]> = {};
  for (const gleba of glebas) {
    if (!glebasByStatus[gleba.status]) {
      glebasByStatus[gleba.status] = [];
    }
    glebasByStatus[gleba.status].push(gleba);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <NetworkLinkControl>
    <minRefreshPeriod>60</minRefreshPeriod>
    <maxSessionLength>-1</maxSessionLength>
    <message>Glebas atualizadas em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</message>
    <linkName>Glebas - Young Empreendimentos</linkName>
    <linkDescription>Mapa de glebas com atualização automática a cada 60 segundos</linkDescription>
  </NetworkLinkControl>
  <Document>
    <name>Glebas - Young Empreendimentos</name>
    <description>Mapa de glebas mapeadas pelo sistema. Atualização automática ativada.</description>
    <open>1</open>
    
    ${generateGlobalStyles()}
    
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

    // Validate access token
    const isAuthorized = await validateAccessToken(req, supabase);
    if (!isAuthorized) {
      console.error("Unauthorized access attempt to KML endpoint");
      return new Response(
        JSON.stringify({ 
          error: "Unauthorized", 
          message: "Token de acesso inválido ou não configurado. Configure o token nas configurações do sistema." 
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch all glebas with geometry
    const { data: glebas, error } = await supabase
      .from("glebas")
      .select(`
        id,
        numero,
        apelido,
        status,
        tamanho_m2,
        preco,
        proprietario_nome,
        poligono_geojson,
        prioridade,
        aceita_permuta,
        comentarios,
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
