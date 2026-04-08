import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { z } from "zod/v4";
import { validateAndDebitCredits } from "@/lib/ai/credits";
import type { CreditModel } from "@/lib/utils/credits";

const removeBgSchema = z.object({
  imageUrl: z.string().url(),
  nodeId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const body = await req.json();
    const parsed = removeBgSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

    const { imageUrl } = parsed.data;
    const creditResult = await validateAndDebitCredits(user.id, "remove-bg" as CreditModel);
    if (!creditResult.ok) return NextResponse.json({ error: creditResult.error }, { status: 402 });

    // Baixar imagem original
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return NextResponse.json({ error: "Erro ao baixar imagem" }, { status: 500 });

    const removeBgKey = process.env.REMOVE_BG_API_KEY;

    if (removeBgKey) {
      // remove.bg API (50 calls/mês grátis)
      const formData = new FormData();
      formData.append("image_url", imageUrl);
      formData.append("size", "auto");

      const bgRes = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": removeBgKey },
        body: formData,
      });

      if (!bgRes.ok) {
        const err = await bgRes.text();
        return NextResponse.json({ error: `Remove.bg: ${err}` }, { status: 500 });
      }

      const resultBuffer = await bgRes.arrayBuffer();
      const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      const path = `${user.id}/remove-bg-${Date.now()}.png`;

      await serviceClient.storage.from("generations").upload(path, resultBuffer, { contentType: "image/png", upsert: true });
      const { data: urlData } = serviceClient.storage.from("generations").getPublicUrl(path);

      const { data: gen } = await supabase.from("generations").insert({
        user_id: user.id, type: "remove_bg", provider: "remove-bg", model: "remove-bg",
        status: "completed", input_data: { imageUrl }, output_urls: [urlData.publicUrl],
        completed_at: new Date().toISOString(),
      }).select().single();

      if (gen) {
        await supabase.from("assets").insert({ user_id: user.id, generation_id: gen.id, type: "image", url: urlData.publicUrl });
      }

      return NextResponse.json({ url: urlData.publicUrl, status: "completed" });
    }

    // Fallback: Kie.ai recraft/crisp-upscale
    const kieKey = process.env.KIE_API_KEY;
    if (!kieKey) return NextResponse.json({ error: "Nenhuma API de remove-bg configurada" }, { status: 500 });

    const kieRes = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: { Authorization: `Bearer ${kieKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "recraft/crisp-upscale",
        input: { image_urls: [imageUrl] },
        callBackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/kie`,
      }),
    });

    const kieData = await kieRes.json();
    if (kieData.code !== 200) return NextResponse.json({ error: `Kie.ai: ${kieData.msg}` }, { status: 500 });

    await supabase.from("generations").insert({
      user_id: user.id, type: "remove_bg", provider: "kie", model: "remove-bg",
      status: "processing", input_data: { imageUrl },
      external_job_id: kieData.data?.taskId, started_at: new Date().toISOString(),
    });

    return NextResponse.json({ jobId: kieData.data?.taskId, status: "processing" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro interno" }, { status: 500 });
  }
}
