import type { AIProvider, GenerateParams, JobStatus } from "@/types/ai";
import { createClient } from "@supabase/supabase-js";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

const IMAGE_MODELS: Record<string, string> = {
  "nano-banana-2": "gemini-2.0-flash-preview-image-generation",
  "nano-banana-pro": "gemini-2.5-pro-preview-06-05",
  "nano-banana": "gemini-2.0-flash-exp",
  "imagen4-fast": "imagen-4.0-generate-preview-05-20",
  "imagen4": "imagen-4.0-generate-preview-05-20",
  "imagen4-ultra": "imagen-4.0-ultra-generate-exp-05-20",
};

const VIDEO_MODELS: Record<string, string> = {
  "veo3": "veo-3.0-generate-preview",
  "veo3-fast": "veo-3.0-generate-preview",
};

// Resultados síncronos ficam aqui pra polling
const resultCache = new Map<string, { urls: string[]; type: "image" | "video" }>();

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function uploadBase64ToStorage(base64Data: string, mimeType: string, userId: string): Promise<string> {
  const supabase = getServiceClient();
  const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
  const path = `${userId}/google-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

  const buffer = Buffer.from(base64Data, "base64");
  await supabase.storage.from("generations").upload(path, buffer, { contentType: mimeType, upsert: true });
  const { data } = supabase.storage.from("generations").getPublicUrl(path);
  return data.publicUrl;
}

export const googleProvider: AIProvider = {
  name: "google",

  async generate(params: GenerateParams): Promise<{ jobId: string }> {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY não configurada");

    const isVideo = !!VIDEO_MODELS[params.model];
    const isImagen = params.model.startsWith("imagen4");

    if (isVideo) {
      return generateVeo(apiKey, params);
    }

    if (isImagen) {
      return generateImagen(apiKey, params);
    }

    return generateGeminiImage(apiKey, params);
  },

  async getStatus(jobId: string): Promise<JobStatus> {
    const cached = resultCache.get(jobId);
    if (cached) {
      resultCache.delete(jobId);
      return { status: "completed", outputUrls: cached.urls };
    }

    // Veo pode ser assíncrono
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) return { status: "processing" };

    try {
      const res = await fetch(`${GEMINI_BASE}/operations/${jobId}?key=${apiKey}`);
      if (!res.ok) return { status: "processing" };
      const data = await res.json();

      if (data.done) {
        const videos = data.response?.generatedVideos || [];
        const urls = videos.map((v: { video: { uri: string } }) => v.video.uri);
        if (urls.length > 0) return { status: "completed", outputUrls: urls };
        return { status: "failed", error: "Nenhum vídeo gerado" };
      }
      return { status: "processing" };
    } catch {
      return { status: "processing" };
    }
  },
};

// Gemini nativo (Nano Banana)
async function generateGeminiImage(apiKey: string, params: GenerateParams): Promise<{ jobId: string }> {
  const model = IMAGE_MODELS[params.model] || "gemini-2.0-flash-preview-image-generation";

  const res = await fetch(
    `${GEMINI_BASE}/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Generate an image: ${params.prompt}. Aspect ratio: ${params.aspectRatio || "1:1"}` }],
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Gemini error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imageUrls: string[] = [];

  // Upload base64 pro Supabase Storage
  for (const part of parts) {
    if (part.inlineData) {
      try {
        const url = await uploadBase64ToStorage(
          part.inlineData.data,
          part.inlineData.mimeType || "image/png",
          "google-gen"
        );
        imageUrls.push(url);
      } catch {
        // Fallback: data URL
        imageUrls.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
      }
    }
  }

  const jobId = `google-${Date.now()}`;
  if (imageUrls.length > 0) {
    resultCache.set(jobId, { urls: imageUrls, type: "image" });
  }

  return { jobId };
}

// Imagen 4
async function generateImagen(apiKey: string, params: GenerateParams): Promise<{ jobId: string }> {
  const model = IMAGE_MODELS[params.model] || "imagen-4.0-generate-preview-05-20";

  const res = await fetch(
    `${GEMINI_BASE}/models/${model}:predict?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: params.prompt }],
        parameters: {
          sampleCount: params.variants || 1,
          aspectRatio: params.aspectRatio || "1:1",
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Imagen error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const predictions = data.predictions || [];
  const imageUrls: string[] = [];

  for (const p of predictions) {
    if (p.bytesBase64Encoded) {
      try {
        const url = await uploadBase64ToStorage(
          p.bytesBase64Encoded,
          p.mimeType || "image/png",
          "google-gen"
        );
        imageUrls.push(url);
      } catch {
        imageUrls.push(`data:${p.mimeType || "image/png"};base64,${p.bytesBase64Encoded}`);
      }
    }
  }

  const jobId = `google-img-${Date.now()}`;
  if (imageUrls.length > 0) {
    resultCache.set(jobId, { urls: imageUrls, type: "image" });
  }

  return { jobId };
}

// Veo 3
async function generateVeo(apiKey: string, params: GenerateParams): Promise<{ jobId: string }> {
  const model = VIDEO_MODELS[params.model] || "veo-3.0-generate-preview";

  const res = await fetch(
    `${GEMINI_BASE}/models/${model}:predictLongRunning?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: params.prompt }],
        parameters: {
          aspectRatio: params.aspectRatio || "16:9",
          personGeneration: "allow_all",
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Veo error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const operationName = data.name;

  if (operationName) {
    return { jobId: operationName };
  }

  if (data.response?.generatedVideos) {
    const urls = data.response.generatedVideos.map((v: { video: { uri: string } }) => v.video.uri);
    const jobId = `google-veo-${Date.now()}`;
    resultCache.set(jobId, { urls, type: "video" });
    return { jobId };
  }

  throw new Error("Google Veo não retornou resultado");
}
