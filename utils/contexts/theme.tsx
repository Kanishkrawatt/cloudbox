import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { themeType, sidebarType } from "@/components/types";

export type ThemePreset = {
  name: string;
  label: string;
  dark: boolean;
  /** swatch shown in the theme picker: [background, surface, accent] */
  app: themeType;
  sidebar: sidebarType;
};

/**
 * `invertImage` drives the CSS `invert()` filter on the black PNG/SVG icons in
 * /public. App chrome inverts them on dark themes; the sidebar inverts them on
 * light ones, so both flags are derived from `dark` and never set by hand.
 */
const preset = (
  name: string,
  label: string,
  dark: boolean,
  app: Omit<themeType, "invertImage">,
  sidebar: Omit<sidebarType, "invertImage">
): ThemePreset => ({
  name,
  label,
  dark,
  app: { ...app, invertImage: dark },
  sidebar: { ...sidebar, invertImage: !dark },
});

export const THEMES: ThemePreset[] = [
  preset(
    "light",
    "Snow",
    false,
    {
      primary: "#FFFFFF",
      secondary: "#F4F5F7",
      accent: "#F09B6D",
      text: "#111827",
      secondaryText: "#4B5563",
      border: "#E5E7EB",
      muted: "#6B7280",
    },
    { primary: "#F1F2F4", hover: "#E2E4E8", text: "#111827" }
  ),
  preset(
    "dark",
    "Graphite",
    true,
    {
      primary: "#343541",
      secondary: "#3E3F4B",
      accent: "#6594D7",
      text: "#ECECF1",
      secondaryText: "#C5C6CF",
      border: "#4A4B57",
      muted: "#9A9BA6",
    },
    { primary: "#202123", hover: "#3E3F4B", text: "#ECECF1" }
  ),
  preset(
    "midnight",
    "Midnight",
    true,
    {
      primary: "#0B1120",
      secondary: "#151E31",
      accent: "#38BDF8",
      text: "#E2E8F0",
      secondaryText: "#B6C2D4",
      border: "#1F2A3F",
      muted: "#7D8BA3",
    },
    { primary: "#070C17", hover: "#18243B", text: "#E2E8F0" }
  ),
  preset(
    "dracula",
    "Dracula",
    true,
    {
      primary: "#282A36",
      secondary: "#343746",
      accent: "#BD93F9",
      text: "#F8F8F2",
      secondaryText: "#D5D3E0",
      border: "#44475A",
      muted: "#8E8CA3",
    },
    { primary: "#21222C", hover: "#44475A", text: "#F8F8F2" }
  ),
  preset(
    "nord",
    "Nord",
    true,
    {
      primary: "#2E3440",
      secondary: "#3B4252",
      accent: "#88C0D0",
      text: "#ECEFF4",
      secondaryText: "#D8DEE9",
      border: "#434C5E",
      muted: "#93A0B4",
    },
    { primary: "#272C36", hover: "#434C5E", text: "#ECEFF4" }
  ),
  preset(
    "forest",
    "Forest",
    true,
    {
      primary: "#0F1A14",
      secondary: "#17241C",
      accent: "#4ADE80",
      text: "#E7F3EA",
      secondaryText: "#C2D6C8",
      border: "#22352A",
      muted: "#87A08F",
    },
    { primary: "#0A130E", hover: "#1E3126", text: "#E7F3EA" }
  ),
  preset(
    "solarized",
    "Solarized",
    false,
    {
      primary: "#FDF6E3",
      secondary: "#F2EAD3",
      accent: "#268BD2",
      text: "#073642",
      secondaryText: "#586E75",
      border: "#E4DBC1",
      muted: "#93A1A1",
    },
    { primary: "#EEE8D5", hover: "#E0D8BF", text: "#073642" }
  ),
  preset(
    "sunset",
    "Sunset",
    false,
    {
      primary: "#FFF8F4",
      secondary: "#FFEBDF",
      accent: "#FF6B5B",
      text: "#3B2219",
      secondaryText: "#7A5344",
      border: "#F8DCCC",
      muted: "#A5816F",
    },
    { primary: "#FFE7D9", hover: "#FBD5C0", text: "#3B2219" }
  ),
];

/** Shown to anyone who has not picked a theme yet (landing, login, first run). */
export const DEFAULT_THEME = "light";

