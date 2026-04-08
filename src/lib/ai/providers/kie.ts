import type { AIProvider, GenerateParams, JobStatus } from "@/types/ai";

const KIE_BASE = "https://api.kie.ai/api/v1";

// Modelos que usam /jobs/createTask
const JOBS_MODEL_MAP: Record<string, string> = {
  // Imagem ✅
  "grok-imagine": "grok-imagine/text-to-image",
  "imagen4-ultra": "google/imagen4-ultra",
  "imagen4": "google/imagen4",
  "ideogram-v3": "ideogram/v3-text-to-image",
  "qwen": "qwen/text-to-image",
  "grok-img2img": "grok-imagine/image-to-image",
  // Vídeo via /jobs ✅
  "seedance-2": "bytedance/seedance-2",
  "seedance-2-fast": "bytedance/seedance-2-fast",
  "seedance-1.5-pro": "bytedance/seedance-1.5-pro",
  "grok-video": "grok-imagine/text-to-video",
  "sora-2-characters": "sora-2-characters",
  // Utilitários
  "upscale": "recraft/crisp-upscale",
};

// Modelos com endpoint próprio (não usam /jobs/createTask)
const SPECIAL_ENDPOINTS: Record<string, string> = {
  "veo3-quality": "veo",
  "veo3-fast": "veo",
  "veo3-lite": "veo",
  "runway": "runway",
};

const VEO_MODEL_MAP: Record<string, string> = {
  "veo3-quality": "veo3",
  "veo3-fast": "veo3_fast",
  "veo3-lite": "veo3_lite",
};

export const kieProvider: AIProvider = {
  name: "kie",

  async generate(params: GenerateParams): Promise<{ jobId: string }> {
    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) throw new Error("KIE_API_KEY não configurada");

    const specialEndpoint = SPECIAL_ENDPOINTS[params.model];

    if (specialEndpoint === "veo") {
      return generateVeo(apiKey, params);
    }

    if (specialEndpoint === "runway") {
      return generateRunway(apiKey, params);
    }

    // Default: /jobs/createTask
    return generateViaJobs(apiKey, params);
  },

  async getStatus(jobId: string): Promise<JobStatus> {
    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) throw new Error("KIE_API_KEY não configurada");

    // Tentar /jobs/recordInfo (funciona pra Seedance, Grok, Imagen, Ideogram)
    const response = await fetch(
      `${KIE_BASE}/jobs/recordInfo?taskId=${jobId}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    if (!response.ok) {
      // Veo3 e Runway não suportam polling — dependem do webhook
      return { status: "processing" };
    }

    const data = await response.json();
    const record = data.data;

    // recordInfo null = modelo usa webhook (Veo3/Runway)
    if (!record || data.code === 422) return { status: "processing" };

    if (record.state === "success") {
      let urls: string[] = [];
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
      return { status: "failed", error: record.failMsg || "Geração falhou" };
    }

    return { status: "processing" };
  },
};

// ---- /jobs/createTask (Seedance, Grok, Imagen, Ideogram, etc.) ----
async function generateViaJobs(apiKey: string, params: GenerateParams): Promise<{ jobId: string }> {
  const model = JOBS_MODEL_MAP[params.model] || params.model;

  const input: Record<string, unknown> = { prompt: params.prompt };
  if (params.imageUrls?.length) input.image_urls = params.imageUrls;
  if (params.aspectRatio) input.aspect_ratio = params.aspectRatio;
  if (params.format) input.output_format = params.format;

  // Seedance precisa de web_search
  if (params.model.startsWith("seedance")) {
    input.web_search = false;
  }

  const res = await fetch(`${KIE_BASE}/jobs/createTask`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      input,
      callBackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/kie`,
    }),
  });

  const data = await res.json();
  if (data.code !== 200) throw new Error(`Kie.ai: ${data.msg}`);
  return { jobId: data.data?.taskId };
}

// ---- /veo/generate (Veo 3 Quality/Fast/Lite) ----
async function generateVeo(apiKey: string, params: GenerateParams): Promise<{ jobId: string }> {
  const model = VEO_MODEL_MAP[params.model] || "veo3_fast";

  const body: Record<string, unknown> = {
    prompt: params.prompt,
    model,
    aspect_ratio: params.aspectRatio || "16:9",
    callBackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/kie`,
    enableTranslation: true,
    watermark: "",
  };

  if (params.imageUrls?.length) {
    body.imageUrls = params.imageUrls;
    body.generationType = "REFERENCE_2_VIDEO";
  }

  const res = await fetch(`${KIE_BASE}/veo/generate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (data.code !== 200) throw new Error(`Kie.ai Veo: ${data.msg}`);
  return { jobId: data.data?.taskId };
}

// ---- /runway/generate (Runway Gen-4) ----
async function generateRunway(apiKey: string, params: GenerateParams): Promise<{ jobId: string }> {
  const body: Record<string, unknown> = {
    prompt: params.prompt,
    duration: 5,
    quality: "720p",
    aspectRatio: params.aspectRatio || "16:9",
    waterMark: "",
    callBackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/kie`,
  };

  if (params.imageUrls?.length) {
    body.imageUrl = params.imageUrls[0];
  }

  const res = await fetch(`${KIE_BASE}/runway/generate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (data.code !== 200) throw new Error(`Kie.ai Runway: ${data.msg}`);
  return { jobId: data.data?.taskId };
}
