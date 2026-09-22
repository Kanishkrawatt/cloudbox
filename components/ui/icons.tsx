/**
 * Stroked 24px icons, inline so they take `currentColor` and stay crisp.
 * Replaces the /public PNGs, which needed invert() filters per theme and
 * looked muddy at small sizes.
 */
import React from "react";

const PATHS = {
  home: "M3 10.5 12 3l9 7.5M5.5 9.5V20a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9.5",
  image: "M3 5.5A1.5 1.5 0 0 1 4.5 4h15A1.5 1.5 0 0 1 21 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5zM3 16l4.5-4.5L12 16M14 13.5 16.5 11l4.5 4.5M15.5 8.5h.01",
  file: "M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7zM14 3v4h4M9 13h6M9 17h4",
  code: "M9 8 5 12l4 4M15 8l4 4-4 4",
  chart: "M12 3a9 9 0 1 0 9 9h-9z M14 3.5A9 9 0 0 1 20.5 10H14z",
  upload: "M12 16V4m0 0L8 8m4-4 4 4M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16",
  share: "M17 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM7 15a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm10 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM9.2 11.3l5.6-2.9M9.2 13.2l5.6 2.9",
  settings:
    "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z M19.4 13.5a1.4 1.4 0 0 0 .3 1.5l.1.1a1.7 1.7 0 1 1-2.4 2.4l-.1-.1a1.4 1.4 0 0 0-2.4 1v.3a1.7 1.7 0 1 1-3.4 0v-.2a1.4 1.4 0 0 0-2.4-1l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.4 1.4 0 0 0-1-2.4h-.2a1.7 1.7 0 1 1 0-3.4h.2a1.4 1.4 0 0 0 1-2.4l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.4 1.4 0 0 0 2.4-1v-.2a1.7 1.7 0 1 1 3.4 0v.2a1.4 1.4 0 0 0 2.4 1l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.4 1.4 0 0 0 1 2.4h.2a1.7 1.7 0 1 1 0 3.4h-.2a1.4 1.4 0 0 0-1.3.8z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2-4.3-4.3",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 8v-1a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v1",
  folder:
    "M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.5h9A1.5 1.5 0 0 1 21 10v8.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z",
  plus: "M12 5v14M5 12h14",
  more: "M12 6.5h.01M12 12h.01M12 17.5h.01",
  close: "M6 6l12 12M18 6 6 18",
  download: "M12 4v11m0 0-4-4m4 4 4-4M5 20h14",
  trash: "M4 7h16M10 7V5h4v2m-8 0 1 13h10l1-13",
  link: "M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1",
  check: "M5 12.5 9.5 17 19 7.5",
  chevronDown: "m6 9.5 6 6 6-6",
  external: "M14 4h6v6M20 4l-8.5 8.5M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  video: "M3 7.5A1.5 1.5 0 0 1 4.5 6h9A1.5 1.5 0 0 1 15 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 16.5zM15 10.5 21 7v10l-6-3.5z",
  audio: "M9 18V6l10-2v12M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm10-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  archive: "M3 7h18v3H3zM5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9M10 14h4",
  menu: "M4 7h16M4 12h16M4 17h16",
  sparkle: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z",
  users: "M9 12a3.6 3.6 0 1 0 0-7.2A3.6 3.6 0 0 0 9 12zm-7 8v-.8A4.2 4.2 0 0 1 6.2 15h5.6a4.2 4.2 0 0 1 4.2 4.2V20M16 11.6a3.2 3.2 0 0 0 0-6.2M18.5 15.2A4 4 0 0 1 22 19.2V20",
  lock: "M7 10V7.5a5 5 0 0 1 10 0V10M5.5 10h13a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zm6.5 4.5v2",
  unlock: "M7 10V7.5a5 5 0 0 1 9.6-2M5.5 10h13a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zm6.5 4.5v2",
  camera: "M4 8.5A1.5 1.5 0 0 1 5.5 7h2L9 5h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-9zm8 8.1a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2z",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zm9.5 2.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z",
  eyeOff: "M4 4l16 16M9.9 5.8A8.7 8.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3.3 4M6.5 8.1A15.9 15.9 0 0 0 2.5 12S6 18.5 12 18.5c1 0 2-.2 2.8-.5M9.9 10a2.6 2.6 0 0 0 3.6 3.7",
} as const;

export type IconName = keyof typeof PATHS;

const Icon = ({
  name,
  size = 20,
  className,
  strokeWidth = 1.6,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <path d={PATHS[name]} />
  </svg>
);

export default Icon;
