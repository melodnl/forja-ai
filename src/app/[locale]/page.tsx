import { useTranslations } from "next-intl";
import Link from "next/link";
import { ForjaLogo } from "@/components/shared/ForjaLogo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import {
  Flame,
  Layers,
  Zap,
  Globe,
  Image as ImageIcon,
  Video,
  Mic,
  FileText,
  ArrowRight,
  Sparkles,
  MousePointerClick,
} from "lucide-react";

const FEATURES = [
  {
    icon: MousePointerClick,
    title: "Canvas Visual",
    desc: "Conecte nós num canvas drag-and-drop. Sem código, sem complicação.",
    color: "var(--forja-ember)",
  },
  {
    icon: Layers,
    title: "Múltiplas IAs",
    desc: "Nano Banana, Flux, Sora 2, Veo 3, Kling, Claude, GPT, ElevenLabs — tudo num lugar.",
    color: "var(--forja-amber)",
  },
  {
    icon: Zap,
    title: "Templates Prontos",
    desc: "Hook VSL, UGC Avatar, Thumbnail, Pack de Copies — comece gerando em segundos.",
    color: "var(--forja-glow)",
  },
  {
    icon: Globe,
    title: "PT-BR / ES / EN",
    desc: "Interface completa em 3 idiomas. Feito pro mercado LATAM.",
    color: "var(--forja-info)",
  },
];

const GENERATION_TYPES = [
  { icon: ImageIcon, label: "Imagem", color: "var(--forja-amber)" },
  { icon: Video, label: "Vídeo", color: "var(--forja-glow)" },
  { icon: Mic, label: "Voz", color: "var(--forja-success)" },
  { icon: FileText, label: "Copy", color: "var(--forja-info)" },
];

