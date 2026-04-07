import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod/v4";
import { validateAndDebitCredits } from "@/lib/ai/credits";
import type { CreditModel } from "@/lib/utils/credits";

const upscaleSchema = z.object({
  scale: z.enum(["2x", "4x"]),
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
    const parsed = upscaleSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

    const { scale, imageUrl } = parsed.data;
    const creditModel = `upscale-${scale}` as CreditModel;
    const creditResult = await validateAndDebitCredits(user.id, creditModel);
    if (!creditResult.ok) return NextResponse.json({ error: creditResult.error }, { status: 402 });

    // Chamar Kie.ai para upscale
    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "KIE_API_KEY não configurada" }, { status: 500 });

    const kieRes = await fetch("https://api.kie.ai/api/v1/playground/createTask", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "upscale",
        input: {
          image_urls: [imageUrl],
          scale: scale === "4x" ? 4 : 2,
        },
        callBackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/kie`,
      }),
    });

    if (!kieRes.ok) {
      const err = await kieRes.text();
      return NextResponse.json({ error: `Kie.ai error: ${err}` }, { status: 500 });
    }

    const data = await kieRes.json();
    const jobId = data.data?.taskId || data.taskId;

    // Criar geração no banco
    await supabase.from("generations").insert({
      user_id: user.id,
      type: "upscale",
      provider: "kie",
      model: `upscale-${scale}`,
      status: "processing",
      input_data: { imageUrl, scale },
      external_job_id: jobId,
      started_at: new Date().toISOString(),
    });

    return NextResponse.json({ jobId, status: "processing" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro interno" }, { status: 500 });
  }
}