const byName = (name?: string | null) =>
  THEMES.find((t) => t.name === name) ??
  THEMES.find((t) => t.name === DEFAULT_THEME) ??
  THEMES[0];

export const THEME_STORAGE_KEY = "theme";

export const defaultPreset = () => byName(DEFAULT_THEME);

/** Kept for backwards compatibility with the original two-theme exports. */
export const theme1 = THEMES[0].app;
export const theme2 = THEMES[1].app;
export const sidebar1 = THEMES[0].sidebar;
export const sidebar2 = THEMES[1].sidebar;

/** CSS custom properties for one preset, so plain CSS can follow the theme. */
export const themeVars = (t: ThemePreset) => ({
  "color-scheme": t.dark ? "dark" : "light",
  "--bg": t.app.primary,
  "--surface": t.app.secondary,
  "--accent": t.app.accent,
  "--text": t.app.text,
  "--text-secondary": t.app.secondaryText ?? t.app.text,
  "--muted": t.app.muted ?? t.app.secondaryText ?? t.app.text,
  "--border": t.app.border ?? t.app.secondary,
  "--sidebar-bg": t.sidebar.primary,
  "--sidebar-hover": t.sidebar.hover,
  "--sidebar-text": t.sidebar.text,
});

/**
 * Stylesheet emitted once in _document so the correct palette is painted on the
 * very first frame (no flash) and stays the single source of truth: both this
 * CSS and the inline `style` props come from THEMES.
 */
export const themeStylesheet = () =>
  THEMES.map((t) => {
    const body = Object.entries(themeVars(t))
      .map(([k, v]) => `${k}:${v};`)
      .join("");
    const selector =
      t.name === DEFAULT_THEME
        ? `:root,:root[data-theme="${t.name}"]`
        : `:root[data-theme="${t.name}"]`;
    return `${selector}{${body}}`;
  }).join("\n");

/** Runs before first paint in _document to avoid a theme flash. */
export const themeNoFlashScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='theme1')t='light';if(t==='theme2')t='dark';var names=${JSON.stringify(
  THEMES.map((t) => t.name)
)};if(names.indexOf(t)===-1)t='${DEFAULT_THEME}';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

type themeContextType = {
  theme: themeType;
  sidebar: sidebarType;
  themeName: string;
  themes: ThemePreset[];
  setThemeName: (name: string) => void;
  setTheme: (theme: themeType) => void;
  setSidebar: (sidebar: sidebarType) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<themeContextType>({
  theme: defaultPreset().app,
  sidebar: defaultPreset().sidebar,
  themeName: DEFAULT_THEME,
  themes: THEMES,
  setThemeName: () => {},
  setTheme: () => {},
  setSidebar: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeName, setThemeNameState] = useState<string>(DEFAULT_THEME);
  // Overrides let the legacy setTheme/setSidebar API keep working.
  const [override, setOverride] = useState<Partial<ThemePreset>>({});

  const preset = useMemo(() => byName(themeName), [themeName]);

  const setThemeName = useCallback((name: string) => {
    const next = byName(name);
    setOverride({});
    setThemeNameState(next.name);
    document.documentElement.setAttribute("data-theme", next.name);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next.name);
    } catch {
      /* storage can be unavailable (private mode), theme just won't persist */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeName(byName(themeName).dark ? "light" : "dark");
  }, [themeName, setThemeName]);

  // Legacy setters: match the palette back to a preset when possible.
  const setTheme = useCallback(
    (app: themeType) => {
      const match = THEMES.find((t) => t.app.primary === app.primary);
      if (match) setThemeName(match.name);
      else setOverride((o) => ({ ...o, app }));
    },
    [setThemeName]
  );
  const setSidebar = useCallback((sidebar: sidebarType) => {
    setOverride((o) => ({ ...o, sidebar }));
  }, []);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (stored === "theme1") stored = "light";
    if (stored === "theme2") stored = "dark";
    const next = byName(stored);
    setThemeNameState(next.name);
    document.documentElement.setAttribute("data-theme", next.name);
  }, []);

  const value = useMemo<themeContextType>(
    () => ({
      theme: override.app ?? preset.app,
      sidebar: override.sidebar ?? preset.sidebar,
      themeName: preset.name,
      themes: THEMES,
      setThemeName,
      setTheme,
      setSidebar,
      toggleTheme,
    }),
    [override, preset, setThemeName, setTheme, setSidebar, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export default ThemeProvider;
