import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { z } from "zod/v4";
import { generateSpeech as elevenLabsSpeech } from "@/lib/ai/providers/elevenlabs";
import { generateSpeech as fishAudioSpeech } from "@/lib/ai/providers/fish-audio";
import { validateAndDebitCredits } from "@/lib/ai/credits";
import type { CreditModel } from "@/lib/utils/credits";

const voiceSchema = z.object({
  provider: z.enum(["elevenlabs", "fish-audio"]),
  voice: z.string().optional(),
  text: z.string().min(1),
  stability: z.number().min(0).max(1).optional(),
  similarity: z.number().min(0).max(1).optional(),
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
    const parsed = voiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const { provider, voice, text, stability, similarity } = parsed.data;

    // Validar créditos
    const creditModel = provider as CreditModel;
    const creditResult = await validateAndDebitCredits(user.id, creditModel);
    if (!creditResult.ok) {
      return NextResponse.json({ error: creditResult.error }, { status: 402 });
    }

    // Gerar áudio
    let audioBuffer: ArrayBuffer;
    let contentType: string;

    if (provider === "elevenlabs") {
      const result = await elevenLabsSpeech({
        text,
        voiceId: voice || "",
        stability,
        similarity,
      });
      audioBuffer = result.audioBuffer;
      contentType = result.contentType;
    } else {
      const result = await fishAudioSpeech({ text, voiceId: voice || "" });
      audioBuffer = result.audioBuffer;
      contentType = result.contentType;
    }

    // Upload pro Supabase Storage
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const path = `${user.id}/voice-${Date.now()}.mp3`;
    const { error: uploadErr } = await serviceClient.storage
      .from("generations")
      .upload(path, audioBuffer, { contentType, upsert: true });

    if (uploadErr) {
      return NextResponse.json({ error: "Erro no upload do áudio" }, { status: 500 });
    }

    const { data: urlData } = serviceClient.storage.from("generations").getPublicUrl(path);

    return NextResponse.json({
      url: urlData.publicUrl,
      duration: Math.ceil(text.length / 15), // estimativa
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}
