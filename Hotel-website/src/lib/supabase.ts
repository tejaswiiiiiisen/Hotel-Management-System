/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

let rawUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
// Strip trailing /rest/v1 or slashes to ensure valid base project URL
export const supabaseUrl = rawUrl
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/$/, "");

const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
export const SUPABASE_BUCKET = (import.meta.env.VITE_SUPABASE_BUCKET || "avatars").trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl !== "your_supabase_project_url" &&
  supabaseAnonKey &&
  supabaseAnonKey !== "your_supabase_anon_key"
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Upload profile avatar file to Supabase Storage bucket.
 * Returns public URL string if successful, or error message.
 */
export async function uploadAvatarToSupabase(
  file: File,
  userId: string | number
): Promise<{ url: string | null; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      url: null,
      error: "Supabase credentials not set in .env file (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY).",
    };
  }

  try {
    const cleanUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, "");
    const rawExt = file.name.split(".").pop() || "png";
    const fileExt = rawExt.toLowerCase().replace(/[^a-z0-9]/g, "");
    const fileName = `user-${cleanUserId}-${Date.now()}.${fileExt}`;

    // Upload directly to bucket root
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("[Supabase] Storage upload error:", uploadError.message);
      return { url: null, error: uploadError.message };
    }

    const uploadedPath = uploadData?.path || fileName;

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(uploadedPath);

    return { url: publicUrlData.publicUrl };
  } catch (err: any) {
    console.error("[Supabase] Unexpected upload error:", err);
    return { url: null, error: err?.message || "Failed to upload image to Supabase" };
  }
}

/**
 * List uploaded avatar images for a user from Supabase Storage bucket.
 * Returns array of public URLs.
 */
export async function listSupabaseAvatars(
  userId: string | number
): Promise<string[]> {
  if (!supabase || !isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .list("", {
        limit: 20,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error || !data) {
      console.warn("[Supabase] Failed to list avatars:", error?.message);
      return [];
    }

    const cleanUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, "");
    const userPrefix = `user-${cleanUserId}`;
    return data
      .filter((file) => file.name.startsWith(userPrefix))
      .map((file) => {
        return supabase!.storage
          .from(SUPABASE_BUCKET)
          .getPublicUrl(file.name).data.publicUrl;
      });
  } catch (err) {
    console.error("[Supabase] Unexpected error listing avatars:", err);
    return [];
  }
}
