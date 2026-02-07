import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GoogleCredentials {
  client_email: string;
  private_key: string;
  token_uri: string;
}

interface PlacemarkData {
  name: string;
  kmlId: string | null;
  coordinates: string;
  geometryType: "Point" | "Polygon" | "LineString";
}

// Gerar JWT para autenticação com Google
async function getGoogleAccessToken(
  credentials: GoogleCredentials
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600;

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: credentials.token_uri,
    exp,
    iat: now,
  };

  // Encode header and payload
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const payloadB64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const signInput = `${headerB64}.${payloadB64}`;

  // Import private key and sign
  const privateKeyPem = credentials.private_key;
  const pemContents = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${signInput}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch(credentials.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to get Google access token: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Baixar arquivo do Google Drive
async function downloadDriveFile(
  fileId: string,
  accessToken: string
): Promise<string> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to download file: ${error}`);
  }

  return response.text();
}

// Parse KML e extrair Placemarks
function parseKmlPlacemarks(kmlContent: string): PlacemarkData[] {
  const placemarks: PlacemarkData[] = [];

  // Regex para encontrar Placemarks
  const placemarkRegex =
    /<Placemark[^>]*>([\s\S]*?)<\/Placemark>/gi;
  let match;

  while ((match = placemarkRegex.exec(kmlContent)) !== null) {
    const placemarkContent = match[1];

    // Extrair nome
    const nameMatch = /<name>([^<]*)<\/name>/i.exec(placemarkContent);
    const name = nameMatch ? nameMatch[1].trim() : "Sem nome";

    // Extrair ID (do atributo id ou do ExtendedData)
    const idAttrMatch = /id="([^"]+)"/i.exec(match[0]);
    const extendedIdMatch =
      /<SimpleData name="id">([^<]*)<\/SimpleData>/i.exec(placemarkContent);
    const kmlId = idAttrMatch?.[1] || extendedIdMatch?.[1] || null;

    // Extrair coordenadas (Polygon, Point ou LineString)
    let coordinates = "";
    let geometryType: "Point" | "Polygon" | "LineString" = "Point";

    const polygonMatch =
      /<Polygon[\s\S]*?<coordinates>([^<]*)<\/coordinates>/i.exec(
        placemarkContent
      );
    const pointMatch =
      /<Point[\s\S]*?<coordinates>([^<]*)<\/coordinates>/i.exec(
        placemarkContent
      );
    const lineMatch =
      /<LineString[\s\S]*?<coordinates>([^<]*)<\/coordinates>/i.exec(
        placemarkContent
      );

    if (polygonMatch) {
      coordinates = polygonMatch[1].trim();
      geometryType = "Polygon";
    } else if (lineMatch) {
      coordinates = lineMatch[1].trim();
      geometryType = "LineString";
    } else if (pointMatch) {
      coordinates = pointMatch[1].trim();
      geometryType = "Point";
    }

    if (coordinates) {
      placemarks.push({ name, kmlId, coordinates, geometryType });
    }
  }

  return placemarks;
}

// Converter coordenadas KML para GeoJSON
function kmlToGeoJson(
  coordinates: string,
  geometryType: "Point" | "Polygon" | "LineString"
): object {
  const coords = coordinates
    .split(/\s+/)
    .filter((c) => c.trim())
    .map((coord) => {
      const [lng, lat] = coord.split(",").map(Number);
      return [lng, lat];
    });

  if (geometryType === "Point") {
    return {
      type: "Point",
      coordinates: coords[0],
    };
  } else if (geometryType === "Polygon") {
    return {
      type: "Polygon",
      coordinates: [coords],
    };
  } else {
    return {
      type: "LineString",
      coordinates: coords,
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase com service role para cron jobs
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Verificar se é chamada de cron (sem auth) ou de usuário
    const authHeader = req.headers.get("Authorization");
    const isCronCall = !authHeader || authHeader === `Bearer ${supabaseAnonKey}`;
    
    let supabase;
    if (isCronCall) {
      // Cron job: usar service role
      supabase = createClient(supabaseUrl, supabaseServiceKey);
    } else {
      // Usuário: verificar autenticação
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      
      // Verificar usuário
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Obter fileId: do body ou da configuração do sistema
    let fileId: string | null = null;
    
    try {
      const body = await req.json();
      fileId = body?.fileId || null;
    } catch {
      // Body vazio ou inválido, buscar da config
    }
    
    // Se não veio fileId, buscar da tabela system_config
    if (!fileId) {
      const { data: configData, error: configError } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "google_drive_kml_file_id")
        .single();
      
      if (configError || !configData?.value) {
        return new Response(
          JSON.stringify({ 
            error: "File ID não configurado. Configure em system_config com key 'google_drive_kml_file_id'" 
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      fileId = configData.value;
    }

    // Carregar credenciais do Google
    const googleCredsJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    if (!googleCredsJson) {
      return new Response(
        JSON.stringify({ error: "Google credentials not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const credentials: GoogleCredentials = JSON.parse(googleCredsJson);

    // Obter access token do Google
    const accessToken = await getGoogleAccessToken(credentials);

    // Baixar arquivo KML do Drive
    const kmlContent = await downloadDriveFile(fileId, accessToken);

    // Parse placemarks
    const placemarks = parseKmlPlacemarks(kmlContent);

    if (placemarks.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No placemarks found in the file",
          imported: 0,
          updated: 0,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let imported = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const placemark of placemarks) {
      try {
        const geoJson = kmlToGeoJson(
          placemark.coordinates,
          placemark.geometryType
        );

        // Tentar encontrar gleba existente por kml_id ou nome
        const { data: existing } = await supabase
          .from("glebas")
          .select("id, kml_id")
          .or(
            placemark.kmlId
              ? `kml_id.eq.${placemark.kmlId},apelido.eq.${placemark.name}`
              : `apelido.eq.${placemark.name}`
          )
          .limit(1)
          .single();

        if (existing) {
          // Atualizar apenas geometria
          const { error: updateError } = await supabase
            .from("glebas")
            .update({
              poligono_geojson: geoJson,
              google_drive_file_id: fileId,
              last_sync_at: new Date().toISOString(),
              kml_id: placemark.kmlId || existing.kml_id,
            })
            .eq("id", existing.id);

          if (updateError) {
            errors.push(`Update failed for ${placemark.name}: ${updateError.message}`);
          } else {
            updated++;
          }
        } else {
          // Criar nova gleba
          const { error: insertError } = await supabase.from("glebas").insert({
            apelido: placemark.name,
            status: "identificada",
            poligono_geojson: geoJson,
            kml_id: placemark.kmlId,
            google_drive_file_id: fileId,
            last_sync_at: new Date().toISOString(),
          });

          if (insertError) {
            errors.push(`Insert failed for ${placemark.name}: ${insertError.message}`);
          } else {
            imported++;
          }
        }
      } catch (err) {
        errors.push(`Error processing ${placemark.name}: ${err.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sync completed: ${imported} imported, ${updated} updated`,
        imported,
        updated,
        total: placemarks.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
