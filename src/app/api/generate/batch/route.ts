import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod/v4";

const batchSchema = z.object({
  basePrompt: z.string().min(1),
  count: z.number().min(2).max(10),
  model: z.string(),
  aspectRatio: z.string().optional(),
  provider: z.string().optional(),
  boardId: z.string().optional(),
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
    const parsed = batchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

    const { basePrompt, count, model, aspectRatio, provider, boardId } = parsed.data;

    // Gerar variações de prompt via OpenRouter
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "OPENROUTER_API_KEY não configurada" }, { status: 500 });

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        max_tokens: 2048,
        messages: [
          {
            role: "system",
            content: `You are a creative prompt engineer. Generate ${count} unique variations of the given prompt for AI image/video generation. Each variation should be meaningfully different (different angle, style, lighting, composition, mood). Return ONLY the prompts, one per line, numbered. No explanations.`,
          },
          { role: "user", content: `Base prompt: "${basePrompt}"\n\nGenerate ${count} variations:` },
        ],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Erro ao gerar variações" }, { status: 500 });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    const variations = text
      .split("\n")
      .map((l: string) => l.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((l: string) => l.length > 10)
      .slice(0, count);

    // Disparar cada variação como geração separada
    const generationIds: string[] = [];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    for (const prompt of variations) {
      try {
        const genRes = await fetch(`${appUrl}/api/generate/image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: req.headers.get("cookie") || "",
          },
          body: JSON.stringify({
            model,
            prompt,
            aspectRatio: aspectRatio || "1:1",
            variants: 1,
            boardId,
            provider,
          }),
        });
        const genData = await genRes.json();
        if (genData.generationId) generationIds.push(genData.generationId);
      } catch {}
    }

    return NextResponse.json({
      variations,
      generationIds,
      count: generationIds.length,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro interno" }, { status: 500 });
  }
}
