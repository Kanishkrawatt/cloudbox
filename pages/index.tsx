import React, { useEffect } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth } from "@/utils/contexts/auth";
import { useTheme } from "@/utils/contexts/theme";
import Icon, { IconName } from "@/components/ui/icons";
import Logo from "@/components/ui/logo";
import ShareIllustration from "@/components/ui/shareIllustration";

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "share",
    title: "Links that expire",
    body: "Pick a lifetime, from a day to a week. The link stops working on time, and the files clean themselves up afterwards.",
  },
  {
    icon: "user",
    title: "No account for the recipient",
    body: "They open the link and download. No sign-up wall, no app, nothing to install.",
  },
  {
    icon: "folder",
    title: "Folders that stay tidy",
    body: "Drop files into folders on upload. Images and documents are filed apart automatically.",
  },
  {
    icon: "chart",
    title: "Storage you can see",
    body: "A running total of what you have used and what is left, updated as uploads finish.",
  },
];

const STEPS: [string, string][] = [
  ["Drop the files in", "Drag anything onto the Smart Share page. Rename as you go."],
  ["Choose how long it lives", "One day, two, five, or a week. That is the whole setting."],
  ["Send the link", "They open it in any browser and download. Then it expires."],
];

export default function Landing() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  // Signed-in visitors go straight to the app.
  useEffect(() => {
    if (!loading && user) router.replace("/home");
  }, [loading, user, router]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.primary, color: theme.text }}>
      <Head>
        <title>Cloud Box: share files with links that expire</title>
        <meta
          name="description"
          content="Cloud Box stores your images and files and shares them with links that expire on their own. No account needed to receive one."
        />
      </Head>

      <header
        className="sticky top-0 z-40 backdrop-blur"
        style={{ borderBottom: `1px solid ${theme.border}`, backgroundColor: `${theme.primary}e6` }}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-5">
          <Link href="/" aria-label="Cloud Box home">
            <Logo size={26} accent={theme.accent} ink={theme.text} />
          </Link>

          <nav
            className="ml-6 hidden items-center gap-5 text-[13px] sm:flex"
            style={{ color: theme.muted }}
          >
            <a href="#how">How sharing works</a>
            <a href="#features">Features</a>
          </nav>

          <Link
            href="/login"
            className="btn ml-auto hidden h-9 shrink-0 whitespace-nowrap text-[13px] sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/login?mode=signup"
            className="btn btn-primary h-9 shrink-0 whitespace-nowrap text-[13px] sm:ml-0 ml-auto"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5">
        <section className="grid gap-12 py-14 sm:py-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
          <div>
            <p className="section-label mb-3">Smart Share</p>
            <h1 className="text-[2rem] font-semibold leading-[1.12] tracking-tight sm:text-[2.6rem]">
              Send a file.
              <br />
              It expires on its own.
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed" style={{ color: theme.muted }}>
              Cloud Box keeps your images and files in one place and hands out
              share links with a lifetime you choose. Whoever you send one to just
              opens it. No account, no app.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/login?mode=signup" className="btn btn-primary h-10 px-5 text-[14px]">
                Create an account
              </Link>
              <Link href="/login" className="btn h-10 px-5 text-[14px]">
                Sign in
              </Link>
            </div>
            <p className="mt-4 text-[12px]" style={{ color: theme.muted }}>
              Free while you are under your storage quota. No card, no trial timer.
            </p>
          </div>

          <ShareIllustration />
        </section>

        <section id="how" className="border-t py-14" style={{ borderColor: theme.border }}>
          <h2 className="page-title mb-8">How sharing works</h2>
          <ol className="grid gap-8 sm:grid-cols-3">
            {STEPS.map(([title, body], i) => (
              <li key={title}>
                <span className="text-[12px] font-medium" style={{ color: theme.accent }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-1.5 text-[14px] font-medium">{title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed" style={{ color: theme.muted }}>
                  {body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section id="features" className="border-t py-14" style={{ borderColor: theme.border }}>
          <h2 className="page-title mb-8">Everything the app actually does</h2>
          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-3.5">
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: theme.secondary, color: theme.accent }}
                >
                  <Icon name={f.icon} size={17} />
                </span>
                <div>
                  <h3 className="text-[14px] font-medium">{f.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed" style={{ color: theme.muted }}>
                    {f.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t py-14" style={{ borderColor: theme.border }}>
          <div
            className="flex flex-col items-start gap-4 rounded-xl p-6 sm:flex-row sm:items-center sm:justify-between"
            style={{ backgroundColor: theme.secondary, border: `1px solid ${theme.border}` }}
          >
            <div>
              <h2 className="text-[15px] font-medium">Ready to send your first link?</h2>
              <p className="mt-1 text-[13px]" style={{ color: theme.muted }}>
                Takes about a minute to set up.
              </p>
            </div>
            <Link href="/login?mode=signup" className="btn btn-primary h-10 px-5 text-[14px]">
              Get started
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t" style={{ borderColor: theme.border }}>
        <div
          className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-6 text-[12px]"
          style={{ color: theme.muted }}
        >
          <span>Cloud Box</span>
          <Link href="/cloudBoxApi">API docs</Link>
          <a href="https://github.com/Kanishkrawatt" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <span className="ml-auto">Built with Next.js, Firebase and Cloudinary</span>
        </div>
      </footer>
    </div>
  );
}
