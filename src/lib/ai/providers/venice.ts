import type { AIProvider, GenerateParams, JobStatus } from "@/types/ai";

// Venice AI usa formato compatível com OpenAI
const VENICE_BASE_URL = "https://api.venice.ai/api/v1";

// Venice só suporta geração de IMAGEM (não vídeo)
const IMAGE_MODEL_MAP: Record<string, string> = {
  "nano-banana-2": "flux-dev",
  "nano-banana": "flux-dev",
  "flux-pro-1.1": "flux-dev-uncensored",
  "ideogram-v3": "flux-dev",
  "seedream-4": "flux-dev",
  "gpt-image-1": "flux-dev",
};

const VIDEO_MODELS = [
  "seedance-2", "seedance-2-fast", "seedance-1.5-pro",
  "veo-3", "kling-3", "runway-gen-4", "hailuo-02", "wan-2-1", "sora-2",
];

export const veniceProvider: AIProvider = {
  name: "venice",

  async generate(params: GenerateParams): Promise<{ jobId: string }> {
    const apiKey = process.env.VENICE_API_KEY;
    if (!apiKey) throw new Error("VENICE_API_KEY não configurada");

    // Venice não suporta vídeo — rejeitar pra fallback pro Kie
    if (VIDEO_MODELS.includes(params.model)) {
      throw new Error("Venice AI não suporta geração de vídeo. Use KieAI.");
    }

    const model = IMAGE_MODEL_MAP[params.model] || "flux-dev";

    // Venice usa endpoint de imagem compatível com OpenAI
    const response = await fetch(`${VENICE_BASE_URL}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: params.prompt,
        n: params.variants || 1,
        size: mapAspectToSize(params.aspectRatio || "1:1"),
        response_format: "url",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Venice AI error: ${response.status} — ${err}`);
    }

    const data = await response.json();

    // Venice retorna resultado síncrono (sem job ID)
    // Salvamos as URLs diretamente e retornamos um ID fake
    const urls = (data.data || []).map((img: { url: string }) => img.url);
    const jobId = `venice-${Date.now()}`;

    // Armazenar resultado em memória temporária pra ser consumido pelo getStatus
    veniceResults.set(jobId, urls);

    return { jobId };
  },

  async getStatus(jobId: string): Promise<JobStatus> {
    const urls = veniceResults.get(jobId);
    if (urls) {
      veniceResults.delete(jobId);
      return { status: "completed", outputUrls: urls };
    }
    return { status: "failed", error: "Resultado não encontrado" };
  },
};

// Cache temporário pra resultados síncronos do Venice
const veniceResults = new Map<string, string[]>();

function mapAspectToSize(aspect: string): string {
  const map: Record<string, string> = {
    "1:1": "1024x1024",
    "9:16": "1024x1792",
    "16:9": "1792x1024",
    "4:5": "1024x1536",
    "3:4": "1024x1536",
    "4:3": "1536x1024",
  };
  return map[aspect] || "1024x1024";
}
