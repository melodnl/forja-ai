"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Plus, MoreVertical, Trash2, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBoards() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("boards")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) {
        toast.error(error.message);
      } else {
        setBoards((data as Board[]) || []);
      }
      setLoading(false);
    }
    fetchBoards();
  }, []);

  async function createBoard() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    const { data, error } = await supabase
      .from("boards")
      .insert({ user_id: user.id, name: "Novo Board" })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
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
              {/* Preview area */}
              <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-[var(--forja-bg)]">
                <div className="flex gap-1">
                  {((board.nodes as unknown[]) || []).slice(0, 3).map((_, i) => (
                    <div
                      key={i}
                      className="h-3 w-6 rounded-sm bg-[var(--forja-border-strong)]"
                    />
                  ))}
                  {((board.nodes as unknown[]) || []).length === 0 && (
                    <span className="text-[10px] text-[var(--forja-text-dim)]">
                      Vazio
                    </span>
                  )}
                </div>
              </div>

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
