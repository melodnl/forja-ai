"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/shared/ThemeProvider";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { SidebarContent } from "./Sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, Menu, Sun, Moon } from "lucide-react";

export function Topbar() {
  const router = useRouter();
  const t = useTranslations("common");
  const { theme, toggle } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--forja-border)] bg-[var(--forja-bg)] px-4">
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden flex h-9 w-9 items-center justify-center rounded-md hover:bg-[var(--forja-bg-hover)] transition-colors"
      >
        <Menu className="h-5 w-5 text-[var(--forja-text-muted)]" />
      </button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
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

        <LocaleSwitcher />

        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center justify-center rounded-full hover:bg-[var(--forja-bg-hover)] transition-colors"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[var(--forja-bg-elevated)] text-[var(--forja-text-muted)] text-xs">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-[var(--forja-bg-overlay)] border-[var(--forja-border)]"
          >
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-[var(--forja-text-muted)] hover:text-[var(--forja-text)] cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile sidebar sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          showCloseButton={true}
          className="w-64 p-0 bg-[var(--forja-bg)] border-[var(--forja-border)]"
        >
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
