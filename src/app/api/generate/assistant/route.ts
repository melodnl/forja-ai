import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod/v4";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const assistantSchema = z.object({
  model: z.string(),
  messages: z.array(messageSchema),
  context: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
});

// Mapeamento do model ID interno → model ID do OpenRouter
const OPENROUTER_MODELS: Record<string, string> = {
  "gemini-3-flash": "google/gemini-2.0-flash-001",
  "claude-4-5-haiku": "anthropic/claude-haiku-4-5-20251001",
  "gpt-5-1": "openai/gpt-4.1",
  "claude-4-5-sonnet": "anthropic/claude-sonnet-4-5-20250514",
  "gpt-5-2": "openai/gpt-4.1",
  "claude-4-5-opus": "anthropic/claude-opus-4-20250514",
  "claude-4-6-opus": "anthropic/claude-opus-4-6-20250715",
  "gemini-3-pro": "google/gemini-2.5-pro-preview-06-05",
};

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
    const parsed = assistantSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

    const { model, messages, context } = parsed.data;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "OPENROUTER_API_KEY não configurada" }, { status: 500 });

    const openRouterModel = OPENROUTER_MODELS[model] || "google/gemini-2.0-flash-001";

    const systemPrompt = `Você é um assistente criativo especializado em marketing digital, tráfego pago e produção de conteúdo visual.
Você ajuda a descrever imagens, criar prompts para IA, escrever copies, roteiros e dar sugestões criativas.
Responda de forma direta e útil, em português brasileiro.
${context ? `\nContexto das fontes conectadas:\n${context}` : ""}`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Forjea",
      },
      body: JSON.stringify({
        model: openRouterModel,
        max_tokens: 2048,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `OpenRouter error (${res.status}): ${err}` },
        { status: 500 }
      );
    }

    const data = await res.json();
    const response = data.choices?.[0]?.message?.content || "Sem resposta.";

    return NextResponse.json({ response });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}
