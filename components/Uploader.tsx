"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
// @ts-expect-error FastPix currently ships this SDK without TypeScript declarations.
import { Uploader as FastPixUploader } from "@fastpix/resumable-uploads";

type UploadState =
  | { phase: "idle" }
  | { phase: "uploading"; progress: number; fileName: string }
  | { phase: "waiting"; fileName: string }
  | { phase: "error"; message: string };

export default function Uploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({ phase: "idle" });
  const [dragging, setDragging] = useState(false);

  async function uploadFile(file: File) {
    setState({ phase: "uploading", progress: 0, fileName: file.name });

    try {
      const res = await fetch("/api/uploads", { method: "POST" });
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadId, url } = await res.json();

      await new Promise<void>((resolve, reject) => {
        const upload = FastPixUploader.init({
          endpoint: url,
          file,
          retryChunkAttempt: 5,
          delayRetry: 1,
        });

        upload.on("progress", (event: Event) => {
          const progressEvent = event as CustomEvent<{ progress?: number }>;
          setState({
            phase: "uploading",
            progress: Math.round(progressEvent.detail.progress ?? 0),
            fileName: file.name,
          });
        });

        upload.on("success", () => resolve());

        upload.on("error", (event: Event) => {
          const errorEvent = event as CustomEvent<{ message?: string }>;
          reject(new Error(errorEvent.detail.message || "Upload failed"));
        });
      });

      setState({ phase: "waiting", fileName: file.name });
      await pollForMedia(uploadId);
    } catch (err) {
      setState({
        phase: "error",
        message: err instanceof Error ? err.message : "Upload failed",
      });
    }
  }

  async function pollForMedia(uploadId: string) {
    for (let i = 0; i < 60; i++) {
      await delay(2000);
      const res = await fetch(`/api/uploads/${uploadId}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.mediaId && data.status !== "waiting") {
        router.push(`/share/${data.mediaId}`);
        return;
      }
    }
    setState({ phase: "error", message: "Timed out waiting for video to process" });
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("video/")) {
      setState({ phase: "error", message: "Please select a video file" });
      return;
    }
    uploadFile(file);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.phase === "uploading") {
    return (
      <div className="w-full max-w-lg space-y-4">
        <p className="text-sm text-gray-400 truncate">Uploading {state.fileName}…</p>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${state.progress}%` }}
          />
        </div>
        <p className="text-right text-xs text-gray-500">{state.progress}%</p>
      </div>
    );
  }

  if (state.phase === "waiting") {
    return (
      <div className="w-full max-w-lg space-y-3 text-center">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm text-gray-400">Upload complete — creating your video…</p>
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="w-full max-w-lg space-y-4 text-center">
        <p className="text-red-400 text-sm">{state.message}</p>
        <button
          onClick={() => setState({ phase: "idle" })}
          className="text-sm text-orange-400 hover:text-orange-300 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // idle
  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onClick={() => inputRef.current?.click()}
      className={`
        w-full max-w-lg border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer
        transition-all duration-200 select-none
        ${dragging
          ? "border-orange-400 bg-orange-500/10"
          : "border-white/20 hover:border-white/40 hover:bg-white/5"
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex flex-col items-center gap-4 pointer-events-none">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div>
          <p className="text-white font-medium">Drop a video here</p>
          <p className="text-sm text-gray-500 mt-1">or click to browse</p>
        </div>
        <p className="text-xs text-gray-600">MP4, MOV, WebM, AVI and more</p>
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
