export const APP_NAME = "Forjea";
export const APP_TAGLINE = "Forje criativos com IA. Conecte. Gere. Lucre.";

export const PLANS = ["free", "starter", "pro", "business"] as const;
export type Plan = (typeof PLANS)[number];

export const LOCALES = ["pt-BR", "es", "en"] as const;
