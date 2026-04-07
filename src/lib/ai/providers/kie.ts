import type { AIProvider, GenerateParams, JobStatus } from "@/types/ai";

const KIE_BASE_URL = "https://api.kie.ai/api/v1/jobs";

// Mapeamento: ID interno → model ID da Kie.ai
const MODEL_MAP: Record<string, string> = {
  // Imagem
  "nano-banana-2": "grok-imagine/text-to-image",
  "nano-banana": "grok-imagine/text-to-image",
  "flux-pro-1.1": "flux-2/text-to-image",
  "ideogram-v3": "ideogram/text-to-image",
  "seedream-4": "seedream/text-to-image",
  "gpt-image-1": "google/imagen4-ultra",
  // Vídeo
  "seedance-2": "bytedance/seedance-2",
  "seedance-2-fast": "bytedance/seedance-2-fast",
  "seedance-1.5-pro": "bytedance/seedance-1-5-pro",
  "veo-3": "google/veo-3",
  "kling-3": "kling/kling-3-0",
  "runway-gen-4": "runway/gen-4",
  "hailuo-02": "hailuo/text-to-video",
  "wan-2-1": "wan/text-to-video",
  "sora-2": "sora2/text-to-video",
  // Utilitários
  "upscale": "grok-imagine/upscale",
  "remove-bg": "recraft/crisp-upscale",
};

export const kieProvider: AIProvider = {
  name: "kie",

  async generate(params: GenerateParams): Promise<{ jobId: string }> {
    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) throw new Error("KIE_API_KEY não configurada");

    const model = MODEL_MAP[params.model] || params.model;

    const input: Record<string, unknown> = {
      prompt: params.prompt,
    };

    // Adicionar imagens se tiver
    if (params.imageUrls && params.imageUrls.length > 0) {
      input.image_urls = params.imageUrls;
    }

    // Aspect ratio
    if (params.aspectRatio) {
      input.aspect_ratio = params.aspectRatio;
    }

    // Formato de output
    if (params.format) {
      input.output_format = params.format;
    }

    const response = await fetch(`${KIE_BASE_URL}/createTask`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input,
        callBackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/kie`,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Kie.ai error: ${response.status} — ${err}`);
    }

    const data = await response.json();

    if (data.code !== 200) {
      throw new Error(`Kie.ai error: ${data.msg || "Erro desconhecido"}`);
    }

    const taskId = data.data?.taskId;
    if (!taskId) throw new Error("Kie.ai não retornou taskId");

    return { jobId: taskId };
  },

  async getStatus(jobId: string): Promise<JobStatus> {
    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) throw new Error("KIE_API_KEY não configurada");

    const response = await fetch(
      `${KIE_BASE_URL}/recordInfo?taskId=${jobId}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Kie.ai status error: ${response.status}`);
    }

    const data = await response.json();
    const record = data.data;

    if (!record) {
      return { status: "processing" };
    }

    // Status: waiting, queuing, generating, success, fail
    if (record.state === "success") {
      let urls: string[] = [];

      // resultJson é uma string JSON com resultUrls
      if (record.resultJson) {
        try {
          const result = typeof record.resultJson === "string"
            ? JSON.parse(record.resultJson)
            : record.resultJson;
          urls = result.resultUrls || [];
        } catch {
          urls = [];
        }
      }

      return { status: "completed", outputUrls: urls };
    }

    if (record.state === "fail") {
      return {
        status: "failed",
        error: record.failMsg || "Geração falhou na Kie.ai",
      };
    }

    // waiting, queuing, generating → still processing
    return { status: "processing" };
  },
};
