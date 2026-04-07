"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ForjaLogo } from "@/components/shared/ForjaLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const signupSchema = z
  .object({
    fullName: z.string().min(2),
    email: z.email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  });

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(data: SignupForm) {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.fullName },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Conta criada! Verifique seu e-mail.");
    window.location.href = "/login";
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-[var(--forja-border)] bg-[var(--forja-bg-elevated)]">
        <CardHeader className="flex flex-col items-center gap-4 pb-2">
          <ForjaLogo size="md" />
          <p className="text-sm text-[var(--forja-text-muted)]">
            {t("createAccount")}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName">{t("fullName")}</Label>
              <Input
                id="fullName"
                type="text"
                {...register("fullName")}
                className="bg-[var(--forja-bg)] border-[var(--forja-border)]"
              />
              {errors.fullName && (
                <p className="text-xs text-[var(--forja-error)]">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register("email")}
                className="bg-[var(--forja-bg)] border-[var(--forja-border)]"
              />
              {errors.email && (
                <p className="text-xs text-[var(--forja-error)]">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                className="bg-[var(--forja-bg)] border-[var(--forja-border)]"
              />
              {errors.password && (
                <p className="text-xs text-[var(--forja-error)]">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                className="bg-[var(--forja-bg)] border-[var(--forja-border)]"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-[var(--forja-error)]">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--forja-ember)] text-[var(--forja-bg)] hover:bg-[var(--forja-ember-hover)] transition-all duration-200"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("signupCta")
              )}
            </Button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--forja-border)]" />
              <span className="text-xs text-[var(--forja-text-dim)]">{t("orContinueWith")}</span>
              <div className="h-px flex-1 bg-[var(--forja-border)]" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--forja-border)] bg-[var(--forja-bg)] py-2.5 text-sm text-[var(--forja-text)] transition-all duration-200 hover:bg-[var(--forja-bg-hover)]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {t("googleLogin")}
            </button>

            <p className="text-center text-sm text-[var(--forja-text-muted)]">
              {t("hasAccount")}{" "}
              <Link
                href="/login"
                className="text-[var(--forja-ember)] hover:text-[var(--forja-ember-hover)]"
              >
                {t("login")}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
