import React, { useEffect } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth } from "@/utils/contexts/auth";
import { useTheme } from "@/utils/contexts/theme";
import Icon, { IconName } from "@/components/ui/icons";
import Logo from "@/components/ui/logo";
import HeroDemo from "@/components/ui/heroDemo";

/** Fixed hues for icon tiles; readable on every theme at 18% alpha. */
const HUES = ["#F97316", "#0EA5E9", "#8B5CF6", "#10B981", "#F59E0B", "#EC4899"];
const tile = (i: number) => ({ backgroundColor: `${HUES[i % HUES.length]}2e`, color: HUES[i % HUES.length] });

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "share",
    title: "Links that expire",
    body: "Pick a lifetime from a day to a week. The link stops working on time and the files clean themselves up afterwards.",
  },
  {
    icon: "user",
    title: "No account for the recipient",
    body: "They open the link and download. No sign-up wall, no app, nothing to install.",
  },
  {
    icon: "users",
    title: "Sort by face",
    body: "Shared albums group photos by who is in them, so everyone finds their own pictures in one tap.",
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
  {
    icon: "code",
    title: "An API when you need it",
    body: "List, fetch and delete your files with a bearer token. Same data, no browser required.",
  },
];

const STEPS: { icon: IconName; title: string; body: string }[] = [
  { icon: "upload", title: "Drop the files in", body: "Drag anything onto the Smart Share page. Rename as you go." },
  { icon: "lock", title: "Choose how long it lives", body: "One day, two, five, or a week. That is the whole setting." },
  { icon: "link", title: "Send the link", body: "They open it in any browser and download. Then it expires." },
];

const MOCK_FILES: { icon: IconName; name: string; size: string; hue: number }[] = [
  { icon: "image", name: "goa-trip-day-1.jpg", size: "4.2 MB", hue: 1 },
  { icon: "image", name: "goa-trip-day-2.jpg", size: "3.8 MB", hue: 1 },
  { icon: "video", name: "sunset.mp4", size: "48 MB", hue: 2 },
  { icon: "file", name: "itinerary.pdf", size: "310 KB", hue: 0 },
];

