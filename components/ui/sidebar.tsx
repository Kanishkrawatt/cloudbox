import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTheme } from "@/utils/contexts/theme";
import { useMediaQuery } from "@/utils/contexts/mediaQuery";
import ThemePicker from "@/components/ui/themePicker";
import Icon, { IconName } from "@/components/ui/icons";
import { LogoMark } from "@/components/ui/logo";

type MenuItem = { title: string; icon: IconName; link: string; group?: number };

export const MENUS: MenuItem[] = [
  { title: "Home", icon: "home", link: "/home", group: 0 },
  { title: "Images", icon: "image", link: "/images", group: 0 },
  { title: "Files", icon: "file", link: "/files", group: 0 },
  { title: "Upload", icon: "upload", link: "/uploadFile", group: 1 },
  { title: "Smart Share", icon: "share", link: "/smartshare", group: 1 },
  { title: "Storage", icon: "chart", link: "/storage", group: 2 },
  { title: "API", icon: "code", link: "/cloudBoxApi", group: 2 },
];

const isActive = (pathname: string, link: string) =>
  link === "/home" ? pathname === "/home" || pathname === "/" : pathname.startsWith(link);

/** Theme popover shared by the desktop rail and the mobile bar. */
const ThemeMenu = ({
  open,
  onClose,
  className,
}: {
  open: boolean;
  onClose: () => void;
  className: string;
}) => {
  const { theme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div ref={ref} className={`menu ${className} z-50 w-60 p-2`}>
      <p className="section-label px-1 pb-2">Theme</p>
      <ThemePicker compact />
    </div>
  );
};

const Sidebar = () => {
  const { sidebar, theme } = useTheme();
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [themeMenu, setThemeMenu] = useState(false);
  const { isMobile } = useMediaQuery();

  useEffect(() => {
    const stored = sessionStorage.getItem("sidebar");
    if (stored && !isMobile) setOpen(JSON.parse(stored).open);
  }, [isMobile]);

  useEffect(() => {
    sessionStorage.setItem("sidebar", JSON.stringify({ open }));
  }, [open]);

  // Mobile: a bottom bar, since the rail is hidden and nav was unreachable.
  if (isMobile) {
    return (
      <>
        <ThemeMenu
          open={themeMenu}
          onClose={() => setThemeMenu(false)}
          className="fixed bottom-[4.5rem] left-1/2 -translate-x-1/2"
        />
        <nav
          className="fixed bottom-0 left-0 z-40 flex w-full items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]"
          style={{
            backgroundColor: sidebar.primary,
            color: sidebar.text,
            borderTop: `1px solid ${theme.border}`,
          }}
        >
          {MENUS.slice(0, 5).map((menu) => {
            const active = isActive(router.pathname, menu.link);
            return (
              <Link
                key={menu.link}
                href={menu.link}
                aria-label={menu.title}
                aria-current={active ? "page" : undefined}
                className="flex flex-1 flex-col items-center gap-1 py-2 text-[10px]"
                style={{ color: active ? theme.accent : theme.muted }}
              >
                <Icon name={menu.icon} size={20} />
                {menu.title}
              </Link>
            );
          })}
          <button
            type="button"
            aria-label="Theme settings"
            aria-expanded={themeMenu}
            onClick={() => setThemeMenu((v) => !v)}
            className="flex flex-1 flex-col items-center gap-1 py-2 text-[10px]"
            style={{ color: themeMenu ? theme.accent : theme.muted }}
          >
            <Icon name="settings" size={20} />
            Theme
          </button>
        </nav>
      </>
    );
  }

  return (
    <aside
      className={`${open ? "w-60" : "w-[4.25rem]"} relative flex h-screen shrink-0 flex-col p-3 transition-[width] duration-150`}
      style={{
        backgroundColor: sidebar.primary,
        color: sidebar.text,
        borderRight: `1px solid ${theme.border}`,
      }}
    >
      <div className="mb-5 flex items-center gap-2 px-1 pt-1">
        <Link
          href="/home"
          className="flex min-w-0 items-center gap-2"
          aria-label="Cloud Box home"
        >
          <LogoMark size={26} accent={theme.accent} ink={sidebar.text} />
          {open && (
            <span className="truncate text-[15px] font-semibold tracking-tight">
              Cloud Box
            </span>
          )}
        </Link>
        {open && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Collapse sidebar"
            className="ml-auto rounded-md p-1.5"
            style={{ color: theme.muted }}
          >
            <Icon name="menu" size={18} />
          </button>
        )}
      </div>

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Expand sidebar"
          className="mb-3 self-center rounded-md p-1.5"
          style={{ color: theme.muted }}
        >
          <Icon name="menu" size={18} />
        </button>
      )}

      <nav className="flex flex-1 flex-col gap-0.5">
        {MENUS.map((menu, i) => {
          const active = isActive(router.pathname, menu.link);
          const startsGroup = i > 0 && MENUS[i - 1].group !== menu.group;
          return (
            <React.Fragment key={menu.link}>
              {startsGroup && (
                <hr
                  className="my-2"
                  style={{ borderColor: theme.border }}
                  aria-hidden="true"
                />
              )}
              <Link
                href={menu.link}
                title={open ? undefined : menu.title}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${open ? "" : "justify-center"}`}
                style={{
                  backgroundColor: active ? sidebar.hover : "transparent",
                  color: active ? theme.text : theme.muted,
                  fontWeight: active ? 500 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = sidebar.hover;
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Icon
                  name={menu.icon}
                  size={18}
                  className="shrink-0"
                  strokeWidth={active ? 1.9 : 1.6}
                />
                {open && <span className="truncate">{menu.title}</span>}
              </Link>
            </React.Fragment>
          );
        })}
      </nav>

      <div className="relative mt-auto">
        <ThemeMenu
          open={themeMenu}
          onClose={() => setThemeMenu(false)}
          className="absolute bottom-11 left-0"
        />
        <button
          type="button"
          aria-label="Theme settings"
          aria-expanded={themeMenu}
          onClick={() => setThemeMenu((v) => !v)}
          className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] ${open ? "" : "justify-center"}`}
          style={{
            backgroundColor: themeMenu ? sidebar.hover : "transparent",
            color: theme.muted,
          }}
        >
          <Icon name="settings" size={18} className="shrink-0" />
          {open && <span>Theme</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
