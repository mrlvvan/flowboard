import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { I } from "@/shared/ui/icons";
import { signInWithEmail, signInWithGoogle } from "@/features/auth/api/authApi";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
type FormData = z.infer<typeof schema>;

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await signInWithEmail(data.email, data.password);
      void navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const handleGoogle = () => {
    void signInWithGoogle();
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
          {/* Glow behind card */}
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
              <div className="flex-1 rounded-lg bg-white/[0.08] py-2 text-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                Sign in
              </div>
              <Link
                to="/register"
                className="flex-1 rounded-lg py-2 text-center text-white/45 transition hover:text-white/70"
              >
                Create account
              </Link>
            </div>

            <h1 className="mb-1.5 text-[22px] font-semibold text-white">Welcome back</h1>
            <p className="mb-6 text-[13.5px] text-white/50">
              Sign in to continue to your workspace.
            </p>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogle}
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-[13.5px] font-medium transition-all hover:bg-white/[0.06]"
            >
              <I.Google />
              Continue with Google
            </button>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/[0.06]" />
              <span className="text-[11px] tracking-[0.14em] text-white/35 uppercase">
                or with email
              </span>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
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
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-white/65">Password</span>
                  <Link
                    to="/forgot-password"
                    className="text-[12px] text-indigo-300/80 transition-colors hover:text-indigo-200"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/40">
                    {I.Lock}
                  </span>
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
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
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>
                )}
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="fb-grad-btn mt-1.5 h-11 w-full rounded-xl text-[14px] font-semibold text-white disabled:opacity-60"
              >
                {isSubmitting ? "Signing in…" : "Sign in →"}
              </button>
            </form>

            <p className="mt-6 text-center text-[12.5px] text-white/45">
              New to FlowBoard?{" "}
              <Link to="/register" className="font-medium text-white/85 hover:text-white">
                Create a free account
              </Link>
            </p>
          </div>

          {/* Below card */}
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
