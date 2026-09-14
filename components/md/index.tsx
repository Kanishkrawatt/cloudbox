import React from "react";
import Image from "next/image";

/** Markdown renderers for the API docs page, theme-aware, tight type scale. */
export const Heading = {
  H1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="pb-3 pt-1 text-[1.5rem] font-semibold tracking-tight">{children}</h1>
  ),
  H2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="pb-2 pt-8 text-[1.0625rem] font-semibold tracking-tight">{children}</h2>
  ),
  H3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="pb-1 pt-6 text-[14px] font-medium">{children}</h3>
  ),
};

export const Text = ({ children }: { children: React.ReactNode }) => (
  <p className="py-1.5 text-[14px] leading-7">{children}</p>
);

export const List = ({ children }: { children: React.ReactNode }) => (
  <ul className="list-disc space-y-1 py-1.5 pl-5 text-[14px] leading-7">{children}</ul>
);

export const Pre = ({ children }: { children: React.ReactNode }) => (
  <pre
    className="my-3 overflow-x-auto rounded-lg p-3 text-[12.5px] leading-6"
    style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
  >
    {children}
  </pre>
);

export const Code = ({ children }: { children: React.ReactNode }) => (
  <code
    className="rounded px-1.5 py-0.5 text-[12.5px]"
    style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
  >
    {children}
  </code>
);

export const ResponsiveImage = ({ src, alt }: { src: string; alt: string }) => (
  <span className="relative block aspect-video w-full">
    <Image src={src} alt={alt} fill className="rounded-lg object-cover" />
  </span>
);

export const components = {
  img: ResponsiveImage,
  h1: Heading.H1,
  h2: Heading.H2,
  h3: Heading.H3,
  p: Text,
  ul: List,
  pre: Pre,
  code: Code,
};
