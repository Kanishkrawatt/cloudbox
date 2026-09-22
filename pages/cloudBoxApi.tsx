import fs from "fs";
import React from "react";
import Head from "next/head";
import Link from "next/link";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote } from "next-mdx-remote";
import { components } from "@/components/md";
import Logo from "@/components/ui/logo";
import { useTheme } from "../utils/contexts/theme";
import { useAuth } from "../utils/contexts/auth";

/**
 * Public API reference. Deliberately outside the app shell: someone deciding
 * whether to integrate should not have to create an account to read the docs.
 */
const Api = ({ source }: { source: any }) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.primary, color: theme.text }}>
      <Head>
        <title>Cloud Box API</title>
        <meta name="description" content="REST endpoints for Cloud Box: library, Smart Share, People and webhooks." />
      </Head>

      <header
        className="sticky top-0 z-40 backdrop-blur"
        style={{ borderBottom: `1px solid ${theme.border}`, backgroundColor: `${theme.primary}e6` }}
      >
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-5">
          <Link href="/" aria-label="Cloud Box home">
            <Logo size={26} accent={theme.accent} ink={theme.text} />
          </Link>
          <span className="text-[13px]" style={{ color: theme.muted }}>
            API reference
          </span>
          {user ? (
            <Link href="/profile" className="btn ml-auto h-9 text-[13px]">
              Your API token
            </Link>
          ) : (
            <Link href="/login" className="btn ml-auto h-9 text-[13px]">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 text-[14px] leading-7">
        <MDXRemote {...source} components={components} />
      </main>

      <footer className="border-t" style={{ borderColor: theme.border }}>
        <div className="mx-auto flex max-w-3xl flex-wrap gap-x-6 px-5 py-6 text-[12px]" style={{ color: theme.muted }}>
          <Link href="/">Cloud Box</Link>
          <a href="https://github.com/Kanishkrawatt/cloudbox" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Api;

export async function getStaticProps() {
  const source = fs.readFileSync("docs/api.md");
  const mdxSource = await serialize(source);
  return { props: { source: mdxSource }, revalidate: 10 };
}
