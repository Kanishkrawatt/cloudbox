import React from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import Layout from "@/components/layouts/baseLayout";
import { useAuth } from "../utils/contexts/auth";
import { useTheme } from "../utils/contexts/theme";
import ThemePicker from "@/components/ui/themePicker";
import Icon from "@/components/ui/icons";
import FaceScan from "@/components/ui/faceScan";
import { useFaceProfile } from "@/utils/contexts/faceProfile";

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => {
  const { theme } = useTheme();
  return (
    <section className="border-t py-7" style={{ borderColor: theme.border }}>
      <h2 className="text-[14px] font-medium">{title}</h2>
      {description && (
        <p className="mt-1 text-[13px]" style={{ color: theme.muted }}>
          {description}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
};

function Profile() {
  const { user, UpdateUserDetails, signOut } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const { enrolled: faceEnrolled, available: faceAvailable, refresh: refreshFace } = useFaceProfile();
  const [enrolling, setEnrolling] = React.useState(false);
  const [lockError, setLockError] = React.useState<string | null>(null);
  const [copyState, setCopyState] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [userDetails, setUserDetails] = React.useState({
    name: "",
    email: "",
    photoUrl: "",
  });

  React.useEffect(() => {
    setUserDetails({
      name: user?.displayName ?? "",
      email: user?.email ?? "",
      photoUrl: user?.photoURL ?? "",
    });
  }, [user]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userDetails.name.trim()) return;
    UpdateUserDetails(userDetails.name.trim(), userDetails.photoUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(user?.uid ?? "");
    setCopyState(true);
    setTimeout(() => setCopyState(false), 2500);
  };

  const removeFace = async () => {
    setLockError(null);
    const idToken = await user?.getIdToken();
    const res = await fetch("/api/faceProfile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, action: "remove" }),
    });
    if (!res.ok) {
      setLockError((await res.json().catch(() => ({})))?.error ?? "Could not remove your face photo.");
      return;
    }
    await refreshFace();
  };

  const logout = async () => {
    await signOut();
    router.replace("/");
  };

  return (
    <Layout title="Profile">
      <div className="mx-auto w-full max-w-2xl px-4 pb-16 sm:px-6">
        <div className="flex items-center gap-4 py-7">
          <span
            className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full"
            style={{ backgroundColor: theme.secondary, border: `1px solid ${theme.border}`, color: theme.muted }}
          >
            {user?.photoURL ? (
              <Image src={user.photoURL} alt="" fill sizes="56px" className="object-cover" />
            ) : (
              <Icon name="user" size={22} />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-medium">
              {user?.displayName ?? "Unnamed account"}
            </p>
            <p className="truncate text-[13px]" style={{ color: theme.muted }}>
              {user?.email}
            </p>
          </div>
        </div>

        <Section title="Account" description="Your display name is shown on shared links.">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-[13px]">
                Display name
              </label>
              <input
                id="name"
                type="text"
                className="field h-10 max-w-sm text-[13px]"
                style={{ backgroundColor: theme.secondary, borderColor: theme.border }}
                placeholder="Your name"
                value={userDetails.name}
                onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-[13px]">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="field h-10 max-w-sm text-[13px]"
                style={{ backgroundColor: theme.secondary, borderColor: theme.border }}
                value={userDetails.email}
                disabled
                readOnly
              />
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" className="btn btn-primary h-9 text-[13px]">
                Save changes
              </button>
              {saved && (
                <span className="text-[13px]" style={{ color: theme.muted }}>
                  Saved
                </span>
              )}
            </div>
          </form>
        </Section>

        <Section
          title="API token"
          description="Send this as a bearer token to reach your files over the API."
        >
          <div className="flex max-w-lg items-center gap-2">
            <input
              type="text"
              value={user?.uid ?? ""}
              readOnly
              onFocus={(e) => e.target.select()}
              className="field h-9 font-mono text-[12px]"
              style={{ backgroundColor: theme.secondary, borderColor: theme.border }}
            />
            <button type="button" className="btn h-9 shrink-0 text-[13px]" onClick={handleCopy}>
              <Icon name={copyState ? "check" : "link"} size={15} />
              {copyState ? "Copied" : "Copy"}
            </button>
          </div>
        </Section>

        <Section title="Appearance" description="Applies to every screen, remembered on this device.">
          <ThemePicker />
        </Section>

        <Section
          title="Your face"
          description="Used to filter your library to the photos you appear in."
        >
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={faceEnrolled ? "btn h-9 text-[13px]" : "btn btn-primary h-9 text-[13px]"}
              onClick={() => (faceEnrolled ? removeFace() : setEnrolling(true))}
            >
              <Icon name={faceEnrolled ? "trash" : "camera"} size={15} />
              {faceEnrolled ? "Remove my face photo" : "Add my face"}
            </button>
            {faceEnrolled && (
              <span className="text-[13px]" style={{ color: theme.muted }}>
                Added. Use the Photos of me filter on the Images page.
              </span>
            )}
            {!faceAvailable && (
              <span className="text-[13px]" style={{ color: theme.muted }}>
                Needs the face service configured (FACE_API_KEY).
              </span>
            )}
          </div>

          {lockError && (
            <p className="mt-2 text-[13px]" style={{ color: "#e5484d" }}>
              {lockError}
            </p>
          )}

          <p className="mt-3 max-w-lg text-[12px]" style={{ color: theme.muted }}>
            This is a filter, not a security feature. Face matching cannot tell a
            person from a photograph of them, so it is never used to gate access
            to anything. Your reference photo is kept only to compare against
            your library, and you can remove it at any time.
          </p>

          {enrolling && (
            <FaceScan
              title="Add your face"
              action="enroll"
              onClose={() => setEnrolling(false)}
              onDone={async () => {
                setEnrolling(false);
                await refreshFace();
              }}
            />
          )}
        </Section>

        <Section title="Session">
          <button type="button" onClick={logout} className="btn h-9 text-[13px]">
            Sign out
          </button>
        </Section>
      </div>
    </Layout>
  );
}

export default Profile;
