"use client";

import { memo, useCallback, useRef, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Bot, Send, Loader2, ChevronDown, Sparkles } from "lucide-react";
import { useCanvasStore } from "@/store/canvas.store";
import { useNodeInputs } from "@/hooks/useNodeConnections";
import { NodeDeleteButton, stopNodeKeyCapture } from "./NodeWrapper";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function GeminiIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M8 0C8 4.4 4.4 8 0 8c4.4 0 8 3.6 8 8 0-4.4 3.6-8 8-8-4.4 0-8-3.6-8-8z" fill="#4285F4"/>
    </svg>
  );
}

function ClaudeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M11.2 3.6L8.4 12.4h-1L4.6 3.6h1.8l1.6 6 1.6-6h1.6z" fill="#D97757"/>
      <circle cx="8" cy="8" r="7" stroke="#D97757" strokeWidth="1.2" fill="none"/>
    </svg>
  );
}

function OpenAIIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M14 8.3a3.2 3.2 0 00-2.7-3.1 3.2 3.2 0 00-5-1.8A3.2 3.2 0 002 6a3.2 3.2 0 00.7 6.3c.2 0 .4 0 .6-.1a3.2 3.2 0 005 1.8A3.2 3.2 0 0014 8.3z" fill="none" stroke="#10A37F" strokeWidth="1.2"/>
      <circle cx="8" cy="8" r="1.5" fill="#10A37F"/>
    </svg>
  );
}

type ModelIconComponent = typeof GeminiIcon;

const MODELS: { value: string; label: string; group: string; icon: ModelIconComponent; color: string }[] = [
  { value: "gemini-3-flash", label: "Gemini 3 Flash", group: "MODELOS ECONÔMICOS", icon: GeminiIcon, color: "#4285F4" },
  { value: "claude-4-5-haiku", label: "Claude 4.5 Haiku", group: "MODELOS ECONÔMICOS", icon: ClaudeIcon, color: "#D97757" },
  { value: "gpt-5-1", label: "GPT-5.1", group: "MODELOS PADRÃO", icon: OpenAIIcon, color: "#10A37F" },
  { value: "claude-4-5-sonnet", label: "Claude 4.5 Sonnet", group: "MODELOS PADRÃO", icon: ClaudeIcon, color: "#D97757" },
  { value: "gpt-5-2", label: "GPT-5.2", group: "MODELOS PADRÃO", icon: OpenAIIcon, color: "#10A37F" },
  { value: "claude-4-5-opus", label: "Claude 4.5 Opus", group: "MODELOS DE RACIOCÍNIO", icon: ClaudeIcon, color: "#D97757" },
  { value: "claude-4-6-opus", label: "Claude 4.6 Opus", group: "MODELOS DE RACIOCÍNIO", icon: ClaudeIcon, color: "#D97757" },
  { value: "gemini-3-pro", label: "Gemini 3 Pro", group: "MODELOS DE RACIOCÍNIO", icon: GeminiIcon, color: "#4285F4" },
];

const TEMPLATES = [
  "Descreva a imagem.",
  "Crie um prompt detalhado pra gerar esta imagem.",
  "Escreva uma copy persuasiva sobre isso.",
  "Sugira 5 variações de headline.",
  "Crie um roteiro UGC de 30 segundos.",
];

