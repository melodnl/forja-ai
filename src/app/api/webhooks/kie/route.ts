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
    console.log("[webhook/kie] Payload recebido:", JSON.stringify(payload).slice(0, 500));

    // Extrair taskId — vários formatos possíveis
    const taskId = payload.taskId || payload.data?.taskId;

    if (!taskId) {
      console.error("[webhook/kie] taskId ausente no payload");
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

    // Detectar sucesso — múltiplos formatos
    const isSuccess =
      payload.state === "success" ||
      payload.status === "success" ||
      payload.code === 200 ||
      payload.data?.info?.resultUrls;

    const isFail =
      payload.state === "fail" ||
      payload.state === "failed" ||
      payload.status === "failed" ||
      payload.status === "error" ||
      payload.code === 400 ||
      payload.code === 500 ||
      payload.code === 501;

    if (isSuccess) {
      let externalUrls: string[] = [];

      // Formato /jobs: resultJson com resultUrls
      if (payload.resultJson) {
        try {
          const result = typeof payload.resultJson === "string"
            ? JSON.parse(payload.resultJson)
            : payload.resultJson;
          externalUrls = result.resultUrls || [];
        } catch {}
      }

      // Formato Veo 3: data.info.resultUrls (pode ser string ou array)
      if (externalUrls.length === 0 && payload.data?.info?.resultUrls) {
        const raw = payload.data.info.resultUrls;
        if (Array.isArray(raw)) {
          externalUrls = raw;
        } else if (typeof raw === "string") {
          // Pode vir como "[url1, url2]" string
          try {
            externalUrls = JSON.parse(raw);
          } catch {
            externalUrls = [raw];
          }
        }
      }

      // Formato Runway: data.videoUrl
      if (externalUrls.length === 0 && payload.data?.videoUrl) {
        externalUrls = [payload.data.videoUrl];
      }

      // Formato /jobs callback: data.resultUrls ou data.output
      if (externalUrls.length === 0 && payload.data?.resultUrls) {
        const raw = payload.data.resultUrls;
        if (Array.isArray(raw)) externalUrls = raw;
        else if (typeof raw === "string") {
          try { externalUrls = JSON.parse(raw); } catch { externalUrls = [raw]; }
        }
      }

      // Formato /jobs callback: data.output (string URL ou array)
      if (externalUrls.length === 0 && payload.data?.output) {
        const raw = payload.data.output;
        if (Array.isArray(raw)) externalUrls = raw;
        else if (typeof raw === "string") externalUrls = [raw];
      }

      // Fallback genérico
      if (externalUrls.length === 0) {
        externalUrls = payload.output?.urls || payload.urls || [];
      }

      // Último fallback: procurar qualquer URL no payload inteiro
      if (externalUrls.length === 0) {
        const payloadStr = JSON.stringify(payload);
        const urlMatches = payloadStr.match(/https?:\/\/[^"'\s,\]]+\.(mp4|webm|mov|jpg|jpeg|png|webp)/gi);
        if (urlMatches) externalUrls = [...new Set(urlMatches)];
      }

      console.log("[webhook/kie] URLs encontradas:", externalUrls.length);
      if (externalUrls.length === 0) {
        console.log("[webhook/kie] PAYLOAD COMPLETO:", JSON.stringify(payload).slice(0, 2000));
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
          storedUrls.push(externalUrls[i]); // fallback: URL original
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

      console.log("[webhook/kie] Geração completada:", generation.id);
    } else if (isFail) {
      const errorMsg = payload.failMsg || payload.msg || payload.error || payload.data?.error || "Geração falhou";

      await refundCredits(
        generation.user_id,
        generation.model as CreditModel,
        generation.id
      );

      await supabase
        .from("generations")
        .update({
          status: "failed",
          error_message: errorMsg,
          completed_at: new Date().toISOString(),
        })
        .eq("id", generation.id);

      console.log("[webhook/kie] Geração falhou:", generation.id, errorMsg);
    } else {
      console.log("[webhook/kie] Status desconhecido, ignorando:", payload.state || payload.status || payload.code);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook/kie] Erro:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
