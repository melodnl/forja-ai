"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Layers,
  Image,
  Settings,
  CreditCard,
  Plus,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ForjaLogo } from "@/components/shared/ForjaLogo";

const navItems = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "templates", href: "/templates", icon: Layers },
  { key: "library", href: "/library", icon: Image },
  { key: "settings", href: "/settings", icon: Settings },
  { key: "billing", href: "/billing", icon: CreditCard },
] as const;

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const pathWithoutLocale = pathname.replace(/^\/(pt-BR|es|en)/, "");

  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5">
        <ForjaLogo size="sm" />
      </div>

      {/* New Board */}
      <div className="px-3 pb-2">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg bg-[var(--forja-ember)] px-3 py-2 text-sm font-medium text-[var(--forja-bg)] transition-all duration-200 hover:bg-[var(--forja-ember-hover)] hover:shadow-[0_0_24px_rgba(255,107,26,0.15)]"
        >
          <Plus className="h-4 w-4" />
          {t("newBoard")}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map(({ key, href, icon: Icon }) => {
          const isActive = pathWithoutLocale.startsWith(href);
          return (
            <Link
              key={key}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                isActive
                  ? "bg-[var(--forja-bg-hover)] text-[var(--forja-text)]"
                  : "text-[var(--forja-text-muted)] hover:bg-[var(--forja-bg-hover)] hover:text-[var(--forja-text)]"
              )}
            >
              <Icon className="h-4 w-4" />
              {t(key)}
            </Link>
          );
        })}
      </nav>

      {/* Credits */}
      <div className="border-t border-[var(--forja-border)] px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Flame className="h-4 w-4 text-[var(--forja-ember)]" />
          <span className="text-[var(--forja-text-muted)]">100 créditos</span>
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex h-full w-60 flex-col border-r border-[var(--forja-border)] bg-[var(--forja-bg)]">
      <SidebarContent />
    </aside>
  );
}
