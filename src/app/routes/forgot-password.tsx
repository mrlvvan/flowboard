import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AuthCard } from "@/features/auth/components/AuthCard";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { sendPasswordResetEmail } from "@/features/auth/api/authApi";

const schema = z.object({ email: z.string().email() });
type FormData = z.infer<typeof schema>;

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const { t: tc } = useTranslation("common");
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await sendPasswordResetEmail(data.email);
      setSentEmail(data.email);
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tc("error"));
    }
  };

  if (sent) {
    return (
      <AuthCard title={t("checkEmail")} description={t("checkEmailMessage", { email: sentEmail })}>
        <Link to="/login">
          <Button variant="outline" className="w-full">{t("backToLogin")}</Button>
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("forgotPassword")} description={t("forgotPasswordSubtitle")}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {t("sendResetLink")}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-medium hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </AuthCard>
  );
}
