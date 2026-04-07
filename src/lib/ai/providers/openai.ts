const BASE_URL = "https://api.openai.com/v1";

export async function generateCopy(params: {
  type: string;
  tone: string;
  language: string;
  briefing: string;
  variations: number;
}): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY não configurada");

  const langMap: Record<string, string> = {
    "pt-BR": "português brasileiro",
    es: "espanhol",
    en: "inglês",
  };

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1",
      max_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `Você é um copywriter expert em tráfego pago e marketing digital.
Gere copies do tipo "${params.type}" com tom "${params.tone}" em ${langMap[params.language] || params.language}.
Retorne APENAS as copies, uma por linha, numeradas (1., 2., etc). Sem explicações.`,
        },
        {
          role: "user",
          content: `Briefing: ${params.briefing}\n\nGere ${params.variations} variações.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  return text
    .split("\n")
    .map((l: string) => l.replace(/^\d+[\.\)]\s*/, "").trim())
    .filter((l: string) => l.length > 0)
    .slice(0, params.variations);
}
