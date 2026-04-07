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
  const ext = contentType.includes("webp")
    ? "webp"
    : contentType.includes("jpeg") || contentType.includes("jpg")
    ? "jpg"
    : "png";

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
