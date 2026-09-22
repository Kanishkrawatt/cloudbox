import React from "react";
import { useTheme } from "@/utils/contexts/theme";

/**
 * Landing hero art: the Smart Share story in one picture, a file leaves your
 * library, becomes a link with a clock on it, and the person you sent it to
 * downloads it before it expires. Pure vector, themed, no raster assets.
 */
const ShareIllustration = () => {
  const { theme } = useTheme();
  const { primary, secondary, accent, border, muted, text } = theme;

  return (
    <svg
      viewBox="0 0 560 420"
      className="h-auto w-full"
      role="img"
      aria-label="A file being shared as a link that expires, then downloaded by someone else"
    >
      <defs>
        <linearGradient id="cb-fade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.16" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
        <clipPath id="cb-thumb">
          <rect x="52" y="74" width="150" height="96" rx="8" />
        </clipPath>
      </defs>

      <rect x="16" y="16" width="528" height="388" rx="18" fill="url(#cb-fade)" />

      {/* --- source card: a file in your library --- */}
      <g>
        <rect
          x="38"
          y="58"
          width="178"
          height="150"
          rx="14"
          fill={primary}
          stroke={border}
          strokeWidth="1.5"
        />
        <rect x="52" y="74" width="150" height="96" rx="8" fill={secondary} />
        <g clipPath="url(#cb-thumb)">
          <circle cx="92" cy="112" r="13" fill={accent} opacity="0.75" />
          <path d="M52 158l38-34 30 26 24-18 58 44H52z" fill={accent} opacity="0.35" />
        </g>
        <rect x="52" y="180" width="86" height="8" rx="4" fill={border} />
        <rect x="146" y="180" width="30" height="8" rx="4" fill={border} opacity="0.6" />
      </g>

      {/* --- flow: card → link → recipient --- */}
      <path
        d="M222 132c36 0 42-34 74-34"
        stroke={border}
        strokeWidth="1.5"
        strokeDasharray="4 6"
        fill="none"
      />
      <path
        d="M300 98c34 0 34 122 74 122"
        stroke={border}
        strokeWidth="1.5"
        strokeDasharray="4 6"
        fill="none"
      />

      {/* --- the link pill, with its expiry clock --- */}
      <g>
        <rect
          x="256"
          y="74"
          width="248"
          height="48"
          rx="24"
          fill={primary}
          stroke={accent}
          strokeWidth="1.5"
        />
        <g transform="translate(276 89)" stroke={accent} strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M7 11a3.6 3.6 0 0 0 5.1 0l3-3a3.6 3.6 0 0 0-5.1-5.1l-1 1" />
          <path d="M11 7a3.6 3.6 0 0 0-5.1 0l-3 3A3.6 3.6 0 0 0 8 15.1l1-1" />
        </g>
        <rect x="306" y="92" width="120" height="8" rx="4" fill={border} />
        <rect x="306" y="105" width="72" height="6" rx="3" fill={border} opacity="0.6" />
        <g transform="translate(446 84)">
          <circle cx="14" cy="14" r="13" fill={secondary} stroke={accent} strokeWidth="1.5" />
          <path
            d="M14 8v6.4l4 2.4"
            stroke={accent}
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      </g>
      <text x="256" y="142" fill={muted} fontSize="12" fontFamily="Inter, system-ui, sans-serif">
        expires automatically
      </text>

      {/* --- recipient window: no account needed --- */}
      <g>
        <rect
          x="300"
          y="196"
          width="222"
          height="176"
          rx="14"
          fill={primary}
          stroke={border}
          strokeWidth="1.5"
        />
        <path d="M300 226h222" stroke={border} strokeWidth="1.5" />
        <circle cx="316" cy="211" r="3.5" fill={border} />
        <circle cx="328" cy="211" r="3.5" fill={border} />
        <circle cx="340" cy="211" r="3.5" fill={border} />
        <rect x="318" y="244" width="84" height="72" rx="8" fill={secondary} />
        <circle cx="342" cy="268" r="9" fill={accent} opacity="0.7" />
        <path d="M318 308l26-22 20 16 16-12 22 18h-84z" fill={accent} opacity="0.3" />
        <rect x="318" y="326" width="60" height="7" rx="3.5" fill={border} />

        <g transform="translate(420 250)">
          <rect width="84" height="30" rx="15" fill={accent} />
          <g stroke={primary} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 9v10m0 0-4-4m4 4 4-4M14 23h12" />
          </g>
          <rect x="34" y="11" width="36" height="8" rx="4" fill={primary} opacity="0.85" />
        </g>
        <rect x="420" y="296" width="72" height="7" rx="3.5" fill={border} />
        <rect x="420" y="311" width="52" height="7" rx="3.5" fill={border} opacity="0.6" />
      </g>

      <text x="38" y="240" fill={text} fontSize="13" fontWeight="600" fontFamily="Inter, system-ui, sans-serif">
        Your file
      </text>
      <text x="300" y="396" fill={text} fontSize="13" fontWeight="600" fontFamily="Inter, system-ui, sans-serif">
        Their browser, no account needed
      </text>
    </svg>
  );
};

export default ShareIllustration;
