export const CREDIT_COSTS = {
  // Imagem
  "nano-banana-2": 5,
  "nano-banana": 4,
  "flux-pro-1.1": 5,
  "ideogram-v3": 8,
  "seedream-4": 4,
  "gpt-image-1": 10,

  // Vídeo
  "seedance-2": 20,
  "seedance-2-fast": 15,
  "seedance-1.5-pro": 25,
  "veo-3": 50,
  "kling-3": 25,
  "runway-gen-4": 25,
  "hailuo-02": 20,
  "wan-2-1": 15,
  "sora-2": 30,

  // Voz (por 1k caracteres)
  elevenlabs: 5,
  "fish-audio": 2,

  // Copy (por 1k tokens output)
  "claude-sonnet-4-5": 3,
  "gpt-4-1": 3,
  "gemini-2-0": 2,

  // Utilidades
  "upscale-2x": 3,
  "upscale-4x": 8,
  "remove-bg": 2,
  "ugc-avatar-10s": 80,
} as const;

export type CreditModel = keyof typeof CREDIT_COSTS;

export function getCreditCost(model: CreditModel): number {
  return CREDIT_COSTS[model];
}
