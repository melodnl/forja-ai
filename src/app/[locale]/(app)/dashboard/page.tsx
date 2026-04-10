"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Plus, MoreVertical, Trash2, Calendar, ImageIcon, Video, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { forceDownload } from "@/lib/download";
import { toast } from "sonner";
import type { Board } from "@/types/database";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardMetrics } from "@/components/shared/DashboardMetrics";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [recentAssets, setRecentAssets] = useState<{ id: string; url: string; type: string; filename: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const [boardsRes, assetsRes] = await Promise.all([
        supabase.from("boards").select("*").order("updated_at", { ascending: false }),
        supabase.from("assets").select("id, url, type, filename, created_at").order("created_at", { ascending: false }).limit(12),
      ]);

      if (boardsRes.error) toast.error(boardsRes.error.message);
      else setBoards((boardsRes.data as Board[]) || []);

      if (!assetsRes.error && assetsRes.data) setRecentAssets(assetsRes.data);

      setLoading(false);
    }
    fetchData();
  }, []);

  async function createBoard() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Usuário não autenticado. Faça login novamente.");
      return;
    }

    const { data, error } = await supabase
      .from("boards")
      .insert({ user_id: user.id, name: "Novo Board", nodes: [], edges: [] })
      .select()
      .single();

    if (error) {
      toast.error("Erro ao criar board: " + error.message);
      console.error("createBoard error:", error);
      return;
    }

    if (!data) {
      toast.error("Board não foi criado");
      return;
    }

    router.push(`/board/${data.id}`);
  }

  async function deleteBoard(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("boards").delete().eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    setBoards((prev) => prev.filter((b) => b.id !== id));
    toast.success("Board deletado");
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div>
      <DashboardMetrics />
      {/* Criações recentes */}
      {recentAssets.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--forja-text)] mb-4">Criações recentes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {recentAssets.map((asset) => (
              <div
                key={asset.id}
                className="group relative overflow-hidden rounded-lg border border-[var(--forja-border)] bg-[var(--forja-bg-elevated)] cursor-pointer transition-all hover:border-[var(--forja-ember)]/30"
                onClick={() => forceDownload(asset.url, asset.filename || `${asset.type}-${asset.id}`)}
              >
                {asset.type === "image" ? (
                  <img src={asset.url} alt="" className="aspect-square w-full object-cover" />
                ) : asset.type === "video" ? (
                  <div className="relative aspect-square w-full">
                    <video src={asset.url} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Video className="h-6 w-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-[var(--forja-bg)]">
                    <ImageIcon className="h-6 w-6 text-[var(--forja-text-muted)]" />
                  </div>
                )}
                {/* Overlay download */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all">
                  <Download className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {/* Badge tipo */}
                <div className="absolute top-1.5 left-1.5">
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${
                    asset.type === "image" ? "bg-[var(--forja-amber)]/20 text-[var(--forja-amber)]"
                    : asset.type === "video" ? "bg-[var(--forja-glow)]/20 text-[var(--forja-glow)]"
                    : "bg-[var(--forja-info)]/20 text-[var(--forja-info)]"
                  }`}>
                    {asset.type === "image" ? "IMG" : asset.type === "video" ? "VID" : "AUD"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <button
          onClick={createBoard}
          className="flex items-center gap-2 rounded-lg bg-[var(--forja-ember)] px-4 py-2 text-sm font-medium text-[var(--forja-bg)] transition-all duration-200 hover:bg-[var(--forja-ember-hover)] hover:shadow-[0_0_24px_rgba(255,107,26,0.15)]"
        >
          <Plus className="h-4 w-4" />
          {t("createFirst")}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-xl border border-[var(--forja-border)] bg-[var(--forja-bg-elevated)] animate-pulse"
            />
          ))}
        </div>
      ) : boards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--forja-border)] py-24">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--forja-bg-elevated)] mb-4">
            <Plus className="h-6 w-6 text-[var(--forja-text-muted)]" />
          </div>
          <p className="text-[var(--forja-text-muted)] text-sm mb-4">
            {t("empty")}
          </p>
          <button
            onClick={createBoard}
            className="flex items-center gap-2 rounded-lg bg-[var(--forja-ember)] px-4 py-2 text-sm font-medium text-[var(--forja-bg)] transition-all duration-200 hover:bg-[var(--forja-ember-hover)]"
          >
            <Plus className="h-4 w-4" />
            {t("createFirst")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {boards.map((board) => (
            <div
              key={board.id}
              onClick={() => router.push(`/board/${board.id}`)}
              className="group relative cursor-pointer rounded-xl border border-[var(--forja-border)] bg-[var(--forja-bg-elevated)] p-4 transition-all duration-200 hover:border-[var(--forja-ember)]/30 hover:shadow-[0_0_24px_rgba(255,107,26,0.08)]"
            >
              {/* Preview area — thumbnails reais */}
              {(() => {
                const nodes = (board.nodes as { type?: string; data?: { url?: string } }[]) || [];
                const mediaThumbs = nodes
                  .filter((n) => (n.type === "image" || n.type === "video") && n.data?.url)
                  .slice(0, 4);

                if (mediaThumbs.length === 0) {
                  return (
                    <div className="mb-3 flex h-28 items-center justify-center rounded-lg bg-[var(--forja-bg)]">
                      <span className="text-[10px] text-[var(--forja-text-dim)]">
                        {nodes.length > 0 ? `${nodes.length} nós` : "Vazio"}
                      </span>
                    </div>
                  );
                }

                return (
                  <div className={`mb-3 grid gap-1 rounded-lg overflow-hidden ${
                    mediaThumbs.length === 1 ? "grid-cols-1" : "grid-cols-2"
                  }`}>
                    {mediaThumbs.map((n, i) => (
                      <div key={i} className="relative aspect-square overflow-hidden bg-[var(--forja-bg)]">
                        {n.type === "video" ? (
                          <>
                            <video src={n.data?.url} className="h-full w-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <Video className="h-4 w-4 text-white/80" />
                            </div>
                          </>
                        ) : (
                          <img src={n.data?.url} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Info */}
              <h3 className="text-sm font-medium text-[var(--forja-text)] truncate">
                {board.name}
              </h3>
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3 text-[var(--forja-text-dim)]" />
                <span className="text-[11px] text-[var(--forja-text-dim)]">
                  {formatDate(board.updated_at)}
                </span>
                <span className="ml-auto text-[11px] text-[var(--forja-text-dim)]">
                  {((board.nodes as unknown[]) || []).length} nós
                </span>
              </div>

              {/* Menu */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[var(--forja-bg-hover)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4 text-[var(--forja-text-muted)]" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-[var(--forja-bg-overlay)] border-[var(--forja-border)]"
                  >
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBoard(board.id);
                      }}
                      className="text-[var(--forja-error)] cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Deletar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
