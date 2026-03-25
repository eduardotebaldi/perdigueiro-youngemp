import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function validateAccessToken(req: Request, supabase: any): Promise<boolean> {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return false;
  const { data } = await supabase
    .from("system_config")
    .select("value")
    .eq("key", "kml_access_token")
    .single();
  if (!data?.value) return false;
  return token === data.value;
}

// Status colors for Google Earth (AABBGGRR format)
const STATUS_STYLES: Record<string, { fill: string; line: string; label: string }> = {
  identificada: { fill: "600000ff", line: "ff0000ff", label: "Identificada" },
  informacoes_recebidas: { fill: "6000a5ff", line: "ff00a5ff", label: "Informações Recebidas" },
  visita_realizada: { fill: "6000ffff", line: "ff00ffff", label: "Visita Realizada" },
  proposta_enviada: { fill: "60ff0000", line: "ffff0000", label: "Proposta Enviada" },
  protocolo_assinado: { fill: "6000ff00", line: "ff00ff00", label: "Protocolo Assinado" },
  descartada: { fill: "60808080", line: "ff808080", label: "Descartada" },
  proposta_recusada: { fill: "600000aa", line: "ff0000aa", label: "Proposta Recusada" },
  negocio_fechado: { fill: "6000aa00", line: "ff00aa00", label: "Negócio Fechado" },
  standby: { fill: "60aa00aa", line: "ffaa00aa", label: "Standby" },
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

interface PesquisaTerreno {
  id: string;
  nome: string;
  preco: number | null;
  tamanho_m2: number | null;
  condicoes_pagamento: string | null;
  tipo_terreno: string | null;
  observacoes: string | null;
  url_anuncio: string | null;
  latitude: number | null;
  longitude: number | null;
  pesquisa: { nome: string; data_pesquisa: string; cidade?: { nome: string } | null } | null;
}

function formatCurrency(value: number | null): string {
  if (value === null) return "Não informado";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatArea(value: number | null): string {
  if (value === null) return "Não informado";
  return new Intl.NumberFormat("pt-BR").format(value) + " m²";
}

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function formatPermuta(value: string | null): string {
  if (value === "sim") return "Sim";
  if (value === "nao") return "Não";
  return "Incerto";
}

function geoJsonToKmlCoordinates(geojson: any): { coordinates: string; type: string } | null {
  if (!geojson) return null;
  try {
    if (geojson.type === "FeatureCollection" && geojson.features?.length > 0) return geoJsonToKmlCoordinates(geojson.features[0]);
    if (geojson.type === "Feature" && geojson.geometry) return geoJsonToKmlCoordinates(geojson.geometry);
    if (geojson.type === "Polygon" && geojson.coordinates?.[0]) {
      const coords = geojson.coordinates[0].map((c: number[]) => `${c[0]},${c[1]},0`).join(" ");
      return { coordinates: coords, type: "Polygon" };
    }
    if (geojson.type === "Point" && geojson.coordinates) {
      return { coordinates: `${geojson.coordinates[0]},${geojson.coordinates[1]},0`, type: "Point" };
    }
    if (geojson.type === "MultiPolygon" && geojson.coordinates?.[0]?.[0]) {
      const coords = geojson.coordinates[0][0].map((c: number[]) => `${c[0]},${c[1]},0`).join(" ");
      return { coordinates: coords, type: "Polygon" };
    }
    return null;
  } catch { return null; }
}

// ── Gleba KML generation ──

function generateGlebaDescription(gleba: Gleba, appUrl: string): string {
  const style = STATUS_STYLES[gleba.status] || { label: gleba.status };
  const detailsUrl = `${appUrl}/glebas?id=${gleba.id}`;
  return `<![CDATA[
    <div style="font-family: Arial, sans-serif; max-width: 320px; padding: 10px;">
      <h2 style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 18px; border-bottom: 2px solid #FE5009; padding-bottom: 8px;">
        ${gleba.numero ? `#${gleba.numero} - ` : ""}${escapeXml(gleba.apelido)}
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr><td style="padding: 6px 0; color: #666; font-size: 13px;">Status:</td><td style="padding: 6px 0; font-weight: bold; font-size: 13px;">${style.label}</td></tr>
        ${gleba.cidade ? `<tr><td style="padding: 6px 0; color: #666; font-size: 13px;">Cidade:</td><td style="padding: 6px 0; font-size: 13px;">${escapeXml(gleba.cidade.nome)}</td></tr>` : ""}
        <tr><td style="padding: 6px 0; color: #666; font-size: 13px;">Área:</td><td style="padding: 6px 0; font-size: 13px;">${formatArea(gleba.tamanho_m2)}</td></tr>
        <tr><td style="padding: 6px 0; color: #666; font-size: 13px;">Valor:</td><td style="padding: 6px 0; font-weight: bold; font-size: 13px;">${formatCurrency(gleba.preco)}</td></tr>
        ${gleba.proprietario_nome ? `<tr><td style="padding: 6px 0; color: #666; font-size: 13px;">Proprietário:</td><td style="padding: 6px 0; font-size: 13px;">${escapeXml(gleba.proprietario_nome)}</td></tr>` : ""}
        <tr><td style="padding: 6px 0; color: #666; font-size: 13px;">Aceita Permuta:</td><td style="padding: 6px 0; font-size: 13px;">${formatPermuta(gleba.aceita_permuta)}</td></tr>
      </table>
      ${gleba.comentarios ? `<div style="margin-bottom: 12px; padding: 10px; background: #f5f5f5; border-radius: 6px; border-left: 3px solid #FE5009;"><div style="color: #666; font-size: 11px; margin-bottom: 4px;">Informações da Gleba:</div><div style="font-size: 13px; color: #333;">${escapeXml(gleba.comentarios)}</div></div>` : ""}
      ${gleba.prioridade ? `<div style="margin-bottom: 12px; color: #ff6600; font-weight: bold; font-size: 14px;">⭐ Gleba Prioritária</div>` : ""}
      <div style="text-align: center; margin-top: 15px;">
        <a href="${detailsUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #FE5009 0%, #ff6b2b 100%); color: white; padding: 10px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">🔗 Abrir no Sistema</a>
      </div>
    </div>
  ]]>`;
}

function generateGlebaStyles(): string {
  let styles = "";
  for (const [status, { fill, line }] of Object.entries(STATUS_STYLES)) {
    styles += `
    <Style id="style_${status}">
      <PolyStyle><color>${fill}</color><fill>1</fill><outline>1</outline></PolyStyle>
      <LineStyle><color>${line}</color><width>2</width></LineStyle>
      <IconStyle><color>${line}</color><scale>1.0</scale></IconStyle>
      <BalloonStyle><bgColor>ffffffff</bgColor><textColor>ff000000</textColor></BalloonStyle>
    </Style>`;
  }
  return styles;
}

function generateGlebaPlacemarks(glebas: Gleba[], appUrl: string): string {
  return glebas
    .filter((g) => g.poligono_geojson)
    .map((gleba) => {
      const result = geoJsonToKmlCoordinates(gleba.poligono_geojson);
      if (!result) return "";
      const { coordinates, type } = result;
      const geometry = type === "Polygon"
        ? `<Polygon><extrude>0</extrude><altitudeMode>clampToGround</altitudeMode><outerBoundaryIs><LinearRing><coordinates>${coordinates}</coordinates></LinearRing></outerBoundaryIs></Polygon>`
        : `<Point><altitudeMode>clampToGround</altitudeMode><coordinates>${coordinates}</coordinates></Point>`;
      const title = gleba.numero ? `#${gleba.numero} - ${gleba.apelido}` : gleba.apelido;
      return `
    <Placemark id="${gleba.id}">
      <name>${escapeXml(title)}</name>
      <description>${generateGlebaDescription(gleba, appUrl)}</description>
      <styleUrl>#style_${gleba.status}</styleUrl>
      ${geometry}
    </Placemark>`;
    })
    .join("\n");
}

