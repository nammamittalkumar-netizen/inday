"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, ImagePlus, Loader2, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  /** Cloudinary folder bucket. */
  kind: "avatars" | "posts";
  disabled?: boolean;
  /** Render a circular avatar-style preview instead of a wide banner. */
  variant?: "banner" | "avatar";
  label?: string;
  /** Offer an in-app "Take photo" camera capture button. */
  camera?: boolean;
};

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Image picker that uploads to Cloudinary via /api/upload and reports the URL.
 * With `camera`, it can also open the device camera and snap a photo, which is
 * uploaded through the same path.
 */
export function ImageUpload({
  value,
  onChange,
  kind,
  disabled,
  variant = "banner",
  label = "Add a photo",
  camera = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [uploading, setUploading] = useState(false);
  const [camOpen, setCamOpen] = useState(false);
  const [facing, setFacing] = useState<"environment" | "user">("environment");

  async function handleFile(file: File) {
    if (file.size > MAX_BYTES) {
      toast.error("Image must be 5 MB or smaller");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);
      // Don't set Content-Type — the browser adds the multipart boundary.
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new ApiError(data?.error ?? "Upload failed", res.status);
      }
      onChange(data.url as string);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't upload image");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startCamera(mode: "environment" | "user") {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Camera isn't available on this device/browser");
      return;
    }
    try {
      stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false,
      });
      streamRef.current = stream;
      setFacing(mode);
      setCamOpen(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch {
      toast.error("Couldn't access the camera. Check permissions.");
      setCamOpen(false);
    }
  }

  function closeCamera() {
    stopStream();
    setCamOpen(false);
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error("Couldn't capture the photo");
          return;
        }
        const file = new File([blob], `photo-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        closeCamera();
        handleFile(file);
      },
      "image/jpeg",
      0.9,
    );
  }

  // Make sure the camera is released if the component unmounts while open.
  useEffect(() => stopStream, []);

  const isAvatar = variant === "avatar";
  const busy = disabled || uploading;

  return (
    <div className={cn(isAvatar ? "flex items-center gap-4" : "space-y-2")}>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {value ? (
        isAvatar ? (
          <div className="relative size-20 shrink-0">
            <Image
              src={value}
              alt="Avatar preview"
              fill
              sizes="80px"
              className="rounded-full border border-border object-cover"
            />
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-lg border border-border">
            <Image
              src={value}
              alt="Upload preview"
              width={640}
              height={360}
              className="max-h-72 w-full object-cover"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="absolute right-2 top-2 shadow"
              onClick={() => onChange(null)}
              aria-label="Remove image"
            >
              <X className="size-4" />
            </Button>
          </div>
        )
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImagePlus className="size-4" />
          )}
          {uploading ? "Uploading…" : value ? "Change photo" : label}
        </Button>

        {camera && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => startCamera(facing)}
          >
            <Camera className="size-4" />
            Take photo
          </Button>
        )}

        {isAvatar && value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => onChange(null)}
          >
            Remove
          </Button>
        ) : null}
      </div>

      {/* Camera capture overlay */}
      {camOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Camera"
        >
          <video
            ref={videoRef}
            playsInline
            muted
            className={cn(
              "max-h-[70vh] w-full max-w-lg rounded-xl bg-black object-contain",
              facing === "user" && "-scale-x-100", // mirror the selfie cam
            )}
          />
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={closeCamera}>
              <X className="size-4" />
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Switch camera"
              onClick={() =>
                startCamera(facing === "environment" ? "user" : "environment")
              }
            >
              <RotateCcw className="size-4" />
            </Button>
            <Button type="button" onClick={capturePhoto}>
              <Camera className="size-4" />
              Capture
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
