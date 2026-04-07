import { createClient } from "@supabase/supabase-js";
import { CREDIT_COSTS, type CreditModel } from "@/lib/utils/credits";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function validateAndDebitCredits(
  userId: string,
  model: CreditModel,
  generationId?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const cost = CREDIT_COSTS[model];
  if (!cost) return { ok: false, error: `Modelo desconhecido: ${model}` };

  const supabase = getServiceClient();

  // Buscar saldo
  const { data: profile, error: fetchErr } = await supabase
    .from("profiles")
    .select("credits_balance")
    .eq("id", userId)
    .single();

  if (fetchErr || !profile) {
    return { ok: false, error: "Perfil não encontrado" };
  }

  if (profile.credits_balance < cost) {
    return { ok: false, error: `Créditos insuficientes (precisa: ${cost}, tem: ${profile.credits_balance})` };
  }

  // Debitar
  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ credits_balance: profile.credits_balance - cost })
    .eq("id", userId);

  if (updateErr) {
    return { ok: false, error: "Erro ao debitar créditos" };
  }

  // Registrar transação
  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: -cost,
    type: "generation",
    description: `Geração: ${model}`,
    generation_id: generationId || null,
  });

  return { ok: true };
}

export async function refundCredits(
  userId: string,
  model: CreditModel,
  generationId?: string
): Promise<void> {
  const cost = CREDIT_COSTS[model];
  if (!cost) return;

  const supabase = getServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_balance")
    .eq("id", userId)
    .single();

  if (!profile) return;

  await supabase
    .from("profiles")
    .update({ credits_balance: profile.credits_balance + cost })
    .eq("id", userId);

  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: cost,
    type: "refund",
    description: `Estorno: ${model}`,
    generation_id: generationId || null,
  });
}
