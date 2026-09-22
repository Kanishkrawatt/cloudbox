import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/utils/contexts/auth";

type FaceProfileState = {
  enrolled: boolean;
  available: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
};

const FaceProfileContext = createContext<FaceProfileState>({
  enrolled: false,
  available: false,
  loading: true,
  refresh: async () => {},
});

export const useFaceProfile = () => useContext(FaceProfileContext);

export const FaceProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [enrolled, setEnrolled] = useState(false);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setEnrolled(false);
      setLoading(false);
      return;
    }
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/faceProfile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, action: "status" }),
      });
      const body = await res.json().catch(() => ({}));
      setEnrolled(Boolean(body.enrolled));
      setAvailable(Boolean(body.available));
    } catch {
      setEnrolled(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ enrolled, available, loading, refresh }),
    [enrolled, available, loading, refresh]
  );

  return <FaceProfileContext.Provider value={value}>{children}</FaceProfileContext.Provider>;
};

export default FaceProfileProvider;
