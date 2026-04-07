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

    // Kie.ai webhook pode enviar no formato:
    // { taskId, state, resultJson, failMsg, ... }
    const taskId = payload.taskId || payload.data?.taskId;
    const state = payload.state || payload.status;

    if (!taskId) {
      return NextResponse.json({ error: "taskId ausente" }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { data: generation, error: fetchErr } = await supabase
      .from("generations")
      .select("*")
      .eq("external_job_id", taskId)
      .single();

    if (fetchErr || !generation) {
      console.error("[webhook/kie] Geração não encontrada:", taskId);
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    if (state === "success") {
      // Extrair URLs do resultJson
      let externalUrls: string[] = [];

      if (payload.resultJson) {
        try {
          const result = typeof payload.resultJson === "string"
            ? JSON.parse(payload.resultJson)
            : payload.resultJson;
          externalUrls = result.resultUrls || [];
        } catch {
          externalUrls = [];
        }
      }

      // Fallback: tentar outros formatos
      if (externalUrls.length === 0) {
        externalUrls = payload.output?.urls || payload.urls || [];
      }

      // Baixar e armazenar no Supabase Storage
      const storedUrls: string[] = [];
      for (let i = 0; i < externalUrls.length; i++) {
        try {
          const url = await downloadAndStore(
            externalUrls[i],
            generation.user_id,
            generation.id,
            i
          );
          storedUrls.push(url);
        } catch (err) {
          console.error("[webhook/kie] Erro no upload:", err);
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
          type: generation.type === "video" ? "video" : "image",
          url,
        });
      }
    } else if (state === "fail" || state === "failed" || state === "error") {
      await refundCredits(
        generation.user_id,
        generation.model as CreditModel,
        generation.id
      );

      await supabase
        .from("generations")
        .update({
          status: "failed",
          error_message: payload.failMsg || payload.error || "Geração falhou",
          completed_at: new Date().toISOString(),
        })
        .eq("id", generation.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook/kie] Erro:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
