export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  locale: "pt-BR" | "es" | "en";
  credits_balance: number;
  plan: "free" | "starter" | "pro" | "business";
  created_at: string;
  updated_at: string;
};

export type Board = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  nodes: unknown[];
  edges: unknown[];
  viewport: { x: number; y: number; zoom: number };
  is_template: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type Generation = {
  id: string;
  user_id: string;
  board_id: string | null;
  node_id: string | null;
  type: "image" | "video" | "voice" | "copy" | "upscale" | "remove_bg" | "ugc_avatar";
  provider: string;
  model: string;
  status: "pending" | "processing" | "completed" | "failed";
  prompt: string | null;
  input_data: Record<string, unknown> | null;
  output_urls: string[] | null;
  error_message: string | null;
  credits_used: number;
  external_job_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type Asset = {
  id: string;
  user_id: string;
  generation_id: string | null;
  type: "image" | "video" | "audio";
  url: string;
  thumbnail_url: string | null;
  filename: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  metadata: Record<string, unknown>;
  tags: string[] | null;
  is_favorite: boolean;
  created_at: string;
};

export type CreditTransaction = {
  id: string;
  user_id: string;
  amount: number;
  type: "purchase" | "generation" | "refund" | "bonus" | "subscription";
  description: string | null;
  generation_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};
