import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod/v4";
import { generateWithFallback } from "@/lib/ai/orchestrator";
import { validateAndDebitCredits } from "@/lib/ai/credits";
import type { CreditModel } from "@/lib/utils/credits";

const videoSchema = z.object({
  model: z.string(),
  prompt: z.string().min(1),
  imageUrls: z.array(z.string()).optional(),
  aspectRatio: z.string().optional(),
  boardId: z.string().optional(),
  nodeId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = videoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const { model, prompt, imageUrls, aspectRatio, boardId, nodeId } = parsed.data;

    // Validar créditos
    const creditResult = await validateAndDebitCredits(user.id, model as CreditModel);
    if (!creditResult.ok) {
      return NextResponse.json({ error: creditResult.error }, { status: 402 });
    }

    // Criar geração
    const { data: generation, error: genErr } = await supabase
      .from("generations")
      .insert({
        user_id: user.id,
        board_id: boardId || null,
        node_id: nodeId || null,
        type: "video",
        provider: "kie",
        model,
        status: "processing",
        prompt,
        input_data: { imageUrls, aspectRatio },
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (genErr || !generation) {
      return NextResponse.json({ error: "Erro ao criar geração" }, { status: 500 });
    }

    try {
      const { jobId, provider } = await generateWithFallback({
        model, prompt, imageUrls, aspectRatio,
      });

      await supabase
        .from("generations")
        .update({ external_job_id: jobId, provider })
        .eq("id", generation.id);

      return NextResponse.json({
        generationId: generation.id,
        jobId,
        provider,
        status: "processing",
      });
    } catch (err) {
      const { refundCredits } = await import("@/lib/ai/credits");
      await refundCredits(user.id, model as CreditModel, generation.id);

      await supabase
        .from("generations")
        .update({
          status: "failed",
          error_message: err instanceof Error ? err.message : "Erro desconhecido",
          completed_at: new Date().toISOString(),
        })
        .eq("id", generation.id);

      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Erro na geração" },
        { status: 500 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}
