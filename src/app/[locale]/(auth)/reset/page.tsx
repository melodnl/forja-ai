"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
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
import { Loader2, ArrowLeft } from "lucide-react";

const resetSchema = z.object({
  email: z.email(),
});

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPage() {
  const t = useTranslations("auth");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  async function onSubmit(data: ResetForm) {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-[var(--forja-border)] bg-[var(--forja-bg-elevated)]">
        <CardHeader className="flex flex-col items-center gap-4 pb-2">
          <ForjaLogo size="md" />
          <p className="text-sm text-[var(--forja-text-muted)]">
            {t("resetPassword")}
          </p>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-sm text-[var(--forja-text-muted)]">
                E-mail enviado! Verifique sua caixa de entrada.
              </p>
              <Link
                href="/login"
                className="flex items-center gap-2 text-sm text-[var(--forja-ember)] hover:text-[var(--forja-ember-hover)]"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("login")}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--forja-ember)] text-[var(--forja-bg)] hover:bg-[var(--forja-ember-hover)] transition-all duration-200"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("resetPassword")
                )}
              </Button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm text-[var(--forja-text-muted)] hover:text-[var(--forja-text)]"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("login")}
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
