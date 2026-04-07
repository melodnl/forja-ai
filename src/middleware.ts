import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/lib/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const protectedPaths = [
  "/dashboard",
  "/board",
  "/templates",
  "/library",
  "/settings",
  "/billing",
];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorar API routes e arquivos estáticos
  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Rodar i18n middleware
  const intlResponse = intlMiddleware(request);

  // Checar se a rota é protegida
  const pathWithoutLocale = pathname.replace(/^\/(pt-BR|es|en)/, "");
  const isProtected = protectedPaths.some((p) => pathWithoutLocale.startsWith(p));

  if (isProtected) {
    // Checar auth via cookie — Supabase v2 usa sb-<ref>-auth-token ou chunks .0, .1
    const cookies = request.cookies.getAll();
    const hasAuthToken = cookies.some(
      (c) => c.name.includes("auth-token")
    );

    if (!hasAuthToken) {
      const localeMatch = pathname.match(/^\/(pt-BR|es|en)/);
      const locale = localeMatch ? localeMatch[1] : "pt-BR";
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