// ── Pesquisa de Mercado KML generation ──

function generatePesquisaDescription(terreno: PesquisaTerreno): string {
  const precoM2 = terreno.preco && terreno.tamanho_m2 && terreno.tamanho_m2 > 0
    ? (terreno.preco / terreno.tamanho_m2)
    : null;

  return `<![CDATA[
    <div style="font-family: Arial, sans-serif; max-width: 320px; padding: 10px;">
      <h2 style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 18px; border-bottom: 2px solid #2563EB; padding-bottom: 8px;">
        📍 ${escapeXml(terreno.nome)}
      </h2>
      ${terreno.pesquisa ? `<div style="font-size: 12px; color: #666; margin-bottom: 10px;">${escapeXml(terreno.pesquisa.nome)}${terreno.pesquisa.cidade ? ` — ${escapeXml(terreno.pesquisa.cidade.nome)}` : ""}</div>` : ""}
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <tr><td style="padding: 6px 0; color: #666; font-size: 13px;">Preço:</td><td style="padding: 6px 0; font-weight: bold; font-size: 13px;">${formatCurrency(terreno.preco)}</td></tr>
        <tr><td style="padding: 6px 0; color: #666; font-size: 13px;">Área:</td><td style="padding: 6px 0; font-size: 13px;">${formatArea(terreno.tamanho_m2)}</td></tr>
        ${precoM2 ? `<tr><td style="padding: 6px 0; color: #666; font-size: 13px;">R$/m²:</td><td style="padding: 6px 0; font-weight: bold; color: #2563EB; font-size: 13px;">${formatCurrency(precoM2)}</td></tr>` : ""}
        ${terreno.condicoes_pagamento ? `<tr><td style="padding: 6px 0; color: #666; font-size: 13px;">Condições:</td><td style="padding: 6px 0; font-size: 13px;">${escapeXml(terreno.condicoes_pagamento)}</td></tr>` : ""}
        ${terreno.tipo_terreno ? `<tr><td style="padding: 6px 0; color: #666; font-size: 13px;">Tipo:</td><td style="padding: 6px 0; font-size: 13px;">${escapeXml(terreno.tipo_terreno)}</td></tr>` : ""}
      </table>
      ${terreno.observacoes ? `<div style="margin-bottom: 12px; padding: 10px; background: #EFF6FF; border-radius: 6px; border-left: 3px solid #2563EB;"><div style="color: #666; font-size: 11px; margin-bottom: 4px;">Observações:</div><div style="font-size: 13px; color: #333;">${escapeXml(terreno.observacoes)}</div></div>` : ""}
      ${terreno.url_anuncio ? `<div style="text-align: center; margin-top: 15px;"><a href="${escapeXml(terreno.url_anuncio)}" target="_blank" style="display: inline-block; background: #2563EB; color: white; padding: 8px 20px; text-decoration: none; border-radius: 6px; font-size: 13px;">🔗 Ver Anúncio</a></div>` : ""}
    </div>
  ]]>`;
}

