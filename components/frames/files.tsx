import { useState } from "react";
import { datatype, themeType } from "@/components/types";
import { Actions } from "../actions";
import Icon, { IconName } from "@/components/ui/icons";
import { useSelection } from "@/utils/contexts/selection";

const FILE_KINDS: { [kind: string]: readonly string[] } = {
  image: ["png", "jpg", "jpeg", "gif", "svg", "webp"],
  video: ["mp4", "mkv", "avi", "mov"],
  audio: ["mp3", "wav", "aac"],
  document: ["doc", "docx", "pdf", "txt", "ppt", "pptx", "xls", "xlsx"],
  code: ["html", "css", "js", "ts", "jsx", "tsx", "py", "java", "c", "cpp", "cs", "php", "rb", "go", "swift", "kt", "dart"],
  archive: ["zip", "rar", "tar", "7z", "gz", "xz"],
};

const KIND_ICON: { [kind: string]: IconName } = {
  image: "image",
  video: "video",
  audio: "audio",
  document: "file",
  code: "code",
  archive: "archive",
  file: "file",
};

export const getFileType = (file: string) => {
  const extension = file?.split(".").pop()?.toLowerCase() ?? "";
  for (const kind in FILE_KINDS) {
    if (FILE_KINDS[kind].includes(extension)) return kind;
  }
  return "file";
};

const formatSize = (bytes?: number) =>
  !bytes
    ? ""
    : bytes >= 1024 ** 2
    ? `${(bytes / 1024 ** 2).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** A date group of files, rendered as rows, names read better in a list. */
const FileFrame = ({
  data = [],
  title,
  theme,
  loadingState,
}: {
  data?: datatype[];
  loadingState: boolean;
  title?: string;
  theme: themeType;
  size?: "small" | "medium" | "large";
}) => {
  const [menu, setMenu] = useState<number>(-1);
  const selection = useSelection();

  const header = (
    <div className="mb-2 flex items-baseline gap-2">
      <h2 className="section-label">{title ?? "Files"}</h2>
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
          <Icon name="file" size={22} />
          <p className="text-[13px]">No files here yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-5 sm:px-6">
      {header}
      <div className="rounded-xl" style={{ border: `1px solid ${theme.border}` }}>
        {loadingState
          ? [1, 2, 3].map((item, index) => (
              <div
                key={item}
                className="flex items-center gap-3 px-3 py-2.5"
                style={{ borderTop: index ? `1px solid ${theme.border}` : undefined }}
              >
                <div className="skeleton h-8 w-8 rounded-lg" />
                <div className="skeleton h-3 w-40 rounded" />
                <div className="skeleton ml-auto h-3 w-16 rounded" />
              </div>
            ))
          : data.map((item, index) => (
              <div
                key={`${item.url}-${index}`}
                className={`group relative flex items-center gap-3 px-3 py-2.5 transition-colors ${
                  index === 0 ? "rounded-t-xl" : ""
                } ${index === data.length - 1 ? "rounded-b-xl" : ""}`}
                style={{ borderTop: index ? `1px solid ${theme.border}` : undefined }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.secondary)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={selection.has(item.url)}
                  aria-label={selection.has(item.url) ? `Deselect ${item.name}` : `Select ${item.name}`}
                  onClick={() => selection.toggle(item)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: selection.has(item.url) ? theme.accent : theme.secondary,
                    color: selection.has(item.url) ? theme.primary : theme.muted,
                  }}
                  title="Select"
                >
                  {selection.has(item.url) ? (
                    <Icon name="check" size={16} strokeWidth={2.5} />
                  ) : (
                    <Icon name={KIND_ICON[getFileType(item.name)]} size={16} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => window.open(item.url, "_blank", "noopener")}
                  className="min-w-0 flex-1 text-left"
                  title={item.name}
                >
                  <span className="block truncate text-[13px]">{item.name}</span>
                </button>

                <span
                  className="hidden shrink-0 text-[12px] sm:block"
                  style={{ color: theme.muted }}
                >
                  {formatSize(item.size)}
                </span>
                <span
                  className="hidden w-32 shrink-0 text-[12px] md:block"
                  style={{ color: theme.muted }}
                >
                  {item.date}
                </span>

                <Actions
                  theme={theme}
                  item={item}
                  index={index}
                  menu={menu}
                  setMenu={setMenu}
                />
              </div>
            ))}
      </div>
    </section>
  );
};

export default FileFrame;
