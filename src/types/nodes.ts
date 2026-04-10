export type ForjaNodeType =
  | "image"
  | "prompt"
  | "creative"
  | "video"
  | "voice"
  | "copy"
  | "upscale"
  | "remove_bg"
  | "ugc_avatar"
  | "assistant"
  | "reference"
  | "avatar"
  | "template";

export interface ImageNodeData {
  label: string;
  url?: string;
  width?: number;
  height?: number;
  filename?: string;
}

export interface PromptNodeData {
  label: string;
  text: string;
}

export interface CreativeNodeData {
  label: string;
  model: string;
  aspectRatio: string;
  resolution: string;
  format: string;
  prompt: string;
  variants: number;
  status: "idle" | "generating" | "completed" | "failed";
  outputUrls: string[];
}

export interface VideoNodeData {
  label: string;
  url?: string;
  duration?: number;
}

export interface VoiceNodeData {
  label: string;
  provider: string;
  voice: string;
  stability: number;
  similarity: number;
  text: string;
  url?: string;
  duration?: number;
}

export interface CopyNodeData {
  label: string;
  model: string;
  type: string;
  tone: string;
  language: string;
  briefing: string;
  variations: number;
  outputs: string[];
}

export interface ReferenceNodeData {
  label: string;
  url?: string;
  width?: number;
  height?: number;
  filename?: string;
}

export const NODE_DEFAULTS: Record<ForjaNodeType, Record<string, unknown>> = {
  image: { label: "Imagem", url: "", width: 0, height: 0, filename: "" },
  prompt: { label: "Prompt", text: "" },
  creative: {
    label: "Criativo",
    model: "nano-banana-2",
    aspectRatio: "1:1",
    resolution: "1K",
    format: "png",
    prompt: "",
    variants: 1,
    status: "idle",
    outputUrls: [],
  },
  video: { label: "Video", url: "", duration: 0 },
  voice: {
    label: "Voz",
    provider: "elevenlabs",
    voice: "",
    stability: 0.5,
    similarity: 0.75,
    text: "",
    url: "",
  },
  copy: {
    label: "Copy",
    model: "claude-sonnet-4-5",
    type: "headline",
    tone: "persuasivo",
    language: "pt-BR",
    briefing: "",
    variations: 3,
    outputs: [],
  },
  assistant: {
    label: "Assistente IA",
    model: "gemini-3-flash",
    messages: [],
    sources: 0,
  },
  reference: { label: "img1", url: "", width: 0, height: 0, filename: "" },
  avatar: { label: "avatar1", url: "", filename: "" },
  upscale: { label: "Upscale" },
  remove_bg: { label: "Remover Fundo" },
  ugc_avatar: { label: "UGC Avatar" },
  template: { label: "Template" },
};
