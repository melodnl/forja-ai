import type { AIProvider, GenerateParams, JobStatus } from "@/types/ai";

const FAL_MODEL_MAP: Record<string, string> = {
  "flux-pro-1.1": "fal-ai/flux-pro/v1.1",
  "ideogram-v3": "fal-ai/ideogram/v3",
  "seedream-4": "fal-ai/seedream/v4",
  "nano-banana-2": "fal-ai/flux-pro/v1.1", // fallback
};

const ASPECT_TO_SIZE: Record<string, string> = {
  "1:1": "square_hd",
  "9:16": "portrait_16_9",
  "16:9": "landscape_16_9",
  "4:5": "portrait_4_3",
  "3:4": "portrait_4_3",
};

export const falProvider: AIProvider = {
  name: "fal",

  async generate(params: GenerateParams): Promise<{ jobId: string }> {
    const apiKey = process.env.FAL_API_KEY;
    if (!apiKey) throw new Error("FAL_API_KEY não configurada");

    const model = FAL_MODEL_MAP[params.model];
    if (!model) throw new Error(`Modelo ${params.model} não suportado no Fal.ai`);

    const response = await fetch(`https://queue.fal.run/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: params.prompt,
        image_size: ASPECT_TO_SIZE[params.aspectRatio || "1:1"] || "square_hd",
        num_images: params.variants || 1,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Fal.ai error: ${response.status} — ${err}`);
    }

    const data = await response.json();
    return { jobId: data.request_id };
  },

  async getStatus(jobId: string): Promise<JobStatus> {
    const apiKey = process.env.FAL_API_KEY;
    if (!apiKey) throw new Error("FAL_API_KEY não configurada");

    const response = await fetch(
      `https://queue.fal.run/requests/${jobId}/status`,
      {
        headers: { Authorization: `Key ${apiKey}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Fal.ai status error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "COMPLETED") {
      const urls = (data.response?.images || []).map(
        (img: { url: string }) => img.url
      );
      return { status: "completed", outputUrls: urls };
    }

    if (data.status === "FAILED") {
      return { status: "failed", error: data.error || "Geração falhou" };
    }

    return { status: "processing" };
  },
};
