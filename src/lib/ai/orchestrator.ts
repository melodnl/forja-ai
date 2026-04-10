import type { AIProvider, GenerateParams, JobStatus } from "@/types/ai";
import { kieProvider } from "./providers/kie";
import { falProvider } from "./providers/fal";
import { veniceProvider } from "./providers/venice";
import { googleProvider } from "./providers/google";

const VIDEO_MODELS = [
  "seedance-2",
  "seedance-2-fast",
  "seedance-1.5-pro",
  "veo3",
  "veo3-quality",
  "veo3-fast",
  "veo3-lite",
  "runway",
  "grok-video",
  "sora-2-characters",
];

export function getGenerationType(model: string): "image" | "video" {
  if (VIDEO_MODELS.includes(model)) return "video";
  return "image";
}

function getProviderByName(name: string): AIProvider {
  const map: Record<string, AIProvider> = {
    kie: kieProvider,
    fal: falProvider,
    venice: veniceProvider,
    google: googleProvider,
  };
  return map[name] || kieProvider;
}

export async function generateWithProvider(
  params: GenerateParams & { provider?: string }
): Promise<{ jobId: string; provider: string }> {
  const providerName = params.provider || "kie";
  const primary = getProviderByName(providerName);

  try {
    const result = await primary.generate(params);
    return { jobId: result.jobId, provider: primary.name };
  } catch (err) {
    // Google: NÃO fazer fallback — mostrar erro real pro usuário
    if (providerName === "google") {
      throw err;
    }

    // Outros: fallback pra outro provider
    const fallbackName = providerName === "kie" ? "venice" : "kie";
    const fallback = getProviderByName(fallbackName);

    console.warn(`[orchestrator] ${primary.name} falhou, tentando ${fallback.name}:`, err);

    try {
      const result = await fallback.generate(params);
      return { jobId: result.jobId, provider: fallback.name };
    } catch {
      throw err;
    }
  }
}

// Backward compat
export async function generateWithFallback(
  params: GenerateParams
): Promise<{ jobId: string; provider: string }> {
  return generateWithProvider(params);
}

export async function getJobStatus(
  provider: string,
  jobId: string
): Promise<JobStatus> {
  const p = getProviderByName(provider);
  return p.getStatus(jobId);
}
