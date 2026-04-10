import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Baixa imagem de URL externa e salva no Supabase Storage.
 * Retorna a URL pública.
 */
export async function downloadAndStore(
  externalUrl: string,
  userId: string,
  generationId: string,
  index: number = 0
): Promise<string> {
  const response = await fetch(externalUrl);
  if (!response.ok) throw new Error(`Falha ao baixar: ${externalUrl}`);

  const buffer = await response.arrayBuffer();
  const contentType = response.headers.get("content-type") || "image/png";

  // Detectar extensão do content-type ou da URL
  let ext = "png";
  if (contentType.includes("mp4") || contentType.includes("video")) ext = "mp4";
  else if (contentType.includes("webm")) ext = "webm";
  else if (contentType.includes("mov") || contentType.includes("quicktime")) ext = "mov";
  else if (contentType.includes("webp")) ext = "webp";
  else if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
  else {
    // Fallback: checar extensão na URL
    const urlExt = externalUrl.split("?")[0].split(".").pop()?.toLowerCase();
    if (urlExt && ["mp4", "webm", "mov", "jpg", "jpeg", "png", "webp", "gif"].includes(urlExt)) {
      ext = urlExt === "jpeg" ? "jpg" : urlExt;
    }
  }

  const path = `${userId}/${generationId}/${index}.${ext}`;
  const supabase = getServiceClient();

  const { error } = await supabase.storage
    .from("generations")
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (error) throw new Error(`Upload falhou: ${error.message}`);

  const { data } = supabase.storage.from("generations").getPublicUrl(path);
  return data.publicUrl;
}
