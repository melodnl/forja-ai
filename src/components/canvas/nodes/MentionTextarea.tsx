"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useCanvasStore } from "@/store/canvas.store";
import { ImagePlus, ImageIcon, Type, Bot, Flame } from "lucide-react";

const TYPE_ICONS: Record<string, React.ElementType> = {
  reference: ImagePlus,
  image: ImageIcon,
  prompt: Type,
  assistant: Bot,
  creative: Flame,
};

const TYPE_COLORS: Record<string, string> = {
  reference: "var(--forja-info)",
  image: "var(--forja-amber)",
  prompt: "var(--forja-info)",
};

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  currentNodeId: string;
}

export function MentionTextarea({ value, onChange, placeholder, rows = 4, className, currentNodeId }: MentionTextareaProps) {
  const nodes = useCanvasStore((s) => s.nodes);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);

  // Nós mencionáveis (todos exceto o atual)
  const mentionableNodes = nodes
    .filter((n) => n.id !== currentNodeId && n.type !== "creative")
    .map((n) => ({
      id: n.id,
      type: n.type || "unknown",
      label: (n.data as Record<string, unknown>).label as string || n.id,
    }));

  const filteredNodes = mentionQuery
    ? mentionableNodes.filter((n) => n.label.toLowerCase().includes(mentionQuery.toLowerCase()))
    : mentionableNodes;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    onChange(newValue);

    // Detectar se estamos digitando um @mention
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const atIdx = textBeforeCursor.lastIndexOf("@");

    if (atIdx >= 0) {
      const charBefore = atIdx > 0 ? textBeforeCursor[atIdx - 1] : " ";
      const query = textBeforeCursor.slice(atIdx + 1);
      // Só ativar se @ está no início ou após espaço, e query não tem espaço
      if ((charBefore === " " || charBefore === "\n" || atIdx === 0) && !query.includes(" ")) {
        setMentionStart(atIdx);
        setMentionQuery(query);
        setShowDropdown(true);
        setSelectedIdx(0);
        return;
      }
    }

    setShowDropdown(false);
  }, [onChange]);

  const insertMention = useCallback((label: string) => {
    if (mentionStart < 0) return;
    const before = value.slice(0, mentionStart);
    const cursorPos = textareaRef.current?.selectionStart || value.length;
    const after = value.slice(cursorPos);
    const newValue = `${before}@${label} ${after}`;
    onChange(newValue);
    setShowDropdown(false);

    // Reposicionar cursor
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const pos = mentionStart + label.length + 2; // @label + space
        textareaRef.current.selectionStart = pos;
        textareaRef.current.selectionEnd = pos;
        textareaRef.current.focus();
      }
    });
  }, [mentionStart, value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();

    if (!showDropdown || filteredNodes.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, filteredNodes.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insertMention(filteredNodes[selectedIdx].label);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }, [showDropdown, filteredNodes, selectedIdx, insertMention]);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    if (!showDropdown) return;
    const handler = () => setShowDropdown(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showDropdown]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />

      {/* @mention dropdown */}
      {showDropdown && filteredNodes.length > 0 && (
        <div className="absolute left-0 bottom-full mb-1 w-full rounded-lg border border-[var(--forja-border)] bg-[var(--forja-bg-overlay)] py-1 shadow-xl z-30 max-h-44 overflow-y-auto">
          <div className="px-3 py-1 text-[9px] font-medium text-[var(--forja-text-dim)] uppercase tracking-wider">
            Mencionar nó
          </div>
          {filteredNodes.map((node, i) => {
            const Icon = TYPE_ICONS[node.type] || ImageIcon;
            const color = TYPE_COLORS[node.type] || "var(--forja-text-muted)";
            return (
              <button
                key={node.id}
                onMouseDown={(e) => { e.preventDefault(); insertMention(node.label); }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] transition-colors ${
                  i === selectedIdx ? "bg-[var(--forja-bg-hover)]" : "hover:bg-[var(--forja-bg-hover)]"
                }`}
              >
                <Icon className="h-3 w-3 shrink-0" style={{ color }} />
                <span className="font-medium text-[var(--forja-text)]">@{node.label}</span>
                <span className="ml-auto text-[9px] text-[var(--forja-text-dim)]">{node.type}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
