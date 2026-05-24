import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { I } from "@/shared/ui/icons";
import { sendPasswordResetEmail } from "@/features/auth/api/authApi";

const schema = z.object({ email: z.string().email() });
type FormData = z.infer<typeof schema>;

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await sendPasswordResetEmail(data.email);
      setSentEmail(data.email);
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="fb-bg relative h-screen w-full overflow-hidden text-white">
      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Brand */}
      <div className="absolute top-7 left-7 flex items-center gap-2.5">
        <I.Logo size={28} />
        <span className="text-[15px] font-semibold tracking-tight">FlowBoard</span>
      </div>

      {/* Centered card */}
      <div className="absolute inset-0 grid place-items-center px-6">
        <div className="relative w-full max-w-[420px]">
          <div
            className="absolute inset-0 -z-10 opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(400px 200px at 50% 50%, rgba(99,102,241,0.6), transparent 70%)",
            }}
          />

          <div className="fb-glass-strong fb-ring-inner rounded-2xl p-8">
            {sent ? (
              /* Success state */
              <div className="text-center">
                <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-emerald-500/25 bg-emerald-500/15">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9" />
                    <path d="m2 7 10 6 10-6" />
                    <path d="m16 19 2 2 4-4" />
                  </svg>
                </div>
                <h1 className="mb-2 text-[20px] font-semibold">Check your email</h1>
                <p className="mb-6 text-[13.5px] text-white/50">
                  We sent a reset link to{" "}
                  <span className="font-medium text-white/80">{sentEmail}</span>
                </p>
                <Link
                  to="/login"
                  className="fb-grad-btn block h-11 w-full rounded-xl text-center text-[14px] leading-[44px] font-semibold text-white"
                >
                  Back to sign in
                </Link>
              </div>
            ) : (
              /* Form state */
              <>
                <h1 className="mb-1.5 text-[22px] font-semibold text-white">Reset password</h1>
                <p className="mb-6 text-[13.5px] text-white/50">
                  Enter your email and we&apos;ll send you a reset link.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] font-medium text-white/65">
                      Email
                    </span>
                    <div className="relative">
                      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/40">
                        {I.Mail}
                      </span>
                      <input
                        type="email"
                        placeholder="you@company.com"
                        autoComplete="email"
                        autoFocus
                        {...register("email")}
                        className="fb-input h-11 w-full rounded-xl pr-3 pl-9 text-[14px]"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>
                    )}
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="fb-grad-btn h-11 w-full rounded-xl text-[14px] font-semibold text-white disabled:opacity-60"
                  >
                    {isSubmitting ? "Sending…" : "Send reset link →"}
                  </button>
                </form>

                <p className="mt-6 text-center text-[12.5px] text-white/45">
                  <Link to="/login" className="font-medium text-white/85 hover:text-white">
                    ← Back to sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
