import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  token_uri: string;
}

async function getAccessToken(creds: ServiceAccountCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = btoa(JSON.stringify({
    iss: creds.client_email,
    scope: "https://www.googleapis.com/auth/drive",
    aud: creds.token_uri,
    exp: now + 3600,
    iat: now,
  }));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(creds.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${header}.${claim}`)
  );

  const jwt = `${header}.${claim}.${arrayBufferToBase64Url(signature)}`;

  const resp = await fetch(creds.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(`Token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

function arrayBufferToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function findOrCreateFolder(
  token: string,
  name: string,
  parentId: string
): Promise<string> {
  // Search for existing folder
  const q = `name='${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const searchResp = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const searchData = await searchResp.json();

  if (searchData.files?.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder
  const createResp = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    }),
  });
  const createData = await createResp.json();
  if (!createResp.ok) throw new Error(`Failed to create folder: ${JSON.stringify(createData)}`);
  return createData.id;
}

async function navigateOrCreatePath(
  token: string,
  rootFolderId: string,
  pathParts: string[]
): Promise<string> {
  let currentId = rootFolderId;
  for (const part of pathParts) {
    currentId = await findOrCreateFolder(token, part, currentId);
  }
  return currentId;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get service account credentials
    const saJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    if (!saJson) {
      return new Response(JSON.stringify({ error: "Google Service Account not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const creds: ServiceAccountCredentials = JSON.parse(saJson);

    // Get root folder ID from system_config
    const { data: configData } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "google_drive_root_folder_id")
      .single();

    if (!configData?.value) {
      return new Response(JSON.stringify({ error: "Google Drive root folder not configured. Set 'google_drive_root_folder_id' in system_config." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rootFolderId = configData.value;
    const token = await getAccessToken(creds);

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const glebaId = formData.get("gleba_id") as string;
    const uf = formData.get("uf") as string || "SP";
    const cidade = formData.get("cidade") as string || "Sem Cidade";
    const glebaName = formData.get("gleba_name") as string || "Gleba";

    if (!file || !glebaId) {
      return new Response(JSON.stringify({ error: "file and gleba_id are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Navigate/create folder structure: Projetos futuros > UF > Cidade > Gleba
    const folderId = await navigateOrCreatePath(token, rootFolderId, [
      "Projetos futuros",
      uf,
      cidade,
      glebaName,
    ]);

    // Save folder ID on gleba if not set
    const { data: glebaData } = await supabase
      .from("glebas")
      .select("google_drive_folder_id")
      .eq("id", glebaId)
      .single();

    if (!glebaData?.google_drive_folder_id) {
      await supabase
        .from("glebas")
        .update({ google_drive_folder_id: folderId } as any)
        .eq("id", glebaId);
    }

    // Upload file to Drive
    const fileBytes = await file.arrayBuffer();
    const metadata = JSON.stringify({
      name: file.name,
      parents: [folderId],
    });

    const boundary = "----UploadBoundary";
    const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${file.type || "application/octet-stream"}\r\n\r\n`;
    const bodyEnd = `\r\n--${boundary}--`;

    const bodyBytes = new Uint8Array([
      ...new TextEncoder().encode(body),
      ...new Uint8Array(fileBytes),
      ...new TextEncoder().encode(bodyEnd),
    ]);

    const uploadResp = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: bodyBytes,
      }
    );

    const uploadData = await uploadResp.json();
    if (!uploadResp.ok) {
      throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);
    }

    // Save reference in gleba_anexos
    const driveLink = uploadData.webViewLink || `https://drive.google.com/file/d/${uploadData.id}/view`;
    await supabase.from("gleba_anexos").insert({
      gleba_id: glebaId,
      tipo: "pesquisa_mercado" as any,
      arquivo: driveLink,
      nome_arquivo: file.name,
      created_by: user.id,
    });

    return new Response(JSON.stringify({
      success: true,
      file_id: uploadData.id,
      file_name: uploadData.name,
      web_view_link: driveLink,
      folder_id: folderId,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error uploading to Drive:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
