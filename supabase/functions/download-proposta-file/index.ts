import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle Google Drive links
    let downloadUrl = url;
    if (url.includes("drive.google.com")) {
      // Extract file ID from various Google Drive URL formats
      let fileId: string | null = null;

      const idMatch = url.match(/[-\w]{25,}/);
      if (idMatch) {
        fileId = idMatch[0];
      }

      if (fileId) {
        downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
    }

    // Download the file
    const response = await fetch(downloadUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PropostaDownloader/1.0)",
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to download file: ${response.status}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const fileData = await response.arrayBuffer();

    // Determine file extension from content type or URL
    let extension = "pdf";
    if (contentType.includes("pdf")) {
      extension = "pdf";
    } else if (contentType.includes("powerpoint") || contentType.includes("presentation")) {
      extension = "pptx";
    } else if (contentType.includes("excel") || contentType.includes("spreadsheet")) {
      extension = "xlsx";
    } else if (contentType.includes("word") || contentType.includes("document")) {
      extension = "docx";
    } else {
      // Try to get extension from URL
      const urlPath = parsedUrl.pathname;
      const extMatch = urlPath.match(/\.(\w+)$/);
      if (extMatch) {
        extension = extMatch[1].toLowerCase();
      }
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `imported/${timestamp}-${randomStr}.${extension}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("propostas")
      .upload(fileName, fileData, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: `Failed to upload file: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("propostas").getPublicUrl(fileName);

    return new Response(
      JSON.stringify({
        success: true,
        filePath: urlData.publicUrl,
        fileName,
        contentType,
        size: fileData.byteLength,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