function AssistantNodeComponent({ id, data, selected }: NodeProps) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const { imageUrls, promptText } = useNodeInputs(id);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = (data.messages as Message[]) || [];
  const model = (data.model as string) || "gemini-3-flash";
  const sources = imageUrls.length + (promptText ? 1 : 0);

  const selectedModelObj = MODELS.find((m) => m.value === model);
  const selectedModelLabel = selectedModelObj?.label || model;
  const SelectedModelIcon = selectedModelObj?.icon || GeminiIcon;

  const handleSend = useCallback(async (text?: string) => {
    const msgText = text || input;
    if (!msgText.trim()) return;

    const newMessages: Message[] = [...messages, { role: "user", content: msgText }];
    updateNodeData(id, { messages: newMessages, sources });
    setInput("");
    setLoading(true);

    try {
      // Monta contexto com fontes conectadas
      let context = "";
      if (imageUrls.length > 0) {
        context += `[${imageUrls.length} imagem(ns) conectada(s)]\n`;
      }
      if (promptText) {
        context += `[Texto conectado: "${promptText.slice(0, 200)}"]\n`;
      }

      const res = await fetch("/api/generate/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: newMessages,
          context,
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        updateNodeData(id, {
          messages: [...newMessages, { role: "assistant", content: `Erro: ${result.error}` }],
        });
        return;
      }

      updateNodeData(id, {
        messages: [...newMessages, { role: "assistant", content: result.response }],
      });
    } catch {
      updateNodeData(id, {
        messages: [...newMessages, { role: "assistant", content: "Erro ao conectar com o servidor." }],
      });
    } finally {
      setLoading(false);
    }
  }, [id, input, messages, model, imageUrls, promptText, sources, updateNodeData]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div
      onKeyDown={stopNodeKeyCapture}
      className={`group/node w-96 rounded-lg border bg-[var(--canvas-node-bg)] transition-all duration-200 ${
        selected
          ? "border-[var(--forja-ember)] shadow-[0_0_24px_rgba(255,107,26,0.15)]"
          : "border-[var(--forja-border)]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--forja-border)] px-3 py-2">
        <Bot className="h-4 w-4 text-[var(--forja-info)]" />
        <span className="text-xs font-medium text-[var(--forja-text)]">
          Assistente De IA
        </span>
        {sources > 0 && (
          <span className="rounded bg-[var(--forja-info)]/15 px-1.5 py-0.5 text-[10px] text-[var(--forja-info)]">
            {sources} fonte{sources > 1 ? "s" : ""}
          </span>
        )}
        <NodeDeleteButton nodeId={id} />
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-2 p-3 max-h-64 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Bot className="h-8 w-8 text-[var(--forja-text-dim)]" />
            <p className="text-xs text-[var(--forja-text-dim)]">
              Faça uma pergunta ou use um template
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "ml-8 bg-[var(--forja-bg-hover)] text-[var(--forja-text)]"
                  : "mr-4 bg-[var(--forja-bg)] text-[var(--forja-text)] border border-[var(--forja-border)]"
              }`}
            >
              {msg.content}
            </div>
          ))
        )}
        {loading && (
          <div className="flex items-center gap-2 mr-4 rounded-lg bg-[var(--forja-bg)] border border-[var(--forja-border)] px-3 py-2">
            <Loader2 className="h-3 w-3 animate-spin text-[var(--forja-info)]" />
            <span className="text-xs text-[var(--forja-text-dim)]">Pensando...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Templates dropdown */}
      {showTemplates && (
        <div className="border-t border-[var(--forja-border)] px-3 py-2">
          <div className="flex flex-col gap-1">
            {TEMPLATES.map((tmpl, i) => (
              <button
                key={i}
                onClick={() => { handleSend(tmpl); setShowTemplates(false); }}
                className="rounded-md px-2 py-1.5 text-left text-[11px] text-[var(--forja-text-muted)] hover:bg-[var(--forja-bg-hover)] hover:text-[var(--forja-text)] transition-colors"
              >
                {tmpl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="border-t border-[var(--forja-border)] px-3 py-2">
        {/* Model selector + Templates */}
        <div className="flex items-center gap-2 mb-2">
          <div className="relative">
            <button
              onClick={() => { setShowModels(!showModels); setShowTemplates(false); }}
              className="flex items-center gap-1 rounded-md bg-[var(--forja-bg)] border border-[var(--forja-border)] px-2 py-1 text-[10px] text-[var(--forja-text-muted)] hover:border-[var(--forja-ember)] transition-colors"
            >
              <SelectedModelIcon className="h-3 w-3" />
              {selectedModelLabel}
              <ChevronDown className="h-3 w-3" />
            </button>
            {showModels && (
              <div className="absolute bottom-full left-0 mb-1 w-52 rounded-lg border border-[var(--forja-border)] bg-[var(--forja-bg-overlay)] py-1 shadow-lg z-20 max-h-60 overflow-y-auto">
                {["MODELOS ECONÔMICOS", "MODELOS PADRÃO", "MODELOS DE RACIOCÍNIO"].map((group) => (
                  <div key={group}>
                    <div className="px-3 py-1 text-[9px] font-medium text-[var(--forja-text-dim)] uppercase tracking-wider">
                      {group}
                    </div>
                    {MODELS.filter((m) => m.group === group).map((m) => {
                      const IconComp = m.icon;
                      return (
                        <button
                          key={m.value}
                          onClick={() => { updateNodeData(id, { model: m.value }); setShowModels(false); }}
                          className={`flex w-full items-center gap-2 px-3 py-1.5 text-[11px] transition-colors ${
                            model === m.value
                              ? "text-[var(--forja-ember)] bg-[var(--forja-bg-hover)]"
                              : "text-[var(--forja-text)] hover:bg-[var(--forja-bg-hover)]"
                          }`}
                        >
                          <IconComp className="h-3.5 w-3.5 shrink-0" />
                          {m.label}
                          {model === m.value && <span className="ml-auto text-[var(--forja-ember)]">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => { setShowTemplates(!showTemplates); setShowModels(false); }}
            className="flex items-center gap-1 rounded-md bg-[var(--forja-bg)] border border-[var(--forja-border)] px-2 py-1 text-[10px] text-[var(--forja-text-muted)] hover:border-[var(--forja-ember)] transition-colors"
          >
            Templates
          </button>
        </div>

        {/* Input */}
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { e.stopPropagation(); handleKeyDown(e); }}
            placeholder="Envie uma mensagem..."
            disabled={loading}
            className="nodrag nowheel flex-1 rounded-md border border-[var(--forja-border)] bg-[var(--forja-bg)] px-3 py-1.5 text-xs text-[var(--forja-text)] placeholder:text-[var(--forja-text-dim)] focus:border-[var(--forja-ember)] focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--forja-ember)] text-[var(--forja-bg)] transition-all hover:bg-[var(--forja-ember-hover)] disabled:opacity-50"
          >
            <Send className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Left}
        className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-info)]" />
      <Handle type="source" position={Position.Right}
        className="!h-3 !w-3 !rounded-full !border-2 !border-[var(--forja-border-strong)] !bg-[var(--forja-ember)]" />
    </div>
  );
}

export const AssistantNode = memo(AssistantNodeComponent);