export default function LandingPage() {
  const t = useTranslations("auth");

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12">
        <ForjaLogo size="sm" />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-sm text-[var(--forja-text-muted)] hover:text-[var(--forja-text)] transition-colors"
          >
            {t("login")}
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-[var(--forja-ember)] px-4 py-2 text-sm font-medium text-[var(--forja-bg)] transition-all duration-200 hover:bg-[var(--forja-ember-hover)] hover:shadow-[0_0_24px_rgba(255,107,26,0.15)]"
          >
            {t("signup")}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center px-6 pt-20 pb-16 md:pt-32 md:pb-24 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--forja-border)] bg-[var(--forja-bg-elevated)] px-4 py-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[var(--forja-ember)]" />
          <span className="text-xs text-[var(--forja-text-muted)]">
            Orquestre múltiplas IAs num único canvas
          </span>
        </div>

        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl md:leading-[1.1]">
          <span className="text-[var(--forja-text)]">Forje criativos com IA.</span>
          <br />
          <span className="bg-gradient-to-r from-[var(--forja-ember)] via-[var(--forja-amber)] to-[var(--forja-glow)] bg-clip-text text-transparent">
            Conecte. Gere. Lucre.
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-[var(--forja-text-muted)] leading-relaxed">
          Imagem, vídeo, voz e copy — tudo gerado por IA e conectado num canvas visual.
          Templates validados em tráfego pago pra infoprodutores e agências LATAM.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="flex items-center gap-2 rounded-lg bg-[var(--forja-ember)] px-8 py-3.5 text-sm font-medium text-[var(--forja-bg)] transition-all duration-200 hover:bg-[var(--forja-ember-hover)] hover:shadow-[0_0_32px_rgba(255,107,26,0.2)]"
          >
            Começar grátis — 100 créditos
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-lg border border-[var(--forja-border)] px-8 py-3.5 text-sm font-medium text-[var(--forja-text)] transition-all duration-200 hover:bg-[var(--forja-bg-hover)]"
          >
            Já tenho conta
          </Link>
        </div>

        {/* Generation type pills */}
        <div className="mt-12 flex items-center gap-3">
          {GENERATION_TYPES.map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 rounded-full border border-[var(--forja-border)] bg-[var(--forja-bg-elevated)] px-3 py-1.5"
            >
              <Icon className="h-3.5 w-3.5" style={{ color }} />
              <span className="text-xs text-[var(--forja-text-muted)]">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Canvas preview */}
      <section className="px-6 pb-20 md:px-12">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-[var(--forja-border)] bg-[var(--forja-bg-elevated)] shadow-2xl shadow-black/40">
          <div className="flex items-center gap-2 border-b border-[var(--forja-border)] px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-[var(--forja-spark)]" />
            <div className="h-3 w-3 rounded-full bg-[var(--forja-warning)]" />
            <div className="h-3 w-3 rounded-full bg-[var(--forja-success)]" />
            <span className="ml-3 text-xs text-[var(--forja-text-dim)]">Forjea — Canvas</span>
          </div>
          <div className="relative h-64 md:h-96 bg-[var(--canvas-bg)]" style={{ backgroundImage: "radial-gradient(var(--canvas-grid) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
            {/* Fake nodes */}
            <div className="absolute left-[8%] top-[15%] w-40 rounded-lg border border-[var(--forja-border)] bg-[var(--canvas-node-bg)] p-3 shadow-lg">
              <div className="flex items-center gap-1.5 mb-2">
                <ImageIcon className="h-3.5 w-3.5 text-[var(--forja-amber)]" />
                <span className="text-[10px] font-medium text-[var(--forja-text)]">Imagem</span>
              </div>
              <div className="h-16 rounded bg-[var(--forja-bg)] flex items-center justify-center">
                <span className="text-[9px] text-[var(--forja-text-dim)]">produto.jpg</span>
              </div>
            </div>
            <div className="absolute left-[40%] top-[10%] w-48 rounded-lg border border-[var(--forja-ember)] bg-[var(--canvas-node-bg)] p-3 shadow-lg shadow-[var(--forja-ember)]/10">
              <div className="flex items-center gap-1.5 mb-2">
                <Flame className="h-3.5 w-3.5 text-[var(--forja-ember)]" />
                <span className="text-[10px] font-medium text-[var(--forja-text)]">Criativo</span>
                <span className="ml-auto rounded bg-[var(--forja-ember)]/20 px-1 py-0.5 text-[8px] text-[var(--forja-ember)]">Nano Banana 2</span>
              </div>
              <div className="h-8 rounded bg-[var(--forja-ember)]/10 flex items-center justify-center">
                <span className="text-[9px] text-[var(--forja-ember)]">Gerando...</span>
              </div>
            </div>
            <div className="absolute right-[8%] top-[30%] w-44 rounded-lg border border-[var(--forja-border)] bg-[var(--canvas-node-bg)] p-3 shadow-lg">
              <div className="flex items-center gap-1.5 mb-2">
                <FileText className="h-3.5 w-3.5 text-[var(--forja-info)]" />
                <span className="text-[10px] font-medium text-[var(--forja-text)]">Copy</span>
              </div>
              <div className="space-y-1">
                <div className="h-2 w-full rounded bg-[var(--forja-border)]" />
                <div className="h-2 w-3/4 rounded bg-[var(--forja-border)]" />
                <div className="h-2 w-5/6 rounded bg-[var(--forja-border)]" />
              </div>
            </div>
            <div className="absolute left-[35%] bottom-[15%] w-40 rounded-lg border border-[var(--forja-border)] bg-[var(--canvas-node-bg)] p-3 shadow-lg">
              <div className="flex items-center gap-1.5 mb-2">
                <Mic className="h-3.5 w-3.5 text-[var(--forja-success)]" />
                <span className="text-[10px] font-medium text-[var(--forja-text)]">Voz</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-4 w-4 rounded-full bg-[var(--forja-success)]/20 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-[var(--forja-success)]" />
                </div>
                <div className="h-1.5 flex-1 rounded bg-[var(--forja-border)]">
                  <div className="h-1.5 w-2/3 rounded bg-[var(--forja-success)]" />
                </div>
              </div>
            </div>
            {/* Fake edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line x1="23%" y1="35%" x2="40%" y2="25%" stroke="var(--forja-ember)" strokeWidth="1.5" strokeOpacity="0.6" />
              <line x1="60%" y1="25%" x2="75%" y2="40%" stroke="var(--canvas-edge)" strokeWidth="1.5" />
              <line x1="55%" y1="35%" x2="50%" y2="65%" stroke="var(--canvas-edge)" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20 md:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold mb-12 md:text-3xl">
            Tudo que você precisa pra{" "}
            <span className="text-[var(--forja-ember)]">forjar criativos</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="rounded-xl border border-[var(--forja-border)] bg-[var(--forja-bg-elevated)] p-6 transition-all duration-200 hover:border-[var(--forja-ember)]/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--forja-bg)] mb-4">
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <h3 className="text-sm font-semibold text-[var(--forja-text)] mb-1">{title}</h3>
                <p className="text-sm text-[var(--forja-text-muted)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20 md:px-12">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--forja-ember)]/20 bg-gradient-to-b from-[var(--forja-bg-elevated)] to-[var(--forja-bg)] p-10 text-center shadow-[0_0_64px_rgba(255,107,26,0.08)]">
          <Flame className="mx-auto h-10 w-10 text-[var(--forja-ember)] mb-4" />
          <h2 className="text-2xl font-bold mb-2">Comece a forjar agora</h2>
          <p className="text-sm text-[var(--forja-text-muted)] mb-6">
            100 créditos grátis no signup. Sem cartão de crédito.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--forja-ember)] px-8 py-3.5 text-sm font-medium text-[var(--forja-bg)] transition-all duration-200 hover:bg-[var(--forja-ember-hover)] hover:shadow-[0_0_32px_rgba(255,107,26,0.2)]"
          >
            Criar conta grátis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--forja-border)] px-6 py-8 md:px-12">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <ForjaLogo size="sm" />
          <p className="text-xs text-[var(--forja-text-dim)]">
            © 2026 Forjea — Forje. Conecte. Lucre.
          </p>
        </div>
      </footer>
    </div>
  );
}
