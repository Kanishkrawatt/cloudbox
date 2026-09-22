import React, { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTheme } from "@/utils/contexts/theme";
import Icon from "@/components/ui/icons";
import Logo from "@/components/ui/logo";
import { faceCrop } from "@/utils/faceApi";
import type { SharePayload } from "./api/smartshare/[id]";

const prettySize = (bytes: number) =>
  bytes <= 0
    ? ""
    : bytes >= 1024 ** 2
    ? `${(bytes / 1024 ** 2).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/**
 * Public recipient page. Deliberately outside the app shell: a share link has
 * to work for someone who has no Cloud Box account.
 */
function SmartShow() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = router.query;

  const [share, setShare] = useState<SharePayload | null>(null);
  const [person, setPerson] = useState<number>(-1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (shareId: string, quiet = false) => {
    if (!quiet) setLoading(true);
    const res = await fetch(`/api/smartshare/${shareId}`);
    const body = await res.json();
    if (!res.ok) {
      setError(body?.error ?? "This link is not available.");
      setShare(null);
    } else {
      setShare(body);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    if (!id) {
      setError("This link is missing its share id.");
      setLoading(false);
      return;
    }
    load(String(id));
  }, [router.isReady, id, load]);

  // Sorting runs after the share is created, so a recipient who opens the link
  // straight away sees the banner and then the people row, without reloading.
  useEffect(() => {
    if (share?.faceStatus !== "running" || !id) return;
    const timer = setInterval(() => load(String(id), true), 10000);
    return () => clearInterval(timer);
  }, [share?.faceStatus, id, load]);

  const download = async (url: string, name: string) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
  };

  // A photo can belong to several people, so filtering is a membership test.
  const selected = person >= 0 ? share?.people?.[person] : undefined;
  const visible = selected
    ? (share?.files ?? []).filter((file) => selected.photos.includes(file.url))
    : share?.files ?? [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.primary, color: theme.text }}>
      <Head>
        <title>{share?.name ? `${share.name} | Cloud Box` : "Shared files | Cloud Box"}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <header style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-2 px-5">
          <Link href="/" aria-label="Cloud Box home">
            <Logo size={26} accent={theme.accent} ink={theme.text} />
          </Link>
          <Link href="/login?mode=signup" className="btn ml-auto h-9 text-[13px]">
            Get your own
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8">
        {loading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton aspect-square rounded-lg" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div
            className="mx-auto flex max-w-md flex-col items-center gap-2 rounded-xl px-6 py-14 text-center"
            style={{ border: `1px dashed ${theme.border}` }}
          >
            <Icon name="link" size={22} />
            <p className="text-[14px] font-medium">{error}</p>
            <p className="text-[13px]" style={{ color: theme.muted }}>
              Ask whoever sent it to share a fresh link.
            </p>
          </div>
        )}

        {!loading && share && (
          <>
            <div className="mb-6">
              <h1 className="text-[1.375rem] font-semibold tracking-tight">{share.name}</h1>
              <p className="mt-1 text-[13px]" style={{ color: theme.muted }}>
                {share.files.length} file{share.files.length === 1 ? "" : "s"}
                {share.expiresOn ? ` · available until ${share.expiresOn}` : ""}
              </p>
            </div>

            {share.faceStatus === "running" && (
              <div
                className="mb-6 flex items-center gap-3 rounded-xl px-4 py-3"
                role="status"
                aria-live="polite"
                style={{
                  border: `1px solid ${theme.accent}`,
                  backgroundColor: theme.secondary,
                }}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: theme.accent, color: theme.primary }}
                >
                  <Icon name="sparkle" size={15} strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium">
                    Sorting these photos by face
                  </p>
                  <p className="text-[12px]" style={{ color: theme.muted }}>
                    People will appear here in a minute. The photos below are all
                    ready to view now.
                  </p>
                </div>
                <span
                  className="h-2 w-2 shrink-0 animate-pulse rounded-full"
                  style={{ backgroundColor: theme.accent }}
                  aria-hidden="true"
                />
              </div>
            )}

            {share.faceStatus === "failed" && share.people?.length === 0 && (
              <div
                className="mb-6 rounded-xl px-4 py-3 text-[13px]"
                style={{ border: `1px solid ${theme.border}`, color: theme.muted }}
              >
                Sorting by face did not finish for this share. All the photos are
                still here.
              </div>
            )}

            {share.people?.length > 0 && (
              <div className="mb-7 -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
                <button
                  type="button"
                  onClick={() => setPerson(-1)}
                  className="flex shrink-0 flex-col items-center gap-1.5"
                  aria-pressed={person === -1}
                >
                  <span
                    className="flex h-[72px] w-[72px] items-center justify-center rounded-full"
                    style={{
                      backgroundColor: theme.secondary,
                      color: person === -1 ? theme.accent : theme.muted,
                      border: `2px solid ${person === -1 ? theme.accent : theme.border}`,
                    }}
                  >
                    <Icon name="image" size={24} />
                  </span>
                  <span
                    className="text-[12px]"
                    style={{ color: person === -1 ? theme.text : theme.muted }}
                  >
                    All
                  </span>
                  <span className="text-[11px]" style={{ color: theme.muted }}>
                    {share.files.length}
                  </span>
                </button>

                {share.people.map((group, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setPerson(index)}
                    className="flex shrink-0 flex-col items-center gap-1.5"
                    aria-pressed={person === index}
                    title={`${group.photos.length} photos`}
                  >
                    {/* Cloudinary crops to the face itself, so no server-side crop is needed. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={faceCrop(
                        group.face?.url ?? group.photos[0],
                        group.face?.box,
                        160
                      )}
                      alt=""
                      className="h-[72px] w-[72px] rounded-full object-cover"
                      style={{
                        border: `2px solid ${person === index ? theme.accent : theme.border}`,
                      }}
                    />
                    <span
                      className="text-[12px]"
                      style={{ color: person === index ? theme.text : theme.muted }}
                    >
                      Person {index + 1}
                    </span>
                    <span className="text-[11px]" style={{ color: theme.muted }}>
                      {group.photos.length}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {visible.length === 0 ? (
              <p className="text-[13px]" style={{ color: theme.muted }}>
                This share has no files in it.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {visible.map((file) => (
                  <figure key={file.url} className="min-w-0">
                    <div
                      className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg"
                      style={{
                        border: `1px solid ${theme.border}`,
                        backgroundColor: theme.secondary,
                        color: theme.muted,
                      }}
                    >
                      {file.type?.startsWith("image/") ? (
                        <Image
                          src={file.url}
                          alt={file.name}
                          fill
                          sizes="(max-width: 640px) 45vw, 22vw"
                          className="object-cover"
                        />
                      ) : (
                        <Icon name="file" size={22} />
                      )}
                    </div>
                    <figcaption className="mt-1.5 flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[12px]" title={file.name}>
                        {file.name}
                      </span>
                      <span className="shrink-0 text-[11px]" style={{ color: theme.muted }}>
                        {prettySize(file.size)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Download ${file.name}`}
                        className="shrink-0 rounded-md p-1"
                        style={{ color: theme.muted }}
                        onClick={() => download(file.url, file.name)}
                      >
                        <Icon name="download" size={15} />
                      </button>
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default SmartShow;
