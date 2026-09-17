import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/server-auth";

export const maxDuration = 120; // 2 minutes timeout for large file uploads

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "application/rtf",
]);

const ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf"]);

export async function POST(request: Request) {
  try {
    const auth = await requireStaff();
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const supabaseAdmin = getAdminClient();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string || "").trim();
    const description = (formData.get("description") as string || "").trim();

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "Document title is required" }, { status: 400 });
    }

    // Validate file extension and MIME type
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.has(fileExt)) {
      return NextResponse.json(
        { error: `File extension .${fileExt} is not permitted. Only documents (PDF, DOCX, XLSX, PPTX, TXT) are accepted.` },
        { status: 400 }
      );
    }

    if (file.type && !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: `File MIME type (${file.type}) is not permitted.` },
        { status: 400 }
      );
    }

    // 100MB file size safeguard on API layer
    const MAX_SIZE_BYTES = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File size exceeds 100MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB)` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename and create unique storage path
    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `uploads/${timestamp}-${cleanName}`;

    // Upload to Supabase Storage "documents" bucket
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("documents")
      .upload(filePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      const isSizeError = 
        (uploadError as any).statusCode === "413" || 
        uploadError.message?.toLowerCase().includes("exceeded the maximum allowed size") ||
        uploadError.message?.toLowerCase().includes("too large");

      if (isSizeError) {
        return NextResponse.json(
          { 
            error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum allowed by the Supabase Free tier (50MB). Please compress the document below 50MB, or upgrade the Supabase project to Pro to support up to 5GB files.` 
          },
          { status: 413 }
        );
      }

      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Retrieve the permanent public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("documents")
      .getPublicUrl(filePath);

    const fileUrl = urlData.publicUrl;
    const fileType = file.name.split(".").pop()?.toUpperCase() || "DOCUMENT";

    // Insert record into official_documents
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from("official_documents")
      .insert([
        {
          title,
          description: description || null,
          file_url: fileUrl,
          file_type: fileType,
          file_size_bytes: file.size,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error("Database insert error:", dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      document: dbData,
      secure_url: fileUrl,
    });
  } catch (error: any) {
    console.error("Document upload API error:", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred during document upload." },
      { status: 500 }
    );
  }
}
