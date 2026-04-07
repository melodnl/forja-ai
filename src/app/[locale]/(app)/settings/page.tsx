"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { ForjaLogo } from "@/components/shared/ForjaLogo";

export default function SettingsPage() {
  const t = useTranslations("nav");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [locale, setLocale] = useState("pt-BR");
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || "");
        setLocale(profile.locale || "pt-BR");
        setEmail(profile.email || "");
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, locale })
      .eq("id", user.id);

    if (error) toast.error(error.message);
    else toast.success("Perfil atualizado!");
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--forja-ember)]" />
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-8">{t("settings")}</h1>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--forja-text)]">E-mail</label>
          <input
            value={email}
            disabled
            className="rounded-lg border border-[var(--forja-border)] bg-[var(--forja-bg)] px-3 py-2 text-sm text-[var(--forja-text-dim)]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--forja-text)]">Nome completo</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-lg border border-[var(--forja-border)] bg-[var(--forja-bg)] px-3 py-2 text-sm text-[var(--forja-text)] focus:border-[var(--forja-ember)] focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--forja-text)]">Idioma</label>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="rounded-lg border border-[var(--forja-border)] bg-[var(--forja-bg)] px-3 py-2 text-sm text-[var(--forja-text)] focus:border-[var(--forja-ember)] focus:outline-none"
          >
            <option value="pt-BR">Portugues (Brasil)</option>
            <option value="es">Espanol</option>
            <option value="en">English</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--forja-ember)] py-2.5 text-sm font-medium text-[var(--forja-bg)] transition-all duration-200 hover:bg-[var(--forja-ember-hover)] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </button>
      </div>

      <div className="mt-12 border-t border-[var(--forja-border)] pt-6">
        <ForjaLogo size="sm" />
        <p className="mt-2 text-xs text-[var(--forja-text-dim)]">v0.1.0 — MVP</p>
      </div>
    </div>
  );
}
