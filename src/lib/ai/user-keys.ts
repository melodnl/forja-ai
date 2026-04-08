import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Busca a API key do usuário pra um provider específico.
 * Retorna a key do usuário se existir, senão retorna a key da plataforma (.env).
 */
export async function getUserApiKey(
  userId: string,
  provider: string
): Promise<string | null> {
  const supabase = getServiceClient();

  const { data } = await supabase
    .from("user_api_keys")
    .select("encrypted_key")
    .eq("user_id", userId)
    .eq("provider", provider)
    .eq("is_active", true)
    .single();

  return data?.encrypted_key || null;
}

/**
 * Retorna a key pra usar: prioriza a do usuário, fallback pra plataforma.
 */
export async function resolveApiKey(
  userId: string,
  provider: string,
  envKey: string | undefined
): Promise<string> {
  const userKey = await getUserApiKey(userId, provider);
  if (userKey) return userKey;
  if (envKey) return envKey;
  throw new Error(`API key não configurada para ${provider}`);
}
