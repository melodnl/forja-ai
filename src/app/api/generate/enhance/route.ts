import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod/v4";

const enhanceSchema = z.object({
  text: z.string().min(1),
  context: z.string().optional(),
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
    const parsed = enhanceSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

    const { text, context } = parsed.data;

    // Tenta Claude primeiro, fallback pra OpenAI
    let enhanced: string;
    try {
      enhanced = await enhanceWithClaude(text, context);
    } catch {
      try {
        enhanced = await enhanceWithOpenAI(text, context);
      } catch {
        return NextResponse.json({ error: "Nenhum provider de IA disponível" }, { status: 500 });
      }
    }

    return NextResponse.json({ enhanced });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro interno" }, { status: 500 });
  }
}

async function enhanceWithClaude(text: string, context?: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 1024,
      system: `Você é um expert em engenharia de prompts para modelos de geração de imagem e vídeo (Midjourney, Stable Diffusion, DALL-E, Sora, etc).
Seu trabalho é pegar um prompt simples do usuário e transformar em um prompt detalhado, rico e otimizado para gerar resultados visuais impressionantes.
Adicione: detalhes de iluminação, composição, estilo artístico, câmera, atmosfera, cores.
Mantenha em inglês (prompts de imagem funcionam melhor em inglês).
Retorne APENAS o prompt aprimorado, sem explicações.`,
      messages: [
        {
          role: "user",
          content: context
            ? `Prompt original: "${text}"\nContexto adicional: ${context}\n\nApriore este prompt:`
            : `Prompt original: "${text}"\n\nApriore este prompt:`,
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Claude error: ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text || text;
}

async function enhanceWithOpenAI(text: string, context?: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY não configurada");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4.1",
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `You are an expert prompt engineer for AI image/video generation. Transform simple prompts into detailed, rich prompts optimized for stunning visual results. Add: lighting, composition, art style, camera, atmosphere, colors. Return ONLY the enhanced prompt.`,
        },
        {
          role: "user",
          content: context
            ? `Original: "${text}"\nContext: ${context}\n\nEnhance:`
            : `Original: "${text}"\n\nEnhance:`,
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || text;
}
