import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth } from "../utils/contexts/auth";
import { useTheme } from "../utils/contexts/theme";
import Icon from "@/components/ui/icons";
import Logo from "@/components/ui/logo";

/** Firebase error codes are not user-facing copy; translate the common ones. */
const readableError = (message?: string | null) => {
  if (!message) return null;
  const code = message.match(/\(auth\/([a-z-]+)\)/)?.[1];
  switch (code) {
    case "invalid-email":
      return "That email address doesn't look right.";
    case "user-not-found":
    case "wrong-password":
    case "invalid-credential":
      return "Email or password is incorrect.";
    case "email-already-in-use":
      return "That email already has an account. Sign in instead.";
    case "weak-password":
      return "Pick a password with at least 6 characters.";
    case "too-many-requests":
      return "Too many attempts. Wait a minute and try again.";
    case "network-request-failed":
      return "Network problem. Check your connection and retry.";
    default:
      return message.replace("Firebase: ", "");
  }
};

function Login() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user, loading, error, signIn, signUp } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const next = typeof router.query.next === "string" ? router.query.next : "/home";

  useEffect(() => {
    if (router.query.mode === "signup") setIsSignUp(true);
  }, [router.query.mode]);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, router, next]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = emailRef.current?.value.trim() ?? "";
    const password = passwordRef.current?.value ?? "";
    if (!email || !password) return;
    setSubmitting(true);
    if (isSignUp) await signUp(email, password);
    else await signIn(email, password);
    setSubmitting(false);
  };

  const message = readableError(error);

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: theme.primary, color: theme.text }}
    >
      <Head>
        <title>{isSignUp ? "Create your account" : "Sign in"} | Cloud Box</title>
      </Head>

      <header className="px-5 py-4">
        <Link href="/" aria-label="Cloud Box home">
          <Logo size={26} accent={theme.accent} ink={theme.text} />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-[22rem]">
          <h1 className="text-[1.375rem] font-semibold tracking-tight">
            {isSignUp ? "Create your account" : "Sign in"}
          </h1>
          <p className="mt-1.5 text-[13px]" style={{ color: theme.muted }}>
            {isSignUp
              ? "Your files stay in your own Firebase project."
              : "Welcome back."}
          </p>

          <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px]">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                placeholder="you@example.com"
                className="field h-10 text-[13px]"
                style={{ backgroundColor: theme.secondary, borderColor: theme.border }}
                ref={emailRef}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-[13px]">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                  minLength={6}
                  placeholder={isSignUp ? "At least 6 characters" : "••••••••"}
                  className="field h-10 pr-10 text-[13px]"
                  style={{ backgroundColor: theme.secondary, borderColor: theme.border }}
                  ref={passwordRef}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: theme.muted }}
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} size={15} />
                </button>
              </div>
            </div>

            {message && (
              <p
                className="rounded-lg px-3 py-2 text-[13px]"
                role="alert"
                style={{ backgroundColor: theme.secondary, color: "#e5484d" }}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary mt-1 h-10 text-[14px]"
            >
              {submitting ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-[13px]" style={{ color: theme.muted }}>
            {isSignUp ? "Already have an account? " : "New here? "}
            <button
              type="button"
              className="underline underline-offset-2"
              style={{ color: theme.text }}
              onClick={() => setIsSignUp((v) => !v)}
            >
              {isSignUp ? "Sign in" : "Create an account"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Login;