export default function Landing() {
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-5">
          <Link href="/" aria-label="Cloud Box home">
            <Logo size={26} accent={theme.accent} ink={theme.text} />
          </Link>

          <nav className="ml-6 hidden items-center gap-5 text-[13px] sm:flex" style={{ color: theme.muted }}>
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <Link href="/cloudBoxApi">API</Link>
          </nav>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Switch theme"
            title="Switch theme"
            className="btn ml-auto h-9 w-9 shrink-0 px-0"
          >
            <Icon name="sparkle" size={15} />
          </button>
          <Link href="/login" className="btn hidden h-9 shrink-0 whitespace-nowrap text-[13px] sm:inline-flex">
            Sign in
          </Link>
          <Link
            href="/login?mode=signup"
            className="btn btn-primary h-9 shrink-0 whitespace-nowrap text-[13px]"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5">
        {/* Hero */}
        <section className="relative grid gap-12 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full blur-3xl"
            style={{
              background: `radial-gradient(closest-side at 35% 50%, ${theme.accent}40, transparent 70%), radial-gradient(closest-side at 70% 40%, ${HUES[2]}30, transparent 70%)`,
            }}
          />
          <div className="relative">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-medium"
              style={{ backgroundColor: theme.secondary, color: theme.accent, border: `1px solid ${theme.border}` }}
            >
              <Icon name="sparkle" size={13} />
              Smart Share, now with sort by face
            </span>
            <h1 className="mt-5 text-[2.4rem] font-semibold leading-[1.08] tracking-tight sm:text-[3.4rem]">
              Send a file.
              <br />
              <span style={{ color: theme.accent }}>It expires on its own.</span>
            </h1>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed" style={{ color: theme.muted }}>
              Cloud Box keeps your images and files in one place and hands out share
              links with a lifetime you choose. Whoever you send one to just opens it.
              No account, no app.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/login?mode=signup" className="btn btn-primary h-11 px-6 text-[14px]">
                Create a free account
                <Icon name="external" size={14} />
              </Link>
              <Link href="/login" className="btn h-11 px-6 text-[14px]">
                Sign in
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px]" style={{ color: theme.muted }}>
              {["No card required", "Recipients never sign up", "Files delete themselves"].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5">
                  <span className="shrink-0" style={{ color: theme.accent }}><Icon name="check" size={13} strokeWidth={2.2} /></span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <HeroDemo />
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-t py-16 sm:py-20" style={{ borderColor: theme.border }}>
          <div className="mb-10 max-w-lg">
            <p className="section-label mb-2">How sharing works</p>
            <h2 className="text-[1.6rem] font-semibold tracking-tight sm:text-[2rem]">
              Three steps. About a minute.
            </h2>
          </div>
          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="card relative p-6">
                <span
                  className="absolute right-5 top-5 text-[40px] font-semibold leading-none tracking-tight"
                  style={{ color: theme.border }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={tile(i)}>
                  <Icon name={s.icon} size={18} />
                </span>
                <h3 className="mt-5 text-[15px] font-medium">{s.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: theme.muted }}>
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Product mock */}
        <section className="border-t py-16 sm:py-20" style={{ borderColor: theme.border }}>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
            <div>
              <p className="section-label mb-2">What they see</p>
              <h2 className="text-[1.6rem] font-semibold tracking-tight sm:text-[2rem]">
                A clean page, a countdown, a download button.
              </h2>
              <p className="mt-4 text-[14.5px] leading-relaxed" style={{ color: theme.muted }}>
                The person you share with gets a plain page listing the files and how
                long the link has left. Photos are grouped by face, so they can grab
                only the ones they are in.
              </p>
            </div>

            <div className="surface rounded-2xl p-2 shadow-[0_30px_60px_-40px_rgb(0_0_0/0.5)]">
              <div className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Logo size={22} accent={theme.accent} ink={theme.text} />
                    <div>
                      <p className="text-[14px] font-medium">Goa trip</p>
                      <p className="text-[12px]" style={{ color: theme.muted }}>
                        4 files · 56 MB
                      </p>
                    </div>
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium"
                    style={{ backgroundColor: theme.secondary, color: theme.accent }}
                  >
                    <Icon name="lock" size={12} />
                    Expires in 2 days
                  </span>
                </div>

                <div className="mt-4 flex gap-2">
                  {["Everyone", "Photos of me"].map((t, i) => (
                    <span
                      key={t}
                      className="rounded-full px-3 py-1 text-[12px] font-medium"
                      style={{
                        backgroundColor: i === 0 ? theme.accent : theme.secondary,
                        color: i === 0 ? theme.primary : theme.muted,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <ul className="mt-4 divide-y" style={{ borderColor: theme.border }}>
                  {MOCK_FILES.map((f) => (
                    <li
                      key={f.name}
                      className="flex items-center gap-3 py-2.5 text-[13px]"
                      style={{ borderColor: theme.border }}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={tile(f.hue)}>
                        <Icon name={f.icon} size={15} />
                      </span>
                      <span className="truncate">{f.name}</span>
                      <span className="ml-auto shrink-0 text-[12px]" style={{ color: theme.muted }}>
                        {f.size}
                      </span>
                      <span className="shrink-0" style={{ color: theme.muted }}><Icon name="download" size={15} /></span>
                    </li>
                  ))}
                </ul>

                <button type="button" tabIndex={-1} className="btn btn-primary mt-4 h-10 w-full text-[13px]">
                  <Icon name="download" size={15} />
                  Download all
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t py-16 sm:py-20" style={{ borderColor: theme.border }}>
          <div className="mb-10 max-w-lg">
            <p className="section-label mb-2">Features</p>
            <h2 className="text-[1.6rem] font-semibold tracking-tight sm:text-[2rem]">
              Everything the app actually does
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="card p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={tile(i)}>
                  <Icon name={f.icon} size={18} />
                </span>
                <h3 className="mt-5 text-[15px] font-medium">{f.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: theme.muted }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-20">
          <div
            className="relative overflow-hidden rounded-2xl p-8 text-center sm:p-14"
            style={{ backgroundColor: theme.secondary, border: `1px solid ${theme.border}` }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ background: `radial-gradient(50% 120% at 30% 0%, ${theme.accent}38, transparent), radial-gradient(50% 120% at 75% 0%, ${HUES[2]}26, transparent)` }}
            />
            <div className="relative">
              <h2 className="text-[1.6rem] font-semibold tracking-tight sm:text-[2.2rem]">
                Ready to send your first link?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[14.5px]" style={{ color: theme.muted }}>
                Free while you are under your storage quota. No card, no trial timer.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link href="/login?mode=signup" className="btn btn-primary h-11 px-6 text-[14px]">
                  Get started
                </Link>
                <Link href="/cloudBoxApi" className="btn h-11 px-6 text-[14px]">
                  Read the API docs
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t" style={{ borderColor: theme.border }}>
        <div
          className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-6 text-[12px]"
          style={{ color: theme.muted }}
        >
          <span className="inline-flex items-center gap-2">
            <Logo size={16} accent={theme.accent} ink={theme.muted} />
            Cloud Box
          </span>
          <Link href="/cloudBoxApi">API docs</Link>
          <a href="https://github.com/Kanishkrawatt/cloudbox" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <span className="ml-auto">Built with Next.js, Firebase and Cloudinary</span>
        </div>
      </footer>
    </div>
  );
}
