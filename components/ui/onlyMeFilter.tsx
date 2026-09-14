import React, { useCallback, useState } from "react";
import { useTheme } from "@/utils/contexts/theme";
import { useAuth } from "@/utils/contexts/auth";
import { useFaceProfile } from "@/utils/contexts/faceProfile";
import FaceScan from "@/components/ui/faceScan";
import Icon from "@/components/ui/icons";

/**
 * "Photos of me": narrows what is already on screen to the pictures the account
 * owner appears in. A convenience filter, not a lock - nothing is hidden from
 * anyone, it just shows fewer tiles.
 */
export const useOnlyMe = () => {
  const { user } = useAuth();
  const [active, setActive] = useState(false);
  const [photos, setPhotos] = useState<string[] | null>(null);
  const [state, setState] = useState<"idle" | "working" | "error" | "unavailable">("idle");
  const [message, setMessage] = useState("");

  const post = useCallback(
    async (payload: Record<string, unknown>) => {
      const idToken = await user?.getIdToken();
      const res = await fetch("/api/faceFilter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, ...payload }),
      });
      return { status: res.status, body: await res.json().catch(() => ({})) };
    },
    [user]
  );

  const load = useCallback(
    async (refresh = false) => {
      setState("working");
      setMessage("Looking through your photos. The first run can take a minute while the service wakes up.");

      const start = Date.now();
      // Anything past a handful of photos runs as a job on the service, so the
      // result arrives by polling rather than in the first response.
      const poll = async (jobId: string): Promise<boolean> => {
        if (Date.now() - start > 6 * 60 * 1000) {
          setState("error");
          setMessage("That took too long. Try again in a moment.");
          return false;
        }
        await new Promise((r) => setTimeout(r, 5000));
        const { status, body } = await post({ jobId });
        // In-memory jobs vanish when the free instance restarts.
        if (status === 404) {
          setState("error");
          setMessage("The job expired before it finished. Try again.");
          return false;
        }
        if (body?.error) {
          setState("error");
          setMessage(body.error);
          return false;
        }
        if (body.state && body.state !== "done") return poll(jobId);
        setPhotos(body.photos ?? []);
        setState("idle");
        setMessage("");
        return true;
      };

      try {
        const { status, body } = await post({ refresh });
        if (status === 503) {
          setState("unavailable");
          setMessage(body.error ?? "Face features are not configured yet.");
          return false;
        }
        if (status === 202 && body.jobId) {
          setMessage(`Checking ${body.images ?? "your"} photos. This can take a minute.`);
          return poll(body.jobId);
        }
        if (!body || body.error) {
          setState("error");
          setMessage(body?.error ?? "Could not work out which photos you are in.");
          return false;
        }
        setPhotos(body.photos ?? []);
        setState("idle");
        setMessage("");
        return true;
      } catch (err: any) {
        setState("error");
        setMessage(err?.message ?? "Could not work out which photos you are in.");
        return false;
      }
    },
    [post]
  );

  const toggle = useCallback(async () => {
    if (active) {
      setActive(false);
      return;
    }
    if (photos) {
      setActive(true);
      return;
    }
    if (await load()) setActive(true);
  }, [active, photos, load]);

  const filter = useCallback(
    <T extends { url: string }>(items: T[]) =>
      active && photos ? items.filter((item) => photos.includes(item.url)) : items,
    [active, photos]
  );

  return { active, toggle, filter, state, message, photos, reload: () => load(true) };
};

const OnlyMeButton = ({
  active,
  onToggle,
  state,
}: {
  active: boolean;
  onToggle: () => void;
  state: string;
}) => {
  const { theme } = useTheme();
  const { enrolled, available, loading, refresh } = useFaceProfile();
  const [enrolling, setEnrolling] = useState(false);

  if (loading || !available) return null;

  if (!enrolled) {
    return (
      <>
        <button
          type="button"
          className="btn h-9 text-[13px]"
          style={{ color: theme.muted }}
          onClick={() => setEnrolling(true)}
          title="Add a photo of your face to filter your library"
        >
          <Icon name="users" size={15} />
          Photos of me
        </button>
        {enrolling && (
          <FaceScan
            title="Add your face"
            action="enroll"
            onClose={() => setEnrolling(false)}
            onDone={async () => {
              setEnrolling(false);
              await refresh();
            }}
          />
        )}
      </>
    );
  }

  return (
    <button
      type="button"
      className="btn h-9 text-[13px]"
      onClick={onToggle}
      aria-pressed={active}
      style={
        active
          ? { borderColor: theme.accent, color: theme.text }
          : { color: theme.muted }
      }
    >
      <Icon name={active ? "check" : "users"} size={15} />
      {state === "working" ? "Finding..." : "Photos of me"}
    </button>
  );
};

export default OnlyMeButton;
