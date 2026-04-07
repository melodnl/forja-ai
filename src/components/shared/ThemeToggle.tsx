"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-[var(--forja-bg-hover)] transition-colors"
      title={theme === "dark" ? "Modo claro" : "Modo escuro"}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-[var(--forja-amber)]" />
      ) : (
        <Moon className="h-4 w-4 text-[var(--forja-text-muted)]" />
      )}
    </button>
  );
}
