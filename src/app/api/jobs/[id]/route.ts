import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getJobStatus } from "@/lib/ai/orchestrator";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Buscar geração
    const { data: generation, error } = await supabase
      .from("generations")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

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
          // Atualizar no banco
          await supabase
            .from("generations")
            .update({
              status: "completed",
              output_urls: jobStatus.outputUrls,
              completed_at: new Date().toISOString(),
            })
            .eq("id", id);

          return NextResponse.json({
            status: "completed",
            outputUrls: jobStatus.outputUrls,
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
      } catch {
        // Polling falhou, retornar status atual do banco
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
