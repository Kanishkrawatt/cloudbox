import React from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { datatype, themeType } from "@/components/types";
import { onThisDay } from "@/utils/albums";
import { shareThese } from "@/utils/shareHandoff";
import Icon from "@/components/ui/icons";

/** "On this day": same calendar date in earlier years, with a one-tap share. */
const Memories = ({ data, theme }: { data: datatype[]; theme: themeType }) => {
  const router = useRouter();
  const hits = onThisDay(data);
  if (hits.length === 0) return null;

  const years = Array.from(new Set(hits.map((h) => new Date(h.date).getFullYear())));
  const yearsAgo = new Date().getFullYear() - years[0];
  const label =
    years.length === 1
      ? `${yearsAgo} year${yearsAgo === 1 ? "" : "s"} ago today`
      : `On this day in ${years.join(", ")}`;

  return (
    <section className="px-4 py-5 sm:px-6">
      <div
        className="relative overflow-hidden rounded-xl p-4"
        style={{ backgroundColor: theme.secondary, border: `1px solid ${theme.border}` }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.accent, color: theme.primary }}
          >
            <Icon name="sparkle" size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-medium">{label}</p>
            <p className="text-[12px]" style={{ color: theme.muted }}>
              {hits.length} photo{hits.length === 1 ? "" : "s"} from {new Date(hits[0].date).toDateString().slice(4)}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary h-8 text-[12px]"
            onClick={() =>
              shareThese(router, {
                name: `On this day, ${years[0]}`,
                files: hits.map((h) => ({ url: h.url, name: h.name, type: h.type })),
              })
            }
          >
            <Icon name="share" size={14} />
            Share these
          </button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {hits.slice(0, 8).map((item) => (
            <span
              key={item.url}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg"
              style={{ border: `1px solid ${theme.border}` }}
            >
              <Image src={item.url} alt={item.name} fill sizes="80px" className="object-cover" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Memories;
