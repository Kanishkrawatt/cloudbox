import { datatype, themeType } from "@/components/types";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/icons";

/** Face/person groups produced by the smart-group API. */
const ImageGroup = ({
  data,
  title = "People",
  theme,
  loadingState,
  id,
}: {
  data: datatype[];
  loadingState: boolean;
  title?: string;
  theme: themeType;
  id?: string;
}) => {
  const loading = loadingState;

  if (!loading && data.length === 0) {
    return (
      <section className="px-4 py-5 sm:px-6">
        <h2 className="section-label mb-3">{title}</h2>
        <div
          className="flex flex-col items-center gap-2 rounded-xl px-6 py-10 text-center"
          style={{ border: `1px dashed ${theme.border}`, color: theme.muted }}
        >
          <Icon name="user" size={22} />
          <p className="text-[13px]">No groups yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-5 sm:px-6">
      <h2 className="section-label mb-3">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {loading
          ? [1, 2, 3, 4].map((item) => (
              <div key={item} className="skeleton aspect-square rounded-xl" />
            ))
          : data.map((item, index) => (
              <Link
                key={`${item.url}-${index}`}
                href={`/smartgroup/groups?id=${id}&g=${item.group}`}
                className="group relative aspect-square overflow-hidden rounded-xl"
                style={{ border: `1px solid ${theme.border}` }}
              >
                <Image
                  src={item.url}
                  fill
                  sizes="(max-width: 640px) 45vw, 18vw"
                  placeholder="blur"
                  blurDataURL="/image.png"
                  className="object-cover"
                  alt={item.group ?? "group"}
                />
                <span
                  className="absolute inset-x-0 bottom-0 px-2.5 py-1.5 text-[12px]"
                  style={{ backgroundColor: `${theme.primary}d9`, color: theme.text }}
                >
                  {item.group ?? "Person"}
                </span>
              </Link>
            ))}
      </div>
    </section>
  );
};

export default ImageGroup;
