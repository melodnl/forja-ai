const BASE_URL = "https://api.fish.audio/v1";

export async function generateSpeech(params: {
  text: string;
  voiceId: string;
}): Promise<{ audioBuffer: ArrayBuffer; contentType: string }> {
  const apiKey = process.env.FISH_AUDIO_API_KEY;
  if (!apiKey) throw new Error("FISH_AUDIO_API_KEY não configurada");

  const response = await fetch(`${BASE_URL}/tts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: params.text,
      reference_id: params.voiceId || undefined,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Fish Audio error: ${response.status} — ${err}`);
  }

  const audioBuffer = await response.arrayBuffer();
  return { audioBuffer, contentType: "audio/mpeg" };
}
