"use client";

import { useState, useEffect } from "react";
import { X, MousePointerClick, Cable, Sparkles, Flame, ArrowRight, Lightbulb } from "lucide-react";

const STEPS = [
  {
    icon: MousePointerClick,
    title: "Adicione nós",
    desc: "Clique nos ícones na barra inferior pra adicionar nós ao canvas. Cada nó tem uma função: imagem, texto, voz, vídeo, IA...",
    color: "var(--forja-ember)",
  },
  {
    icon: Cable,
    title: "Conecte os nós",
    desc: "Arraste dos pontos coloridos (handles) de um nó até outro pra conectar. A saída de um alimenta a entrada do próximo.",
    color: "var(--forja-amber)",
  },
  {
    icon: Sparkles,
    title: "Use templates",
    desc: "No Nó Criativo, clique em 'Templates' pra inserir prompts profissionais prontos. Ou clique em 'Aprimorar' pra melhorar seu prompt com IA.",
    color: "var(--forja-info)",
  },
  {
    icon: Flame,
    title: "Gere criativos",
    desc: "Escolha o modelo (Nano Banana, Flux, Sora 2, Veo 3...), configure e clique em 'Gerar'. O resultado aparece direto no nó!",
    color: "var(--forja-ember)",
  },
  {
    icon: Lightbulb,
    title: "Dicas rápidas",
    desc: "Delete → remove nó selecionado\nCtrl+S → salvar\nScroll → zoom\nSpace+arrastar → mover canvas\nTudo salva automaticamente a cada 2s",
    color: "var(--forja-glow)",
  },
];

export function Onboarding() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const dismissed = localStorage.getItem("forja-onboarding-done");
    if (!dismissed) setVisible(true);
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem("forja-onboarding-done", "true");
  }

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[var(--forja-border)] bg-[var(--forja-bg-elevated)] shadow-2xl overflow-hidden">
        {/* Progress */}
        <div className="flex gap-1 px-6 pt-5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-[var(--forja-ember)]" : "bg-[var(--forja-border)]"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl mb-4"
            style={{ backgroundColor: `color-mix(in srgb, ${current.color} 15%, transparent)` }}
          >
            <Icon className="h-6 w-6" style={{ color: current.color }} />
          </div>

          <h3 className="text-lg font-semibold text-[var(--forja-text)] mb-2">
            {current.title}
          </h3>
          <p className="text-sm text-[var(--forja-text-muted)] leading-relaxed whitespace-pre-line">
            {current.desc}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-[var(--forja-border)] px-6 py-4">
          <button
            onClick={dismiss}
            className="text-xs text-[var(--forja-text-dim)] hover:text-[var(--forja-text)] transition-colors"
          >
            Pular tutorial
          </button>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="rounded-lg border border-[var(--forja-border)] px-4 py-2 text-xs text-[var(--forja-text-muted)] hover:bg-[var(--forja-bg-hover)] transition-colors"
              >
                Voltar
              </button>
            )}
            <button
              onClick={() => {
                if (isLast) dismiss();
                else setStep(step + 1);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--forja-ember)] px-4 py-2 text-xs font-medium text-[var(--forja-bg)] transition-all hover:bg-[var(--forja-ember-hover)]"
            >
              {isLast ? "Começar a forjar!" : "Próximo"}
              {!isLast && <ArrowRight className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {/* Step counter */}
        <div className="flex justify-center pb-4">
          <span className="text-[10px] text-[var(--forja-text-dim)]">
            {step + 1} de {STEPS.length}
          </span>
        </div>
      </div>
    </div>
  );
}
