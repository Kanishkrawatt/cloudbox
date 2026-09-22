import React from "react";
import { useTheme } from "@/utils/contexts/theme";
import Icon from "@/components/ui/icons";

/** Theme swatch list. Used by the sidebar popover and the profile page. */
const ThemePicker = ({ compact = false }: { compact?: boolean }) => {
  const { themes, themeName, setThemeName, theme } = useTheme();

  return (
    <div className={compact ? "flex flex-col gap-0.5" : "grid gap-1 sm:grid-cols-2"}>
      {themes.map((preset) => {
        const active = preset.name === themeName;
        return (
          <button
            key={preset.name}
            type="button"
            aria-pressed={active}
            title={preset.label}
            onClick={() => setThemeName(preset.name)}
            className="menu-item text-[13px]"
            style={{
              backgroundColor: active ? theme.secondary : "transparent",
              color: active ? theme.text : theme.muted,
            }}
          >
            <span
              className="flex h-4 w-4 shrink-0 overflow-hidden rounded-full"
              style={{ boxShadow: `inset 0 0 0 1px ${theme.border}` }}
            >
              <span className="h-full w-1/2" style={{ backgroundColor: preset.app.primary }} />
              <span className="h-full w-1/2" style={{ backgroundColor: preset.app.accent }} />
            </span>
            <span className="truncate">{preset.label}</span>
            {active && (
              <Icon name="check" size={14} className="ml-auto" strokeWidth={2} />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ThemePicker;
