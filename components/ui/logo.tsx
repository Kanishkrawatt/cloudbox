import React from "react";

/**
 * Cloud Box mark: an open-topped box whose lid is a cloud. Monoline so it reads
 * at 16px in a tab and at 64px on the landing page; colours come from props so
 * it sits on any theme.
 */
export const LogoMark = ({
  size = 28,
  accent = "currentColor",
  ink = "currentColor",
}: {
  size?: number;
  accent?: string;
  ink?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    {/* box */}
    <path
      d="M5 13.5 16 8l11 5.5v9L16 28 5 22.5v-9Z"
      stroke={ink}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M5 13.5 16 19l11-5.5M16 19v9" stroke={ink} strokeWidth="1.8" strokeLinejoin="round" />
    {/* cloud rising out of it */}
    <path
      d="M11.5 9.5a3.2 3.2 0 0 1 3.1-3.9c1.2 0 2.3.7 2.8 1.8a2.4 2.4 0 0 1 3.3 2.1"
      stroke={accent}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

/** Mark plus wordmark, used in the sidebar, landing header and share page. */
const Logo = ({
  size = 28,
  accent,
  ink,
  showWord = true,
  className = "",
}: {
  size?: number;
  accent?: string;
  ink?: string;
  showWord?: boolean;
  className?: string;
}) => (
  <span className={`inline-flex items-center gap-2 ${className}`}>
    <LogoMark size={size} accent={accent} ink={ink} />
    {showWord && (
      <span className="text-[15px] font-semibold tracking-tight">Cloud Box</span>
    )}
  </span>
);

export default Logo;
