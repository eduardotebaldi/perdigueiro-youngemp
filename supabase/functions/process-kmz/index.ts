import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessKmzRequest {
  kmzUrl: string;
  glebaApelido: string;
}

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

// Create a JWT token for Google API authentication
async function getGoogleAccessToken(credentials: ServiceAccountCredentials): Promise<string> {
  // Clean the private key - handle escaped newlines
  const privateKeyPem = credentials.private_key.replace(/\\n/g, '\n');
  
  // Parse the PEM key
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = privateKeyPem
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s/g, "");
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  // Import the key for RS256
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Create JWT
  const jwt = await create(
    { alg: "RS256", typ: "JWT" },
    {
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/drive.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: getNumericDate(0),
      exp: getNumericDate(60 * 60), // 1 hour
    },
    cryptoKey
  );

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Download file using Google Drive API
async function downloadFromDriveApi(fileId: string, accessToken: string): Promise<Uint8Array> {
  console.log(`Downloading file ${fileId} via Google Drive API...`);
  
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    
    // Check if this is a non-binary file (shortcut, Google Doc, etc.)
    if (errorText.includes("fileNotDownloadable") || errorText.includes("Only files with binary content")) {
      throw new Error("NOT_A_BINARY_FILE");
    }
    
    throw new Error(`Drive API error: ${response.status} - ${errorText}`);
  }

  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

// Try to download with API first, then public
async function downloadKmzFile(
  kmzUrl: string, 
  fileId: string | null,
  credentials: ServiceAccountCredentials | null
): Promise<Uint8Array | null> {
  
  // If we have a file ID and credentials, try API first (more reliable)
  if (fileId && credentials) {
    try {
      const accessToken = await getGoogleAccessToken(credentials);
      return await downloadFromDriveApi(fileId, accessToken);
    } catch (apiError: any) {
      // If the file is not a binary (it's a shortcut or Google Doc), return null
      if (apiError.message === "NOT_A_BINARY_FILE") {
        console.log(`File ${fileId} is not a binary file (shortcut or Google Doc). Skipping.`);
        return null;
      }
      console.log(`Drive API failed: ${apiError.message}, trying public download...`);
    }
  }

  // Try public download
  const downloadUrl = fileId 
    ? `https://drive.google.com/uc?export=download&id=${fileId}`
    : kmzUrl;
  
  console.log(`Trying public download: ${downloadUrl}`);
  
  let response = await fetch(downloadUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    redirect: 'follow',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to download KMZ: ${response.status} - ${response.statusText}`);
  }

  let buffer = await response.arrayBuffer();
  let bytes = new Uint8Array(buffer);

  // Check if we got HTML (confirmation page)
  const textDecoder = new TextDecoder();
  const firstBytes = textDecoder.decode(bytes.slice(0, 500));
  
  if (firstBytes.includes("<!DOCTYPE") || firstBytes.includes("<html")) {
    console.log("Got HTML confirmation page...");
    
    if (fileId) {
      // Try confirm=1
      const confirmUrl = `https://drive.google.com/uc?export=download&confirm=1&id=${fileId}`;
      console.log(`Trying confirm URL: ${confirmUrl}`);
      
      response = await fetch(confirmUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        redirect: 'follow',
      });
      
      if (response.ok) {
        buffer = await response.arrayBuffer();
        bytes = new Uint8Array(buffer);
        
        const checkBytes = textDecoder.decode(bytes.slice(0, 500));
        if (!checkBytes.includes("<!DOCTYPE") && !checkBytes.includes("<html")) {
          return bytes; // Success!
        }
      }
      
      // Last resort: try API if we have credentials
      if (credentials) {
        console.log("Falling back to Drive API...");
        const accessToken = await getGoogleAccessToken(credentials);
        return await downloadFromDriveApi(fileId, accessToken);
      }
      
      throw new Error("Não foi possível baixar o arquivo. Verifique se o arquivo está compartilhado com a Service Account.");
    }
    
    throw new Error("Received HTML instead of KMZ file. The URL may not be a valid direct download link.");
  }

  return bytes;
}