function generatePesquisaPlacemarks(terrenos: PesquisaTerreno[]): string {
  return terrenos
    .filter((t) => t.latitude && t.longitude)
    .map((t) => `
    <Placemark id="pm_${t.id}">
      <name>${escapeXml(t.nome)}</name>
      <description>${generatePesquisaDescription(t)}</description>
      <styleUrl>#style_pesquisa_pin</styleUrl>
      <Point><altitudeMode>clampToGround</altitudeMode><coordinates>${t.longitude},${t.latitude},0</coordinates></Point>
    </Placemark>`)
    .join("\n");
}

// ── KML Document builders ──

function buildGlebasKml(glebas: Gleba[], appUrl: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <NetworkLinkControl>
    <minRefreshPeriod>60</minRefreshPeriod>
    <maxSessionLength>-1</maxSessionLength>
    <message>Glebas atualizadas em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</message>
    <linkName>Glebas - Young Empreendimentos</linkName>
  </NetworkLinkControl>
  <Document>
    <name>Glebas - Young Empreendimentos</name>
    <description>Mapa de glebas mapeadas pelo sistema.</description>
    <open>1</open>
    ${generateGlebaStyles()}
    <Folder><name>Glebas</name><open>1</open>
      ${generateGlebaPlacemarks(glebas, appUrl)}
    </Folder>
  </Document>
</kml>`;
}

function buildPesquisaKml(terrenos: PesquisaTerreno[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <NetworkLinkControl>
    <minRefreshPeriod>60</minRefreshPeriod>
    <maxSessionLength>-1</maxSessionLength>
    <message>Pesquisa de mercado atualizada em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</message>
    <linkName>Pesquisa de Mercado - Young Empreendimentos</linkName>
  </NetworkLinkControl>
  <Document>
    <name>Pesquisa de Mercado</name>
    <description>Terrenos concorrentes mapeados para análise de viabilidade.</description>
    <open>1</open>
    <Style id="style_pesquisa_pin">
      <IconStyle>
        <color>ffEB6325</color>
        <scale>1.1</scale>
        <Icon><href>http://maps.google.com/mapfiles/kml/paddle/blu-blank.png</href></Icon>
      </IconStyle>
      <BalloonStyle><bgColor>ffffffff</bgColor><textColor>ff000000</textColor></BalloonStyle>
    </Style>
    <Folder><name>Pesquisa de Mercado</name><open>1</open>
      ${generatePesquisaPlacemarks(terrenos)}
    </Folder>
  </Document>
</kml>`;
}

