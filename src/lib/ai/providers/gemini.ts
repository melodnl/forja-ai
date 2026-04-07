const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export async function generateCopy(params: {
  type: string;
  tone: string;
  language: string;
  briefing: string;
  variations: number;
}): Promise<string[]> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY não configurada");

  const langMap: Record<string, string> = {
    "pt-BR": "português brasileiro",
    es: "espanhol",
    en: "inglês",
  };

  const prompt = `Você é um copywriter expert em tráfego pago e marketing digital.
Gere ${params.variations} copies do tipo "${params.type}" com tom "${params.tone}" em ${langMap[params.language] || params.language}.
Retorne APENAS as copies, uma por linha, numeradas (1., 2., etc). Sem explicações.

Briefing: ${params.briefing}`;

  const response = await fetch(
    `${BASE_URL}/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 2048 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return text
    .split("\n")
    .map((l: string) => l.replace(/^\d+[\.\)]\s*/, "").trim())
    .filter((l: string) => l.length > 0)
    .slice(0, params.variations);
}
