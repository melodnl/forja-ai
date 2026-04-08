"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ImageIcon, Video, Flame, TrendingDown } from "lucide-react";

interface Metrics {
  totalImages: number;
  totalVideos: number;
  totalCreditsUsed: number;
  topModel: string;
}

export function DashboardMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [genRes, txRes] = await Promise.all([
        supabase.from("generations").select("type, model, status").eq("user_id", user.id),
        supabase.from("credit_transactions").select("amount, type").eq("user_id", user.id).eq("type", "generation"),
      ]);

      const gens = genRes.data || [];
      const txs = txRes.data || [];

      const totalImages = gens.filter((g) => g.type === "image" && g.status === "completed").length;
      const totalVideos = gens.filter((g) => g.type === "video" && g.status === "completed").length;
      const totalCreditsUsed = Math.abs(txs.reduce((sum, t) => sum + t.amount, 0));

      // Modelo mais usado
      const modelCounts: Record<string, number> = {};
      gens.forEach((g) => { modelCounts[g.model] = (modelCounts[g.model] || 0) + 1; });
      const topModel = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

      setMetrics({ totalImages, totalVideos, totalCreditsUsed, topModel });
    }
    load();
  }, []);

  if (!metrics) return null;

  const cards = [
    { label: "Imagens geradas", value: metrics.totalImages, icon: ImageIcon, color: "var(--forja-amber)" },
    { label: "Vídeos gerados", value: metrics.totalVideos, icon: Video, color: "var(--forja-glow)" },
    { label: "Créditos usados", value: metrics.totalCreditsUsed, icon: TrendingDown, color: "var(--forja-ember)" },
    { label: "Modelo favorito", value: metrics.topModel, icon: Flame, color: "var(--forja-info)" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="rounded-xl border border-[var(--forja-border)] bg-[var(--forja-bg-elevated)] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="h-4 w-4" style={{ color }} />
            <span className="text-[10px] text-[var(--forja-text-muted)]">{label}</span>
          </div>
          <span className="text-lg font-bold text-[var(--forja-text)]">{value}</span>
        </div>
      ))}
    </div>
  );
}
