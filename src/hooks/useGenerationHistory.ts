"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface GenerationRecord {
  id: string;
  model: string;
  status: string;
  prompt: string | null;
  output_urls: string[] | null;
  credits_used: number;
  created_at: string;
}

export function useGenerationHistory(boardId: string | null) {
  const [history, setHistory] = useState<GenerationRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!boardId) return;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("generations")
      .select("id, model, status, prompt, output_urls, credits_used, created_at")
      .eq("board_id", boardId)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setHistory((data as GenerationRecord[]) || []);
        setLoading(false);
      });
  }, [boardId]);

  return { history, loading };
}
