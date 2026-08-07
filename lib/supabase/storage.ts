import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/** Uploads an authenticated user's file to the private `user-assets` bucket. */
export async function uploadUserAsset(file: File) {
  const supabase = getSupabaseBrowserClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("You must be signed in before uploading a file.");

  const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const path = `${user.id}/${crypto.randomUUID()}${extension}`;
  const { data, error } = await supabase.storage.from("user-assets").upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  return data;
}
