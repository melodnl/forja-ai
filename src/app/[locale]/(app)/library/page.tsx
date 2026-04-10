"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { forceDownload } from "@/lib/download";
import { toast } from "sonner";
import { Download, Heart, Image as ImageIcon, Video, Volume2, Trash2, X } from "lucide-react";
import type { Asset } from "@/types/database";

const TYPE_ICONS = { image: ImageIcon, video: Video, audio: Volume2 };
const TYPE_COLORS = { image: "var(--forja-amber)", video: "var(--forja-glow)", audio: "var(--forja-success)" };

export default function LibraryPage() {
  const t = useTranslations("nav");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "image" | "video" | "audio">("all");
  const [expanded, setExpanded] = useState<Asset | null>(null);

  useEffect(() => {
    async function fetchAssets() {
      const supabase = createClient();
      let query = supabase.from("assets").select("*").order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("type", filter);
      const { data, error } = await query;
      if (error) toast.error(error.message);
      else setAssets((data as Asset[]) || []);
      setLoading(false);
    }
    fetchAssets();
  }, [filter]);

  async function toggleFavorite(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from("assets").update({ is_favorite: !current }).eq("id", id);
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, is_favorite: !current } : a)));
  }

  async function deleteAsset(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("assets").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setAssets((prev) => prev.filter((a) => a.id !== id));
    toast.success("Asset deletado");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("library")}</h1>
        <div className="flex gap-1">
          {(["all", "image", "video", "audio"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                filter === f
                  ? "bg-[var(--forja-ember)] text-[var(--forja-bg)]"
                  : "text-[var(--forja-text-muted)] hover:bg-[var(--forja-bg-hover)]"
              }`}
            >
              {f === "all" ? "Todos" : f === "image" ? "Imagens" : f === "video" ? "Vídeos" : "Áudios"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-[var(--forja-bg-elevated)] animate-pulse" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--forja-border)] py-24">
          <ImageIcon className="h-10 w-10 text-[var(--forja-text-dim)] mb-3" />
          <p className="text-sm text-[var(--forja-text-muted)]">Nenhum asset ainda. Gere criativos no canvas!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {assets.map((asset) => {
            const Icon = TYPE_ICONS[asset.type as keyof typeof TYPE_ICONS] || ImageIcon;
            const color = TYPE_COLORS[asset.type as keyof typeof TYPE_COLORS] || "var(--forja-text-muted)";
            return (
              <div
                key={asset.id}
                onClick={() => forceDownload(asset.url, asset.filename || `${asset.type}-${asset.id}`)}
                className="group relative overflow-hidden rounded-lg border border-[var(--forja-border)] bg-[var(--forja-bg-elevated)] cursor-pointer"
              >
                {asset.type === "image" ? (
                  <img src={asset.url} alt="" className="aspect-square w-full object-cover" />
                ) : asset.type === "video" ? (
                  <video src={asset.url} className="aspect-square w-full object-cover" />
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-[var(--forja-bg)]">
                    <Volume2 className="h-8 w-8" style={{ color }} />
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 via-transparent to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => toggleFavorite(asset.id, asset.is_favorite)}
                      className="rounded bg-black/50 p-1"
                    >
                      <Heart className={`h-3 w-3 ${asset.is_favorite ? "fill-[var(--forja-ember)] text-[var(--forja-ember)]" : "text-white"}`} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); forceDownload(asset.url, asset.filename || undefined); }} className="rounded bg-black/50 p-1">
                      <Download className="h-3 w-3 text-white" />
                    </button>
                    <button onClick={() => deleteAsset(asset.id)} className="rounded bg-black/50 p-1">
                      <Trash2 className="h-3 w-3 text-[var(--forja-error)]" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon className="h-3 w-3" style={{ color }} />
                    <span className="text-[10px] text-white/70">
                      {new Date(asset.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de expansão */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setExpanded(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fechar */}
            <button
              onClick={() => setExpanded(null)}
              className="absolute -top-10 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--forja-bg-elevated)] border border-[var(--forja-border)] text-[var(--forja-text-muted)] hover:text-[var(--forja-text)] transition-colors z-10"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Mídia */}
            {expanded.type === "image" ? (
              <img
                src={expanded.url}
                alt=""
                className="max-w-full max-h-[80vh] rounded-lg object-contain"
              />
            ) : expanded.type === "video" ? (
              <video
                src={expanded.url}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] rounded-lg"
              />
            ) : (
              <audio src={expanded.url} controls autoPlay className="w-full max-w-lg" />
            )}

            {/* Ações */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => forceDownload(expanded.url, expanded.filename || undefined)}
                className="flex items-center gap-2 rounded-lg bg-[var(--forja-ember)] px-4 py-2 text-sm font-medium text-[var(--forja-bg)] hover:bg-[var(--forja-ember-hover)] transition-colors"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
              <button
                onClick={() => { toggleFavorite(expanded.id, expanded.is_favorite); setExpanded({ ...expanded, is_favorite: !expanded.is_favorite }); }}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
                  expanded.is_favorite
                    ? "border-[var(--forja-ember)] text-[var(--forja-ember)]"
                    : "border-[var(--forja-border)] text-[var(--forja-text-muted)] hover:border-[var(--forja-ember)]"
                }`}
              >
                <Heart className={`h-4 w-4 ${expanded.is_favorite ? "fill-[var(--forja-ember)]" : ""}`} />
                {expanded.is_favorite ? "Favoritado" : "Favoritar"}
              </button>
              <button
                onClick={() => { deleteAsset(expanded.id); setExpanded(null); }}
                className="flex items-center gap-2 rounded-lg border border-[var(--forja-error)]/30 px-4 py-2 text-sm text-[var(--forja-error)] hover:bg-[var(--forja-error)]/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Deletar
              </button>
              <span className="text-xs text-[var(--forja-text-dim)] ml-2">
                {new Date(expanded.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
