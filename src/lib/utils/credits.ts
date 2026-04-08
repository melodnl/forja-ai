export const CREDIT_COSTS = {
  // Imagem
  "grok-imagine": 5,
  "imagen4-ultra": 10,
  "imagen4": 8,
  "ideogram-v3": 8,
  "qwen": 5,
  "grok-img2img": 5,

  // Vídeo
  "seedance-2": 20,
  "seedance-2-fast": 15,
  "seedance-1.5-pro": 25,
  "grok-video": 15,

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
} as const;

export type CreditModel = keyof typeof CREDIT_COSTS;

export function getCreditCost(model: CreditModel): number {
  return CREDIT_COSTS[model];
}
