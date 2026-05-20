import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { I } from "@/shared/ui/icons";
import { signUpWithEmail } from "@/features/auth/api/authApi";

const schema = z
  .object({
    fullName: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const pwValue = watch("password") ?? "";

  const onSubmit = async (data: FormData) => {
    if (!agreed) {
      toast.error("Please agree to the Terms and Privacy Policy");
      return;
    }
    try {
      await signUpWithEmail(data.email, data.password, data.fullName);
      void navigate({ to: "/" });
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
      <div className="absolute top-7 right-7 flex items-center gap-1.5 text-xs text-white/45">
        <span className="fb-pulse inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
        All systems normal
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
            {/* Tab nav */}
            <div className="mb-7 flex rounded-xl border border-white/5 bg-black/30 p-1 text-[13px] font-medium">
              <Link
                to="/login"
                className="flex-1 rounded-lg py-2 text-center text-white/45 transition hover:text-white/70"
              >
                Sign in
              </Link>
              <div className="flex-1 rounded-lg bg-white/[0.08] py-2 text-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                Create account
              </div>
            </div>

            <h1 className="mb-1.5 text-[22px] font-semibold text-white">
              Get your boards in order
            </h1>
            <p className="mb-6 text-[13.5px] text-white/50">
              Start organizing work — free forever for up to 3 boards.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              {/* Full name */}
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-white/65">
                  Full name
                </span>
                <input
                  type="text"
                  placeholder="Your name"
                  autoComplete="name"
                  {...register("fullName")}
                  className="fb-input h-11 w-full rounded-xl px-3 text-[14px]"
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-rose-400">{errors.fullName.message}</p>
                )}
              </label>

              {/* Email */}
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-white/65">Email</span>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/40">
                    {I.Mail}
                  </span>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    {...register("email")}
                    className="fb-input h-11 w-full rounded-xl pr-3 pl-9 text-[14px]"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>
                )}
              </label>

              {/* Password */}
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-white/65">Password</span>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/40">
                    {I.Lock}
                  </span>
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    {...register("password")}
                    className="fb-input h-11 w-full rounded-xl pr-10 pl-9 text-[14px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1.5 text-white/40 transition-all hover:bg-white/5 hover:text-white/80"
                  >
                    {I.Eye}
                  </button>
                </div>
                {/* Strength bar */}
                <div className="mt-2 flex items-center gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        pwValue.length > i * 2
                          ? "bg-gradient-to-r from-indigo-500 to-violet-500"
                          : "bg-white/[0.06]"
                      }`}
                    />
                  ))}
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>
                )}
              </label>

              {/* Confirm password */}
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-white/65">
                  Confirm password
                </span>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/40">
                    {I.Lock}
                  </span>
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    {...register("confirmPassword")}
                    className="fb-input h-11 w-full rounded-xl pr-3 pl-9 text-[14px]"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-rose-400">{errors.confirmPassword.message}</p>
                )}
              </label>

              {/* Agree */}
              <label className="group flex cursor-pointer items-start gap-2.5">
                <button
                  type="button"
                  onClick={() => setAgreed((v) => !v)}
                  className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border transition ${
                    agreed
                      ? "border-violet-400 bg-gradient-to-br from-indigo-500 to-violet-500"
                      : "border-white/15 bg-black/30 group-hover:border-violet-400/60"
                  }`}
                >
                  {agreed && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <span className="text-[12px] leading-relaxed text-white/55">
                  I agree to FlowBoard&apos;s{" "}
                  <span className="cursor-pointer text-white/80 underline decoration-white/20 underline-offset-2">
                    Terms
                  </span>{" "}
                  and{" "}
                  <span className="cursor-pointer text-white/80 underline decoration-white/20 underline-offset-2">
                    Privacy Policy
                  </span>
                  .
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="fb-grad-btn mt-1 h-11 w-full rounded-xl text-[14px] font-semibold text-white disabled:opacity-60"
              >
                {isSubmitting ? "Creating account…" : "Create account →"}
              </button>
            </form>

            <p className="mt-6 text-center text-[12.5px] text-white/45">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-white/85 hover:text-white">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-5 flex items-center justify-center gap-4 text-[11.5px] text-white/35">
            <span className="flex items-center gap-1.5">{I.Lock} End-to-end encrypted</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>Offline-first sync</span>
          </div>
        </div>
      </div>
    </div>
  );
}
