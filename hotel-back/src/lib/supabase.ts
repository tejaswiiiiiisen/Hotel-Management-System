import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import "dotenv/config";

if (typeof globalThis.WebSocket === "undefined") {
  (globalThis as any).WebSocket = ws;
}

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
export const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "room-images";

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
        realtime: { transport: ws as any },
      })
    : null;

/**
 * Upload a base64 or buffer image to Supabase Storage.
 * Returns public URL from Supabase Storage or falls back gracefully to null.
 */
export async function uploadImageToSupabase(
  imageInput: string | Buffer,
  folderName: string = "rooms"
): Promise<string | null> {
  if (!supabase) return null;

  try {
    let buffer: Buffer;
    let ext = "jpg";

    if (typeof imageInput === "string") {
      if (imageInput.startsWith("data:image/")) {
        const matches = imageInput.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
          ext = matches[1] === "jpeg" ? "jpg" : matches[1];
          buffer = Buffer.from(matches[2], "base64");
        } else {
          return null;
        }
      } else {
        // If it's already an HTTP URL, return as is
        return imageInput;
      }
    } else {
      buffer = imageInput;
    }

    const fileName = `${folderName}/room_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;

    // Upload to primary bucket
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(fileName, buffer, {
        contentType: `image/${ext}`,
        upsert: true,
      });

    if (error) {
      console.warn("⚠️ Supabase storage upload warning:", error.message);
      // Fallback attempt to 'avatars' or default bucket
      const { data: fallbackData, error: fallbackError } = await supabase.storage
        .from("avatars")
        .upload(fileName, buffer, {
          contentType: `image/${ext}`,
          upsert: true,
        });
      if (!fallbackError && fallbackData) {
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);
        return urlData.publicUrl;
      }
      return null;
    }

    if (data) {
      const { data: publicUrlData } = supabase.storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl(fileName);
      return publicUrlData.publicUrl;
    }
  } catch (err: any) {
    console.warn("⚠️ Supabase upload error:", err?.message || err);
  }

  return null;
}

export async function uploadAvatarToSupabaseBackend(
  imageInput: string | Buffer,
  userId: number | string
): Promise<{ url: string | null }> {
  const url = await uploadImageToSupabase(imageInput, `avatars/user_${userId}`);
  return { url };
}
