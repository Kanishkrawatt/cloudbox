import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/utils/contexts/auth";
import { useTheme } from "@/utils/contexts/theme";
import { useSearch } from "@/utils/contexts/search";
import Icon from "@/components/ui/icons";

const Topbar = ({
  title,
  action,
}: {
  title?: string;
  action?: React.ReactNode;
}) => {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const { query, setQuery } = useSearch();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  // "/" focuses search, the way every file browser does it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        document.getElementById("simple-search")?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      className="flex h-14 shrink-0 items-center gap-3 px-4 sm:px-6"
      style={{ borderBottom: `1px solid ${theme.border}` }}
    >
      {title && <h1 className="page-title mr-1 hidden shrink-0 sm:block">{title}</h1>}

      <form
        className="relative ml-auto w-full max-w-sm"
        role="search"
        onSubmit={(e) => e.preventDefault()}
      >
        <label htmlFor="simple-search" className="sr-only">
          Search
        </label>
        <span
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
          style={{ color: theme.muted }}
        >
          <Icon name="search" size={16} />
        </span>
        <input
          type="search"
          id="simple-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="field h-9 py-0 pl-8 pr-8 text-[13px]"
          style={{ backgroundColor: theme.secondary, borderColor: theme.border }}
          placeholder="Search files and images"
          autoComplete="off"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            style={{ color: theme.muted }}
          >
            <Icon name="close" size={14} />
          </button>
        ) : (
          <kbd
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded px-1.5 py-0.5 text-[10px] sm:block"
            style={{ color: theme.muted, border: `1px solid ${theme.border}` }}
          >
            /
          </kbd>
        )}
      </form>

      {action}

      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenu((v) => !v)}
          aria-label="Account menu"
          aria-expanded={menu}
          className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full"
          style={{
            backgroundColor: theme.secondary,
            border: `1px solid ${theme.border}`,
            color: theme.muted,
          }}
        >
          {user?.photoURL ? (
            <Image src={user.photoURL} alt="" fill sizes="32px" className="object-cover" />
          ) : (
            <Icon name="user" size={16} />
          )}
        </button>

        {menu && (
          <div className="menu absolute right-0 top-10 z-50 w-56 p-1.5">
            <div className="px-2.5 pb-2 pt-1.5">
              <p className="truncate text-[13px] font-medium">
                {user?.displayName ?? "Signed in"}
              </p>
              <p className="truncate text-xs" style={{ color: theme.muted }}>
                {user?.email}
              </p>
            </div>
            <hr style={{ borderColor: theme.border }} />
            <Link href="/profile" className="menu-item mt-1 text-[13px]">
              <Icon name="user" size={15} /> Profile
            </Link>
            <button
              type="button"
              className="menu-item text-[13px]"
              onClick={async () => {
                await signOut();
                router.replace("/");
              }}
            >
              <Icon name="external" size={15} /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