// Simple KML parser using regex (works in Deno Edge Functions without DOMParser)
function parseKmlCoordinates(kmlContent: string): any {
  // Find coordinates element using regex
  const coordsMatch = kmlContent.match(/<coordinates[^>]*>([\s\S]*?)<\/coordinates>/i);
  
  if (!coordsMatch || !coordsMatch[1]) {
    console.log("No coordinates found in KML");
    return null;
  }

  const coordsText = coordsMatch[1].trim();
  const coordPairs = coordsText.split(/\s+/).filter(Boolean);
  
  if (coordPairs.length === 0) {
    console.log("Empty coordinates in KML");
    return null;
  }

  const coordinates = coordPairs.map((pair) => {
    const [lon, lat] = pair.split(",").map(Number);
    return [lon, lat];
  }).filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]));

  if (coordinates.length === 0) {
    console.log("No valid coordinates parsed");
    return null;
  }

  console.log(`Parsed ${coordinates.length} coordinates`);

  // Determine geometry type
  const isPolygon = coordinates.length > 2 && 
    coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
    coordinates[0][1] === coordinates[coordinates.length - 1][1];

  if (isPolygon) {
    return {
      type: "Polygon",
      coordinates: [coordinates],
    };
  } else if (coordinates.length > 1) {
    return {
      type: "LineString",
      coordinates: coordinates,
    };
  } else if (coordinates.length === 1) {
    return {
      type: "Point",
      coordinates: coordinates[0],
    };
  }

  return null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { kmzUrl, glebaApelido }: ProcessKmzRequest = await req.json();

    if (!kmzUrl) {
      return new Response(
        JSON.stringify({ error: "kmzUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate that it's actually a URL, not just a filename
    if (!kmzUrl.startsWith("http://") && !kmzUrl.startsWith("https://")) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "not_a_url",
          message: `'${kmzUrl}' is a filename, not a URL. Skipping.` 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing KMZ from: ${kmzUrl}`);

    // Get Service Account credentials if available
    let credentials: ServiceAccountCredentials | null = null;
    try {
      const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
      if (serviceAccountJson) {
        credentials = JSON.parse(serviceAccountJson);
        console.log(`Using Service Account: ${credentials?.client_email}`);
      }
    } catch (e) {
      console.log("No valid Service Account credentials found, will try public download");
    }

    // Extract file ID from Google Drive URLs
    const drivePatterns = [
      /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
      /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
      /docs\.google\.com\/.*\/d\/([a-zA-Z0-9_-]+)/,
    ];
    
    let fileId: string | null = null;
    for (const pattern of drivePatterns) {
      const match = kmzUrl.match(pattern);
      if (match) {
        fileId = match[1];
        console.log(`Extracted file ID: ${fileId}`);
        break;
      }
    }

    // Download the KMZ file
    const kmzBytes = await downloadKmzFile(kmzUrl, fileId, credentials);

    // If the file couldn't be downloaded (e.g., it's a shortcut or Google Doc)
    if (!kmzBytes) {
      console.log("File is not a binary file (shortcut or Google Doc). Returning success without polygon.");
      return new Response(
        JSON.stringify({
          success: true,
          geojson: null,
          kmzStoragePath: null,
          kmzPublicUrl: null,
          warning: "O arquivo não é um KMZ válido (pode ser um atalho ou documento do Google)."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate it's a ZIP file (KMZ starts with PK)
    if (kmzBytes[0] !== 0x50 || kmzBytes[1] !== 0x4B) {
      console.error("File does not start with PK signature. First bytes:", kmzBytes.slice(0, 20));
      throw new Error("Downloaded file is not a valid KMZ/ZIP file.");

    console.log("KMZ file validated, extracting...");

    // Unzip the KMZ to get KML
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(kmzBytes);
    
    // Find the KML file inside the KMZ
    let kmlContent: string | null = null;
    for (const filename of Object.keys(zipContent.files)) {
      console.log(`Found file in KMZ: ${filename}`);
      if (filename.endsWith(".kml")) {
        kmlContent = await zipContent.files[filename].async("string");
        console.log(`KML content length: ${kmlContent.length}`);
        break;
      }
    }

    if (!kmlContent) {
      throw new Error("No KML file found inside KMZ");
    }

    // Parse KML to extract coordinates using simple regex parser
    const geojson = parseKmlCoordinates(kmlContent);

    if (geojson) {
      console.log(`Successfully extracted ${geojson.type} geometry`);
    } else {
      console.log("No geometry extracted from KML");
    }

    // Upload the original KMZ file to storage
    const sanitizedApelido = glebaApelido
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 50);
    
    const fileName = `${sanitizedApelido}-${Date.now()}.kmz`;
    
    const { error: uploadError } = await supabase.storage
      .from("glebas-kmz")
      .upload(fileName, kmzBytes, {
        contentType: "application/vnd.google-earth.kmz",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload KMZ: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("glebas-kmz")
      .getPublicUrl(fileName);

    return new Response(
      JSON.stringify({
        success: true,
        geojson,
        kmzStoragePath: fileName,
        kmzPublicUrl: urlData.publicUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error processing KMZ:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
