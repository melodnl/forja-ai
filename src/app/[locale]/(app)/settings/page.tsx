"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Key, Eye, EyeOff, Check } from "lucide-react";
import { ForjaLogo } from "@/components/shared/ForjaLogo";

const API_KEY_PROVIDERS = [
  { id: "kie", label: "Kie.ai", desc: "Imagem e vídeo (Grok, Imagen, Seedance, Veo, Runway)" },
  { id: "openrouter", label: "OpenRouter", desc: "Assistente IA, Copy, Aprimorar prompts" },
  { id: "venice", label: "Venice AI", desc: "Imagens (backup)" },
  { id: "elevenlabs", label: "ElevenLabs", desc: "Geração de voz" },
  { id: "gemini", label: "Google Gemini", desc: "Copy e assistente (backup)" },
  { id: "anthropic", label: "Anthropic Claude", desc: "Copy e assistente (backup)" },
  { id: "openai", label: "OpenAI", desc: "Copy e assistente (backup)" },
];

export default function SettingsPage() {
  const t = useTranslations("nav");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingKeys, setSavingKeys] = useState(false);
  const [fullName, setFullName] = useState("");
  const [locale, setLocale] = useState("pt-BR");
  const [email, setEmail] = useState("");
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, keysRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("user_api_keys").select("*").eq("user_id", user.id),
      ]);

      if (profileRes.data) {
        setFullName(profileRes.data.full_name || "");
        setLocale(profileRes.data.locale || "pt-BR");
        setEmail(profileRes.data.email || "");
      }

      if (keysRes.data) {
        const saved: Record<string, boolean> = {};
        keysRes.data.forEach((k: { provider: string }) => { saved[k.provider] = true; });
        setSavedKeys(saved);
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

  async function handleSaveKey(provider: string) {
    const key = apiKeys[provider];
    if (!key || !key.trim()) {
      toast.error("Cole uma API key válida");
      return;
    }

    setSavingKeys(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upsert: insere ou atualiza
    const { error } = await supabase
      .from("user_api_keys")
      .upsert({
        user_id: user.id,
        provider,
        encrypted_key: key.trim(), // TODO: encriptar com AES-256
        is_active: true,
      }, { onConflict: "user_id,provider" });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Key ${provider} salva!`);
      setSavedKeys((prev) => ({ ...prev, [provider]: true }));
      setApiKeys((prev) => ({ ...prev, [provider]: "" }));
    }
    setSavingKeys(false);
  }

  async function handleRemoveKey(provider: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("user_api_keys").delete().eq("user_id", user.id).eq("provider", provider);
    setSavedKeys((prev) => ({ ...prev, [provider]: false }));
    toast.success(`Key ${provider} removida`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--forja-ember)]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">{t("settings")}</h1>

      {/* Perfil */}
      <div className="flex flex-col gap-6 mb-10">
        <h2 className="text-lg font-semibold">Perfil</h2>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--forja-text)]">E-mail</label>
          <input value={email} disabled
            className="rounded-lg border border-[var(--forja-border)] bg-[var(--forja-bg)] px-3 py-2 text-sm text-[var(--forja-text-dim)]" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--forja-text)]">Nome completo</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="rounded-lg border border-[var(--forja-border)] bg-[var(--forja-bg)] px-3 py-2 text-sm text-[var(--forja-text)] focus:border-[var(--forja-ember)] focus:outline-none" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--forja-text)]">Idioma</label>
          <select value={locale} onChange={(e) => setLocale(e.target.value)}
            className="rounded-lg border border-[var(--forja-border)] bg-[var(--forja-bg)] px-3 py-2 text-sm text-[var(--forja-text)] focus:border-[var(--forja-ember)] focus:outline-none">
            <option value="pt-BR">Portugues (Brasil)</option>
            <option value="es">Espanol</option>
            <option value="en">English</option>
          </select>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--forja-ember)] py-2.5 text-sm font-medium text-[var(--forja-bg)] transition-all duration-200 hover:bg-[var(--forja-ember-hover)] disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar perfil
        </button>
      </div>

      {/* API Keys */}
      <div className="flex flex-col gap-4 border-t border-[var(--forja-border)] pt-8 mb-10">
        <div className="flex items-center gap-2 mb-2">
          <Key className="h-5 w-5 text-[var(--forja-ember)]" />
          <h2 className="text-lg font-semibold">Suas API Keys (BYOK)</h2>
        </div>
        <p className="text-xs text-[var(--forja-text-muted)] -mt-2 mb-2">
          Use suas próprias chaves de API pra não gastar os créditos da plataforma. Quando configurada, a sua key tem prioridade.
        </p>

        {API_KEY_PROVIDERS.map(({ id, label, desc }) => (
          <div key={id} className="rounded-lg border border-[var(--forja-border)] bg-[var(--forja-bg-elevated)] p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-[var(--forja-text)]">{label}</span>
              {savedKeys[id] && (
                <span className="flex items-center gap-1 text-[10px] text-[var(--forja-success)]">
                  <Check className="h-3 w-3" /> Configurada
                </span>
              )}
            </div>
            <p className="text-[10px] text-[var(--forja-text-dim)] mb-3">{desc}</p>

            {savedKeys[id] ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-md bg-[var(--forja-bg)] border border-[var(--forja-border)] px-3 py-1.5 text-xs text-[var(--forja-text-dim)]">
                  ••••••••••••••••••••
                </div>
                <button onClick={() => handleRemoveKey(id)}
                  className="rounded-md border border-[var(--forja-error)]/30 px-3 py-1.5 text-xs text-[var(--forja-error)] hover:bg-[var(--forja-error)]/10 transition-colors">
                  Remover
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKey[id] ? "text" : "password"}
                    value={apiKeys[id] || ""}
                    onChange={(e) => setApiKeys((prev) => ({ ...prev, [id]: e.target.value }))}
                    placeholder={`Cole sua ${label} API key...`}
                    className="w-full rounded-md border border-[var(--forja-border)] bg-[var(--forja-bg)] px-3 py-1.5 pr-8 text-xs text-[var(--forja-text)] placeholder:text-[var(--forja-text-dim)] focus:border-[var(--forja-ember)] focus:outline-none"
                  />
                  <button
                    onClick={() => setShowKey((prev) => ({ ...prev, [id]: !prev[id] }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--forja-text-dim)]">
                    {showKey[id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                </div>
                <button onClick={() => handleSaveKey(id)} disabled={savingKeys || !apiKeys[id]}
                  className="rounded-md bg-[var(--forja-ember)] px-3 py-1.5 text-xs font-medium text-[var(--forja-bg)] hover:bg-[var(--forja-ember-hover)] disabled:opacity-50 transition-colors">
                  Salvar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-[var(--forja-border)] pt-6">
        <ForjaLogo size="sm" />
        <p className="mt-2 text-xs text-[var(--forja-text-dim)]">v0.1.0 — MVP</p>
      </div>
    </div>
  );
}
