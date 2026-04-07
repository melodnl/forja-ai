const BASE_URL = "https://api.elevenlabs.io/v1";

export async function generateSpeech(params: {
  text: string;
  voiceId: string;
  stability?: number;
  similarity?: number;
}): Promise<{ audioBuffer: ArrayBuffer; contentType: string }> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY não configurada");

  const voiceId = params.voiceId || "21m00Tcm4TlvDq8ikWAM"; // Rachel (default)

  const response = await fetch(`${BASE_URL}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: params.text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: params.stability ?? 0.5,
        similarity_boost: params.similarity ?? 0.75,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs error: ${response.status} — ${err}`);
  }

  const audioBuffer = await response.arrayBuffer();
  return { audioBuffer, contentType: "audio/mpeg" };
}
