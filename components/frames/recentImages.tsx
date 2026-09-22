import { datatype, themeType } from "@/components/types";
import Image from "next/image";
import { useState } from "react";
import { Actions } from "@/components/actions";
import Icon from "@/components/ui/icons";
import { useSelection } from "@/utils/contexts/selection";

const isVideo = (item: datatype) =>
  item.type?.startsWith("video/") || /\.(mp4|mov|webm|mkv|m4v)$/i.test(item.name ?? item.url ?? "");

const COLUMNS = {
  small: "grid-cols-3 sm:grid-cols-5 lg:grid-cols-8",
  medium: "grid-cols-2 sm:grid-cols-4 lg:grid-cols-6",
  large: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
} as const;

/**
 * Grid of image tiles. Shared by the home, images, folder and smartshare
 * screens, `caption` picks which field sits under the thumbnail.
 */
const RecentImages = ({
  data = [],
  title,
  theme,
  loadingState,
  size = "medium",
  caption = "date",
}: {
  data?: datatype[];
  loadingState: boolean;
  title?: string;
  theme: themeType;
  size?: "small" | "medium" | "large";
  caption?: "date" | "name";
}) => {
  const [menu, setMenu] = useState<number>(-1);
  const selection = useSelection();
  const selecting = selection.items.length > 0;

  const header = title && (
    <div className="mb-3 flex items-baseline gap-2">
      <h2 className="section-label">{title}</h2>
      {!loadingState && data.length > 0 && (
        <span className="text-[11px]" style={{ color: theme.muted }}>
          {data.length}
        </span>
      )}
    </div>
  );

  if (!loadingState && data.length === 0) {
    return (
      <section className="px-4 py-5 sm:px-6">
        {header}
        <div
          className="flex flex-col items-center gap-2 rounded-xl px-6 py-10 text-center"
          style={{ border: `1px dashed ${theme.border}`, color: theme.muted }}
        >
          <Icon name="image" size={22} />
          <p className="text-[13px]">No images here yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-5 sm:px-6">
      {header}
      <div className={`grid gap-3 ${COLUMNS[size]}`}>
        {loadingState
          ? [1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item}>
                <div
                  className="skeleton aspect-square w-full rounded-lg"
                  style={{ border: `1px solid ${theme.border}` }}
                />
                <div className="skeleton mt-2 h-3 w-2/3 rounded" />
              </div>
            ))
          : data.map((item, index) => {
              const selected = selection.has(item.url);
              return (
              <figure key={`${item.url}-${index}`} className="group relative min-w-0">
                <div
                  className="relative aspect-square w-full overflow-hidden rounded-lg transition-[box-shadow,transform]"
                  onClick={selecting ? () => selection.toggle(item) : undefined}
                  style={{
                    border: `1px solid ${selected ? theme.accent : theme.border}`,
                    boxShadow: selected ? `0 0 0 2px ${theme.accent}` : undefined,
                    transform: selected ? "scale(0.96)" : undefined,
                    backgroundColor: theme.secondary,
                    cursor: selecting ? "pointer" : undefined,
                  }}
                >
                  {isVideo(item) ? (
                    <>
                      <video
                        src={item.url}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                      <span
                        className="pointer-events-none absolute bottom-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${theme.primary}d9`, color: theme.text }}
                        aria-hidden="true"
                      >
                        <Icon name="video" size={13} />
                      </span>
                    </>
                  ) : (
                    <Image
                      src={item.url}
                      fill
                      sizes="(max-width: 640px) 45vw, 20vw"
                      placeholder="blur"
                      blurDataURL="/image.png"
                      className="object-cover"
                      alt={item.name ?? ""}
                    />
                  )}
                </div>
                {/* Select checkbox: always shown once a selection exists, hover-revealed otherwise. */}
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  aria-label={selected ? `Deselect ${item.name}` : `Select ${item.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    selection.toggle(item);
                  }}
                  className={`absolute left-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-opacity ${
                    selected || selecting
                      ? "opacity-100"
                      : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                  }`}
                  style={{
                    backgroundColor: selected ? theme.accent : "rgba(0,0,0,0.45)",
                    color: selected ? theme.primary : "#fff",
                  }}
                >
                  <Icon name="check" size={13} strokeWidth={3} className={selected ? "" : "opacity-60"} />
                </button>
                {/* Outside the clipped tile so the dropdown is never cut off;
                    always visible on touch screens, hover-revealed with a mouse. */}
                <div
                  className={`absolute right-2 top-2 transition-opacity ${
                    menu === index
                      ? "opacity-100"
                      : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100"
                  }`}
                >
                  <Actions
                    theme={theme}
                    item={item}
                    index={index}
                    menu={menu}
                    setMenu={setMenu}
                    variant="tile"
                  />
                </div>
                <figcaption className="mt-1.5 min-w-0">
                  <p className="truncate text-[12px]" title={item.name}>
                    {caption === "name" ? item.name : item.date}
                  </p>
                </figcaption>
              </figure>
              );
            })}
      </div>
    </section>
  );
};

export default RecentImages;
