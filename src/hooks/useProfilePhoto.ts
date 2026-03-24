import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useProfilePhoto(userId: string | undefined) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadPhoto = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("user_preferences")
      .select("profile_photo_url")
      .eq("user_id", userId)
      .maybeSingle();
    if (data?.profile_photo_url) {
      const { data: signed } = await supabase.storage
        .from("profile-photos")
        .createSignedUrl(data.profile_photo_url, 3600);
      if (signed?.signedUrl) setPhotoUrl(signed.signedUrl);
    }
  }, [userId]);

  useEffect(() => { loadPhoto(); }, [loadPhoto]);

  const uploadPhoto = useCallback(async (file: File) => {
    if (!userId) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 5MB.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/avatar.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("profile-photos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      // Save path to user_preferences
      const { error: dbErr } = await supabase
        .from("user_preferences")
        .upsert({ user_id: userId, profile_photo_url: path }, { onConflict: "user_id" });
      if (dbErr) throw dbErr;

      // Refresh signed URL
      const { data: signed } = await supabase.storage
        .from("profile-photos")
        .createSignedUrl(path, 3600);
      if (signed?.signedUrl) setPhotoUrl(signed.signedUrl);

      toast.success("Foto de perfil atualizada!");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Erro ao enviar foto: " + err.message);
    } finally {
      setUploading(false);
    }
  }, [userId]);

  return { photoUrl, uploading, uploadPhoto, refreshPhoto: loadPhoto };
}
