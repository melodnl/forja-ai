import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { downloadAndStore } from "@/lib/storage/upload";
import { refundCredits } from "@/lib/ai/credits";
import type { CreditModel } from "@/lib/utils/credits";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { request_id, status, payload: resultPayload, error } = payload;

    if (!request_id) {
      return NextResponse.json({ error: "request_id ausente" }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { data: generation, error: fetchErr } = await supabase
      .from("generations")
      .select("*")
      .eq("external_job_id", request_id)
      .single();

    if (fetchErr || !generation) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    if (status === "COMPLETED") {
      const images = resultPayload?.images || resultPayload?.output?.images || [];
      const externalUrls: string[] = images.map((img: { url: string }) => img.url);

      const storedUrls: string[] = [];
      for (let i = 0; i < externalUrls.length; i++) {
        try {
          const url = await downloadAndStore(externalUrls[i], generation.user_id, generation.id, i);
          storedUrls.push(url);
        } catch {
          storedUrls.push(externalUrls[i]);
        }
      }

      await supabase
        .from("generations")
        .update({
          status: "completed",
          output_urls: storedUrls,
          completed_at: new Date().toISOString(),
        })
        .eq("id", generation.id);

      for (const url of storedUrls) {
        await supabase.from("assets").insert({
          user_id: generation.user_id,
          generation_id: generation.id,
          type: "image",
          url,
        });
      }
    } else if (status === "FAILED") {
      await refundCredits(generation.user_id, generation.model as CreditModel, generation.id);

      await supabase
        .from("generations")
        .update({
          status: "failed",
          error_message: error || "Geração falhou no Fal.ai",
          completed_at: new Date().toISOString(),
        })
        .eq("id", generation.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook/fal] Erro:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
