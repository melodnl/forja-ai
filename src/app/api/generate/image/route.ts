import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod/v4";
import { generateWithProvider, getGenerationType, getJobStatus } from "@/lib/ai/orchestrator";
import { validateAndDebitCredits } from "@/lib/ai/credits";
import type { CreditModel } from "@/lib/utils/credits";

const generateSchema = z.object({
  model: z.string(),
  prompt: z.string().min(1),
  imageUrls: z.array(z.string()).optional(),
  aspectRatio: z.string().optional(),
  resolution: z.string().optional(),
  format: z.string().optional(),
  variants: z.number().min(1).max(4).optional(),
  boardId: z.string().optional(),
  nodeId: z.string().optional(),
  provider: z.string().optional(),
});

export async function POST(req: Request) {
  try {
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

    const body = await req.json();
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { model, prompt, imageUrls, aspectRatio, resolution, format, variants, boardId, nodeId, provider } =
      parsed.data;

    // Validar créditos
    const creditResult = await validateAndDebitCredits(
      user.id,
      model as CreditModel
    );

    if (!creditResult.ok) {
      return NextResponse.json(
        { error: creditResult.error },
        { status: 402 }
      );
    }

    // Criar registro de geração
    const genType = getGenerationType(model);
    const { data: generation, error: genErr } = await supabase
      .from("generations")
      .insert({
        user_id: user.id,
        board_id: boardId || null,
        node_id: nodeId || null,
        type: genType,
        provider: provider || "kie",
        model,
        status: "processing",
        prompt,
        input_data: { imageUrls, aspectRatio, resolution, format, variants },
        credits_used: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (genErr || !generation) {
      return NextResponse.json(
        { error: "Erro ao criar geração" },
        { status: 500 }
      );
    }

    // Chamar provider (com fallback)
    try {
      const { jobId, provider: usedProvider } = await generateWithProvider({
        model,
        prompt,
        imageUrls,
        aspectRatio,
        format,
        variants,
        provider,
      });

      // Checar se resultado já está disponível (providers síncronos como Google)
      let immediateUrls: string[] | null = null;
      try {
        const immediateStatus = await getJobStatus(usedProvider, jobId);
        if (immediateStatus.status === "completed" && immediateStatus.outputUrls?.length) {
          immediateUrls = immediateStatus.outputUrls;
        }
      } catch {}

      if (immediateUrls) {
        // Resultado já disponível — salvar direto
        await supabase
          .from("generations")
          .update({
            external_job_id: jobId,
            provider: usedProvider,
            status: "completed",
            output_urls: immediateUrls,
            completed_at: new Date().toISOString(),
          })
          .eq("id", generation.id);

        // Salvar assets
        for (const url of immediateUrls) {
          await supabase.from("assets").insert({
            user_id: user.id,
            generation_id: generation.id,
            type: genType,
            url,
          });
        }

        return NextResponse.json({
          generationId: generation.id,
          jobId,
          provider: usedProvider,
          status: "completed",
          outputUrls: immediateUrls,
        });
      }

      // Resultado assíncrono — aguardar polling/webhook
      await supabase
        .from("generations")
        .update({
          external_job_id: jobId,
          provider: usedProvider,
        })
        .eq("id", generation.id);

      return NextResponse.json({
        generationId: generation.id,
        jobId,
        provider: usedProvider,
        status: "processing",
      });
    } catch (err) {
      // Falha total — estornar créditos
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
