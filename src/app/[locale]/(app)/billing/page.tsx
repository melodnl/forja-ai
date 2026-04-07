"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Flame, TrendingDown, TrendingUp, CreditCard, Loader2 } from "lucide-react";
import type { CreditTransaction, Profile } from "@/types/database";

const PLANS = [
  { id: "free", name: "Free", credits: 100, price: "Grátis", current: true },
  { id: "starter", name: "Starter", credits: 1000, price: "R$ 49/mês", current: false },
  { id: "pro", name: "Pro", credits: 5000, price: "R$ 149/mês", current: false },
  { id: "business", name: "Business", credits: 20000, price: "R$ 399/mês", current: false },
];

export default function BillingPage() {
  const t = useTranslations("nav");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, txRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("credit_transactions").select("*").order("created_at", { ascending: false }).limit(50),
      ]);

      if (profileRes.data) setProfile(profileRes.data as Profile);
      if (txRes.data) setTransactions(txRes.data as CreditTransaction[]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--forja-ember)]" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">{t("billing")}</h1>

      {/* Saldo */}
      <div className="mb-8 rounded-xl border border-[var(--forja-border)] bg-[var(--forja-bg-elevated)] p-6">
        <div className="flex items-center gap-3 mb-2">
          <Flame className="h-6 w-6 text-[var(--forja-ember)]" />
          <span className="text-sm text-[var(--forja-text-muted)]">Saldo de créditos</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-[var(--forja-text)]">{profile?.credits_balance ?? 0}</span>
          <span className="text-sm text-[var(--forja-text-dim)]">créditos</span>
        </div>
        <div className="mt-2">
          <span className="inline-flex items-center rounded-full bg-[var(--forja-ember)]/10 px-2.5 py-0.5 text-xs text-[var(--forja-ember)]">
            Plano: {profile?.plan || "free"}
          </span>
        </div>
      </div>

      {/* Planos */}
      <h2 className="text-lg font-semibold mb-4">Planos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        {PLANS.map((plan) => {
          const isCurrent = profile?.plan === plan.id;
          return (
            <div
              key={plan.id}
              className={`rounded-xl border p-5 transition-all ${
                isCurrent
                  ? "border-[var(--forja-ember)] bg-[var(--forja-bg-elevated)] shadow-[0_0_24px_rgba(255,107,26,0.1)]"
                  : "border-[var(--forja-border)] bg-[var(--forja-bg-elevated)] hover:border-[var(--forja-ember)]/30"
              }`}
            >
              <h3 className="text-sm font-medium text-[var(--forja-text)]">{plan.name}</h3>
              <p className="text-2xl font-bold text-[var(--forja-text)] mt-1">{plan.price}</p>
              <p className="text-xs text-[var(--forja-text-muted)] mt-1">
                {plan.credits.toLocaleString()} créditos/mês
              </p>
              {isCurrent ? (
                <span className="mt-3 inline-block rounded bg-[var(--forja-ember)] px-3 py-1 text-xs font-medium text-[var(--forja-bg)]">
                  Plano atual
                </span>
              ) : (
                <button className="mt-3 inline-block rounded border border-[var(--forja-border)] px-3 py-1 text-xs text-[var(--forja-text-muted)] hover:border-[var(--forja-ember)] hover:text-[var(--forja-ember)] transition-colors">
                  Upgrade
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Histórico */}
      <h2 className="text-lg font-semibold mb-4">Histórico de créditos</h2>
      {transactions.length === 0 ? (
        <p className="text-sm text-[var(--forja-text-muted)]">Nenhuma transação ainda.</p>
      ) : (
        <div className="rounded-xl border border-[var(--forja-border)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--forja-border)] bg-[var(--forja-bg-elevated)]">
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--forja-text-muted)]">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--forja-text-muted)]">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--forja-text-muted)]">Descrição</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[var(--forja-text-muted)]">Créditos</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-[var(--forja-border)] last:border-0">
                  <td className="px-4 py-3 text-xs text-[var(--forja-text-dim)]">
                    {new Date(tx.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs ${
                      tx.amount > 0 ? "text-[var(--forja-success)]" : "text-[var(--forja-text-muted)]"
                    }`}>
                      {tx.amount > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--forja-text)]">{tx.description || "—"}</td>
                  <td className={`px-4 py-3 text-right text-xs font-medium ${
                    tx.amount > 0 ? "text-[var(--forja-success)]" : "text-[var(--forja-text)]"
                  }`}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
