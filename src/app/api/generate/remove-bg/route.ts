import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
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

    // Chamar Kie.ai para remove-bg
    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "KIE_API_KEY não configurada" }, { status: 500 });

    const kieRes = await fetch("https://api.kie.ai/api/v1/playground/createTask", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "remove-bg",
        input: {
          image_urls: [imageUrl],
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

    await supabase.from("generations").insert({
      user_id: user.id,
      type: "remove_bg",
      provider: "kie",
      model: "remove-bg",
      status: "processing",
      input_data: { imageUrl },
      external_job_id: jobId,
      started_at: new Date().toISOString(),
    });

    return NextResponse.json({ jobId, status: "processing" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro interno" }, { status: 500 });
  }
}
