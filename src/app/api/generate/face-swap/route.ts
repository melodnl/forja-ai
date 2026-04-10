import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MAGICHOUR_API = "https://api.magichour.ai/v1";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Upload base64 image to Supabase Storage and return public URL */
async function uploadBase64ToStorage(base64: string, name: string): Promise<string> {
  const supabase = getServiceClient();

  // Remove data URL prefix
  const matches = base64.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) throw new Error("Formato base64 inválido");

  const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  const contentType = `image/${matches[1]}`;
  const path = `face-swap/${name}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("generations")
    .upload(path, buffer, { contentType, upsert: true });

  if (error) throw new Error(`Upload falhou: ${error.message}`);

  const { data } = supabase.storage.from("generations").getPublicUrl(path);
  return data.publicUrl;
}

export async function POST(req: Request) {
  try {
    const { sourceImage, targetImage, sourceUrl, targetUrl } = await req.json();

    const apiKey = process.env.MAGICHOUR_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "MAGICHOUR_API_KEY não configurada" }, { status: 500 });
    }

    // Resolver URLs — se for base64, fazer upload primeiro
    let sourcePublicUrl = sourceUrl || "";
    let targetPublicUrl = targetUrl || "";

    if (sourceImage) {
      sourcePublicUrl = await uploadBase64ToStorage(sourceImage, "source");
      console.log("[face-swap] Source uploaded:", sourcePublicUrl);
    }
    if (targetImage) {
      targetPublicUrl = await uploadBase64ToStorage(targetImage, "target");
      console.log("[face-swap] Target uploaded:", targetPublicUrl);
    }

    // Se já são URLs públicas (não blob:), usar direto
    if (!sourcePublicUrl || !targetPublicUrl) {
      return NextResponse.json({ error: "Precisa de 2 imagens: avatar (rosto) + referência (alvo)" }, { status: 400 });
    }

    console.log("[face-swap] Enviando para Magic Hour:", { source: sourcePublicUrl, target: targetPublicUrl });

    // 1. Criar o face swap na Magic Hour
    const createRes = await fetch(`${MAGICHOUR_API}/face-swap-photo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `Forjea Face Swap - ${Date.now()}`,
        assets: {
          source_file_path: sourcePublicUrl,
          target_file_path: targetPublicUrl,
          face_swap_mode: "all-faces",
        },
      }),
    });

    const createData = await createRes.json();

    if (!createRes.ok) {
      console.error("[face-swap] Erro ao criar:", createData);
      return NextResponse.json({ error: createData.message || "Erro na Magic Hour API" }, { status: createRes.status });
    }

    const jobId = createData.id;
    console.log("[face-swap] Job criado:", jobId, "credits:", createData.credits_charged);

    // 2. Polling — esperar resultado (max 60s)
    let resultUrl: string | null = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));

      const statusRes = await fetch(`${MAGICHOUR_API}/image-projects/${jobId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const statusData = await statusRes.json();

      console.log("[face-swap] Status:", statusData.status);

      if (statusData.status === "complete" && statusData.downloads?.length > 0) {
        resultUrl = statusData.downloads[0].url;
        break;
      }

      if (statusData.status === "error" || statusData.error) {
        console.error("[face-swap] Erro:", statusData.error);
        return NextResponse.json({ error: statusData.error || "Face swap falhou" }, { status: 500 });
      }
    }

    if (!resultUrl) {
      return NextResponse.json({ error: "Timeout — face swap demorou muito" }, { status: 504 });
    }

    console.log("[face-swap] Resultado:", resultUrl);

    // 3. Baixar resultado e armazenar no Supabase
    const supabase = getServiceClient();
    let storedUrl = resultUrl;

    try {
      const imgRes = await fetch(resultUrl);
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      const contentType = imgRes.headers.get("content-type") || "image/png";
      const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";
      const path = `face-swap/result-${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("generations")
        .upload(path, buffer, { contentType, upsert: true });

      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("generations").getPublicUrl(path);
        storedUrl = urlData.publicUrl;
      }
    } catch (e) {
      console.error("[face-swap] Erro no upload resultado:", e);
    }

    return NextResponse.json({
      status: "completed",
      outputUrls: [storedUrl],
    });
  } catch (err) {
    console.error("[face-swap] Erro:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
