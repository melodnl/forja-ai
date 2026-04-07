const BASE_URL = "https://api.anthropic.com/v1";

export async function generateCopy(params: {
  type: string;
  tone: string;
  language: string;
  briefing: string;
  variations: number;
}): Promise<string[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada");

  const systemPrompt = buildCopySystemPrompt(params);

  const response = await fetch(`${BASE_URL}/messages`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Briefing: ${params.briefing}\n\nGere ${params.variations} variações.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || "";
  return parseCopyOutput(text, params.variations);
}

function buildCopySystemPrompt(params: {
  type: string;
  tone: string;
  language: string;
}): string {
  const langMap: Record<string, string> = {
    "pt-BR": "português brasileiro",
    es: "espanhol",
    en: "inglês",
  };

  return `Você é um copywriter expert em tráfego pago e marketing digital.
Gere copies do tipo "${params.type}" com tom "${params.tone}" em ${langMap[params.language] || params.language}.
Retorne APENAS as copies, uma por linha, numeradas (1., 2., etc).
Sem explicações, sem introduções. Direto ao ponto.`;
}

function parseCopyOutput(text: string, expected: number): string[] {
  const lines = text
    .split("\n")
    .map((l) => l.replace(/^\d+[\.\)]\s*/, "").trim())
    .filter((l) => l.length > 0);

  return lines.slice(0, expected);
}
