import React from "react";
import { useAuth } from "../../utils/contexts/auth";
import { useTheme } from "../../utils/contexts/theme";
import axios from "axios";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

type StorageInfo = { free: number; used: number; total: number };

/** 1024 MB = 1 GB, show the larger unit only once we actually cross it. */
const formatSize = (mb?: number) =>
  mb === undefined
    ? { value: "0", unit: "" }
    : mb >= 1024
    ? { value: (mb / 1024).toFixed(2), unit: "GB" }
    : { value: mb.toFixed(1), unit: "MB" };

const Stat = ({ label, mb, tint }: { label: string; mb?: number; tint?: string }) => {
  const { theme } = useTheme();
  const { value, unit } = formatSize(mb);
  return (
    <div
      className="flex-1 rounded-xl px-4 py-3.5"
      style={{ border: `1px solid ${theme.border}` }}
    >
      <div className="flex items-center gap-2">
        {tint && (
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: tint }}
            aria-hidden="true"
          />
        )}
        <span className="text-[12px]" style={{ color: theme.muted }}>
          {label}
        </span>
      </div>
      <p className="mt-1.5 text-[1.5rem] font-semibold leading-none tracking-tight">
        {value}
        <span className="ml-1 text-[12px] font-normal" style={{ color: theme.muted }}>
          {unit}
        </span>
      </p>
    </div>
  );
};

function Storage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [data, setData] = React.useState<StorageInfo | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user) return;
    axios
      .post("/api/storageInfo", { uid: user.uid })
      .then((api) => setData(api.data))
      .catch((e) => setError(e.message));
  }, [user]);

  const usedPct =
    data && data.total > 0 ? Math.min(100, (data.used / data.total) * 100) : 0;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-5">
      {error && (
        <p
          className="rounded-lg px-3 py-2 text-[13px]"
          style={{ backgroundColor: theme.secondary, color: "#e5484d" }}
        >
          Could not load storage info: {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Stat label="Used" mb={data?.used} tint={theme.accent} />
        <Stat label="Free" mb={data?.free} tint={theme.border} />
        <Stat label="Total" mb={data?.total} />
      </div>

      <div className="rounded-xl px-4 py-4" style={{ border: `1px solid ${theme.border}` }}>
        <div className="mb-2 flex justify-between text-[12px]" style={{ color: theme.muted }}>
          <span>{usedPct.toFixed(1)}% of quota used</span>
          <span>
            {formatSize(data?.free).value} {formatSize(data?.free).unit} left
          </span>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: theme.border }}
        >
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${usedPct}%`, backgroundColor: theme.accent }}
          />
        </div>
      </div>

      {data && (
        <div
          className="flex items-center justify-center rounded-xl px-4 py-6"
          style={{ border: `1px solid ${theme.border}` }}
        >
          <div className="h-56 w-full max-w-xs">
            <Doughnut
              data={{
                labels: ["Used", "Free"],
                datasets: [
                  {
                    label: "Storage (MB)",
                    data: [data.used, data.free],
                    backgroundColor: [theme.accent, theme.border],
                    borderColor: theme.primary,
                    borderWidth: 2,
                  },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                cutout: "68%",
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: { color: theme.muted, boxWidth: 10, font: { size: 12 } },
                  },
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Storage;
