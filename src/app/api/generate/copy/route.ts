import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod/v4";
import { generateCopy as anthropicCopy } from "@/lib/ai/providers/anthropic";
import { generateCopy as openaiCopy } from "@/lib/ai/providers/openai";
import { generateCopy as geminiCopy } from "@/lib/ai/providers/gemini";
import { validateAndDebitCredits } from "@/lib/ai/credits";
import type { CreditModel } from "@/lib/utils/credits";

const copySchema = z.object({
  model: z.enum(["claude-sonnet-4-5", "gpt-4-1", "gemini-2-0"]),
  type: z.string(),
  tone: z.string(),
  language: z.string(),
  briefing: z.string().min(1),
  variations: z.number().min(1).max(10),
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
    const parsed = copySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const { model, type, tone, language, briefing, variations } = parsed.data;

    // Validar créditos
    const creditResult = await validateAndDebitCredits(user.id, model as CreditModel);
    if (!creditResult.ok) {
      return NextResponse.json({ error: creditResult.error }, { status: 402 });
    }

    // Gerar copies
    const params = { type, tone, language, briefing, variations };
    let copies: string[];

    try {
      if (model === "claude-sonnet-4-5") {
        copies = await anthropicCopy(params);
      } else if (model === "gpt-4-1") {
        copies = await openaiCopy(params);
      } else {
        copies = await geminiCopy(params);
      }
    } catch (primaryErr) {
      // Fallback: tenta outro provider
      console.warn(`[copy] ${model} falhou, tentando fallback:`, primaryErr);
      try {
        const fallbackFn =
          model === "claude-sonnet-4-5" ? openaiCopy
          : model === "gpt-4-1" ? anthropicCopy
          : anthropicCopy;
        copies = await fallbackFn(params);
      } catch {
        throw primaryErr;
      }
    }

    // Registrar geração
    await supabase.from("generations").insert({
      user_id: user.id,
      type: "copy",
      provider: model.includes("claude") ? "anthropic" : model.includes("gpt") ? "openai" : "gemini",
      model,
      status: "completed",
      prompt: briefing,
      input_data: { type, tone, language, variations },
      output_urls: [],
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({ copies });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}
