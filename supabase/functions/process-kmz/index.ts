import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessKmzRequest {
  kmzUrl: string;
  glebaApelido: string;
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

    // Convert Google Drive links to direct download URLs
    let downloadUrl = kmzUrl;
    
    // Handle various Google Drive URL formats
    const drivePatterns = [
      /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
      /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
      /docs\.google\.com\/.*\/d\/([a-zA-Z0-9_-]+)/,
    ];
    
    for (const pattern of drivePatterns) {
      const match = kmzUrl.match(pattern);
      if (match) {
        const fileId = match[1];
        downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        console.log(`Converted to direct download: ${downloadUrl}`);
        break;
      }
    }

    // Download the KMZ file
    const kmzResponse = await fetch(downloadUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      redirect: 'follow',
    });
    
    if (!kmzResponse.ok) {
      throw new Error(`Failed to download KMZ: ${kmzResponse.status} - ${kmzResponse.statusText}`);
    }

    const kmzBuffer = await kmzResponse.arrayBuffer();
    const kmzBytes = new Uint8Array(kmzBuffer);

    // Unzip the KMZ to get KML
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(kmzBytes);
    
    // Find the KML file inside the KMZ
    let kmlContent: string | null = null;
    for (const filename of Object.keys(zipContent.files)) {
      if (filename.endsWith(".kml")) {
        kmlContent = await zipContent.files[filename].async("string");
        break;
      }
    }

    if (!kmlContent) {
      throw new Error("No KML file found inside KMZ");
    }

    // Parse KML to extract coordinates
    const parser = new DOMParser();
    const doc = parser.parseFromString(kmlContent, "text/xml");
    
    if (!doc) {
      throw new Error("Failed to parse KML");
    }

    // Extract polygon coordinates
    const coordinatesElement = doc.querySelector("coordinates");
    let geojson: any = null;

    if (coordinatesElement) {
      const coordsText = coordinatesElement.textContent?.trim() || "";
      const coordPairs = coordsText.split(/\s+/).filter(Boolean);
      
      const coordinates = coordPairs.map((pair) => {
        const [lon, lat, alt] = pair.split(",").map(Number);
        return [lon, lat];
      });

      // Determine if it's a polygon (closed) or linestring
      const isPolygon = coordinates.length > 2 && 
        coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
        coordinates[0][1] === coordinates[coordinates.length - 1][1];

      if (isPolygon) {
        geojson = {
          type: "Polygon",
          coordinates: [coordinates],
        };
      } else if (coordinates.length > 1) {
        geojson = {
          type: "LineString",
          coordinates: coordinates,
        };
      } else if (coordinates.length === 1) {
        geojson = {
          type: "Point",
          coordinates: coordinates[0],
        };
      }
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