function buildAllKml(glebas: Gleba[], terrenos: PesquisaTerreno[], appUrl: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <NetworkLinkControl>
    <minRefreshPeriod>60</minRefreshPeriod>
    <maxSessionLength>-1</maxSessionLength>
    <message>Dados atualizados em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</message>
    <linkName>Perdigueiro - Young Empreendimentos</linkName>
  </NetworkLinkControl>
  <Document>
    <name>Perdigueiro - Young Empreendimentos</name>
    <open>1</open>
    ${generateGlebaStyles()}
    <Style id="style_pesquisa_pin">
      <IconStyle>
        <color>ffEB6325</color>
        <scale>1.1</scale>
        <Icon><href>http://maps.google.com/mapfiles/kml/paddle/blu-blank.png</href></Icon>
      </IconStyle>
      <BalloonStyle><bgColor>ffffffff</bgColor><textColor>ff000000</textColor></BalloonStyle>
    </Style>
    <Folder><name>Glebas</name><open>1</open>
      ${generateGlebaPlacemarks(glebas, appUrl)}
    </Folder>
    <Folder><name>Pesquisa de Mercado</name><open>0</open>
      ${generatePesquisaPlacemarks(terrenos)}
    </Folder>
  </Document>
</kml>`;
}

// ── Server ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const isAuthorized = await validateAccessToken(req, supabase);
    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const layer = url.searchParams.get("layer") || "glebas";
    const appUrl = url.searchParams.get("app_url") || "https://id-preview--0050eb8f-48d2-48db-a3d1-51a30000b8b0.lovable.app";

    let kml = "";

    if (layer === "glebas" || layer === "all") {
      const { data: glebas, error } = await supabase
        .from("glebas")
        .select("id, numero, apelido, status, tamanho_m2, preco, proprietario_nome, poligono_geojson, prioridade, aceita_permuta, comentarios, cidade:cidades(nome)")
        .not("poligono_geojson", "is", null);
      if (error) throw error;

      if (layer === "glebas") {
        kml = buildGlebasKml(glebas || [], appUrl);
      } else {
        // layer === "all", fetch pesquisa too
        const { data: terrenos, error: err2 } = await supabase
          .from("pesquisa_mercado_terrenos")
          .select("*, pesquisa:pesquisas_mercado(nome, data_pesquisa, cidade:cidades(nome))")
          .not("latitude", "is", null)
          .not("longitude", "is", null);
        if (err2) throw err2;
        kml = buildAllKml(glebas || [], terrenos || [], appUrl);
      }
    } else if (layer === "pesquisa") {
      const { data: terrenos, error } = await supabase
        .from("pesquisa_mercado_terrenos")
        .select("*, pesquisa:pesquisas_mercado(nome, data_pesquisa, cidade:cidades(nome))")
        .not("latitude", "is", null)
        .not("longitude", "is", null);
      if (error) throw error;
      kml = buildPesquisaKml(terrenos || []);
    } else {
      kml = buildGlebasKml([], appUrl);
    }

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
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
