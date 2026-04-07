"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { locales, type Locale } from "@/lib/i18n/config";

const localeLabels: Record<Locale, string> = {
  "pt-BR": "Portugues",
  es: "Espanol",
  en: "English",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(newLocale: Locale) {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-[var(--forja-bg-hover)] transition-colors"
      >
        <Globe className="h-4 w-4 text-[var(--forja-text-muted)]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-[var(--forja-bg-overlay)] border-[var(--forja-border)]"
      >
        {locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => switchLocale(l)}
            className={`cursor-pointer ${
              l === locale
                ? "text-[var(--forja-ember)]"
                : "text-[var(--forja-text-muted)] hover:text-[var(--forja-text)]"
            }`}
          >
            {localeLabels[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
