import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getJobStatus } from "@/lib/ai/orchestrator";

// Permitir mais tempo pra download de vídeos do Google
export const maxDuration = 60;

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getServiceClient();

    // Buscar geração (service role bypassa RLS)
    const { data: generation, error } = await supabase
      .from("generations")
      .select("*")
      .eq("id", id)
      .single();

    const user = generation ? { id: generation.user_id } : null;

    if (error || !generation) {
      return NextResponse.json({ error: "Geração não encontrada" }, { status: 404 });
    }

    // Se já completou/falhou, retornar direto
    if (generation.status === "completed" || generation.status === "failed") {
      return NextResponse.json({
        status: generation.status,
        outputUrls: generation.output_urls,
        error: generation.error_message,
      });
    }

    // Polling no provider
    if (generation.external_job_id) {
      try {
        const jobStatus = await getJobStatus(
          generation.provider,
          generation.external_job_id
        );

        if (jobStatus.status === "completed" && jobStatus.outputUrls) {
          // Se URLs são do Google (temporárias com key), baixar pro Supabase
          const finalUrls: string[] = [];
          for (const rawUrl of jobStatus.outputUrls) {
            if (rawUrl.includes("generativelanguage.googleapis.com")) {
              try {
                const vidRes = await fetch(rawUrl);
                if (vidRes.ok) {
                  const buffer = Buffer.from(await vidRes.arrayBuffer());
                  const ct = vidRes.headers.get("content-type") || "video/mp4";
                  const ext = ct.includes("webm") ? "webm" : "mp4";
                  const path = `veo3/veo3-${Date.now()}-${Math.random().toString(36).slice(2, 5)}.${ext}`;
                  const { error: upErr } = await supabase.storage.from("generations").upload(path, buffer, { contentType: ct, upsert: true });
                  if (!upErr) {
                    const { data: urlData } = supabase.storage.from("generations").getPublicUrl(path);
                    finalUrls.push(urlData.publicUrl);
                    console.log("[jobs/poll] Veo3 stored:", urlData.publicUrl);
                  } else {
                    finalUrls.push(rawUrl);
                  }
                } else {
                  finalUrls.push(rawUrl);
                }
              } catch {
                finalUrls.push(rawUrl);
              }
            } else {
              finalUrls.push(rawUrl);
            }
          }

          await supabase
            .from("generations")
            .update({
              status: "completed",
              output_urls: finalUrls,
              completed_at: new Date().toISOString(),
            })
            .eq("id", id);

          if (user) {
            for (const url of finalUrls) {
              await supabase.from("assets").insert({
                user_id: user.id,
                generation_id: id,
                type: generation.type === "video" ? "video" : "image",
                url,
              });
            }
          }

          console.log("[jobs/poll] Concluído:", id, finalUrls.length, "urls");

          return NextResponse.json({
            status: "completed",
            outputUrls: finalUrls,
          });
        }

        if (jobStatus.status === "failed") {
          await supabase
            .from("generations")
            .update({
              status: "failed",
              error_message: jobStatus.error,
              completed_at: new Date().toISOString(),
            })
            .eq("id", id);

          return NextResponse.json({
            status: "failed",
            error: jobStatus.error,
          });
        }
      } catch (pollErr) {
        console.error("[jobs/poll] Erro no polling:", generation.provider, pollErr);
      }
    }

    return NextResponse.json({ status: "processing" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}
