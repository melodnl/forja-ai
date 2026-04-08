export const CREDIT_COSTS = {
  // Imagem
  "grok-imagine": 5,
  "nano-banana-2": 3,
  "nano-banana-pro": 5,
  "nano-banana": 3,
  "imagen4-ultra": 8,
  "imagen4": 5,
  "imagen4-fast": 3,
  "ideogram-v3": 8,
  "qwen": 5,
  "grok-img2img": 5,

  // Vídeo
  "seedance-2": 20,
  "seedance-2-fast": 15,
  "seedance-1.5-pro": 25,
  "veo3-quality": 50,
  "veo3-fast": 30,
  "veo3-lite": 15,
  "veo3": 40,
  "runway": 25,
  "grok-video": 15,
  "sora-2-characters": 30,

  // Voz
  elevenlabs: 5,
  "fish-audio": 2,

  // Copy
  "claude-sonnet-4-5": 3,
  "gpt-4-1": 3,
  "gemini-2-0": 2,

  // Utilidades
  "upscale-2x": 3,
  "upscale-4x": 8,
  "remove-bg": 2,
} as const;

export type CreditModel = keyof typeof CREDIT_COSTS;

export function getCreditCost(model: CreditModel): number {
  return CREDIT_COSTS[model];
}
