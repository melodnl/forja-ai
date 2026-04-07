import type { AIProvider, GenerateParams, JobStatus } from "@/types/ai";
import { kieProvider } from "./providers/kie";
import { falProvider } from "./providers/fal";
import { veniceProvider } from "./providers/venice";

const VIDEO_MODELS = [
  "seedance-2",
  "seedance-2-fast",
  "seedance-1.5-pro",
  "veo-3",
  "kling-3",
  "runway-gen-4",
  "hailuo-02",
  "wan-2-1",
  "sora-2",
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
    // Fallback: se Kie falhou, tenta Venice. Se Venice falhou, tenta Kie.
    const fallbackName = providerName === "kie" ? "venice" : "kie";
    const fallback = getProviderByName(fallbackName);

    console.warn(`[orchestrator] ${primary.name} falhou, tentando ${fallback.name}:`, err);

    try {
      const result = await fallback.generate(params);
      return { jobId: result.jobId, provider: fallback.name };
    } catch {
      throw err; // Propaga erro original se fallback também falhar
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
