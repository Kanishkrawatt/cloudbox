import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "@/utils/contexts/theme";
import { useAuth } from "@/utils/contexts/auth";
import { uploadToCloudinary } from "@/utils/cloudinary";
import Icon from "@/components/ui/icons";

/**
 * Webcam capture used by face lock, for both enrolling and unlocking.
 *
 * The frame is uploaded to Cloudinary because the face service reads images by
 * URL. A verification capture is deleted server-side the moment the check is
 * done; the enrolled reference is deleted when face lock is turned off.
 */
const FaceScan = ({
  title,
  action,
  onDone,
  onClose,
}: {
  title: string;
  action: "enroll" | "verify";
  onDone: (result: { ok: boolean; message?: string }) => void;
  onClose: () => void;
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setReady(true);
      })
      .catch((err) =>
        setError(
          err?.name === "NotAllowedError"
            ? "Camera access was blocked. Allow it in your browser to use face lock."
            : "No camera available on this device."
        )
      );
    return () => {
      cancelled = true;
      stop();
    };
  }, [stop]);

  const capture = async () => {
    const video = videoRef.current;
    if (!video) return;
    setBusy(true);
    setError(null);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9)
      );
      if (!blob) throw new Error("Could not read the camera frame.");

      const idToken = await user?.getIdToken();
      if (!idToken) throw new Error("Your session expired. Sign in again.");

      const file = new File([blob], `face-${Date.now()}.jpg`, { type: "image/jpeg" });
      const upload = await uploadToCloudinary({
        file,
        idToken,
        folder: "FaceLock",
        fileName: `face-${action}`,
      });

      const res = await fetch("/api/faceProfile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          action,
          url: upload.url,
          publicId: upload.publicId,
        }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(body.error ?? "Face check failed.");
      if (action === "verify" && !body.match) {
        setError("That face does not match the one on file.");
        setBusy(false);
        return;
      }

      stop();
      onDone({ ok: true });
    } catch (err: any) {
      setError(err?.message ?? "Face check failed.");
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => {
        stop();
        onClose();
      }}
    >
      <div
        className="menu w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
        style={{ color: theme.text }}
      >
        <h3 className="page-title mb-1">{title}</h3>
        <p className="mb-4 text-[13px]" style={{ color: theme.muted }}>
          {action === "enroll"
            ? "Look straight at the camera in good light. This photo is stored only to compare against later scans."
            : "Look straight at the camera to unlock your library."}
        </p>

        <div
          className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-xl"
          style={{ backgroundColor: theme.secondary, border: `1px solid ${theme.border}` }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full scale-x-[-1] object-cover"
          />
          {!ready && !error && (
            <span
              className="absolute inset-0 flex items-center justify-center text-[13px]"
              style={{ color: theme.muted }}
            >
              Starting camera...
            </span>
          )}
        </div>

        {error && (
          <p className="mb-3 text-[13px]" role="alert" style={{ color: "#e5484d" }}>
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="btn h-9 text-[13px]"
            onClick={() => {
              stop();
              onClose();
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary h-9 text-[13px]"
            disabled={!ready || busy}
            onClick={capture}
          >
            <Icon name="camera" size={15} />
            {busy ? "Checking..." : action === "enroll" ? "Use this face" : "Unlock"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FaceScan;
