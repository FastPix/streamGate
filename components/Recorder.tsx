"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import fixWebmDuration from "fix-webm-duration";
// @ts-expect-error FastPix currently ships this SDK without TypeScript declarations.
import { Uploader as FastPixUploader } from "@fastpix/resumable-uploads";

type RecordState =
  | { phase: "idle" }
  | { phase: "recording"; seconds: number; mode: "screen" | "camera" }
  | { phase: "uploading"; progress: number }
  | { phase: "waiting" }
  | { phase: "error"; message: string };

export default function Recorder() {
  const router = useRouter();
  const [state, setState] = useState<RecordState>({ phase: "idle" });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(0);
  const recordingStartRef = useRef<number>(0);

  function startTimer(mode: "screen" | "camera") {
    secondsRef.current = 0;
    setState({ phase: "recording", seconds: 0, mode });
    timerRef.current = setInterval(() => {
      secondsRef.current += 1;
      setState({ phase: "recording", seconds: secondsRef.current, mode });
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    stopTimer();
    setState({ phase: "uploading", progress: 0 });
  }

  async function uploadBlob(blob: Blob) {
    try {
      const res = await fetch("/api/uploads", { method: "POST" });
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadId, url } = await res.json();

      await new Promise<void>((resolve, reject) => {
        const file = new File([blob], "recording.webm", { type: blob.type || "video/webm" });
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
          });
        });

        upload.on("success", () => resolve());

        upload.on("error", (event: Event) => {
          const errorEvent = event as CustomEvent<{ message?: string }>;
          reject(new Error(errorEvent.detail.message || "Upload failed"));
        });
      });

      setState({ phase: "waiting" });
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

  function formatTime(s: number) {
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${m}:${sec}`;
  }

  async function startRecording(mode: "screen" | "camera") {
    try {
      const videoConstraints = {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
      };
      const stream =
        mode === "screen"
          ? await navigator.mediaDevices.getDisplayMedia({
              video: videoConstraints,
              audio: true,
            })
          : await navigator.mediaDevices.getUserMedia({
              video: videoConstraints,
              audio: true,
            });

      chunksRef.current = [];
      const mimeType =
        ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find(
          (t) => MediaRecorder.isTypeSupported(t)
        ) ?? "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        stopTimer();
        const duration = Date.now() - recordingStartRef.current;
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        fixWebmDuration(blob, duration, (fixed: Blob) => {
          uploadBlob(fixed);
        });
      };

      recordingStartRef.current = Date.now();
      recorder.start(1000);
      startTimer(mode);
    } catch (err) {
      const isNotAllowed =
        err instanceof Error &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
      const isNotSupported =
        err instanceof Error &&
        (err.name === "NotSupportedError" || err.name === "TypeError");
      setState({
        phase: "error",
        message: isNotAllowed
          ? 'Access denied. When prompted, click "Allow" — or check your browser\'s camera/microphone permissions and try again.'
          : isNotSupported
            ? "Screen/camera recording isn't supported here. Open the app directly in your browser (not inside an iframe)."
            : "Could not start recording. Try a different browser.",
      });
    }
  }

  if (state.phase === "recording") {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-2xl font-mono text-white tabular-nums">
            {formatTime(state.seconds)}
          </span>
          <span className="text-sm text-gray-400">
            Recording {state.mode === "screen" ? "screen" : "camera"}
          </span>
        </div>
        <button
          onClick={stopRecording}
          className="px-8 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors"
        >
          Stop & Upload
        </button>
      </div>
    );
  }

  if (state.phase === "uploading") {
    return (
      <div className="w-full max-w-sm space-y-4 text-center">
        <p className="text-sm text-gray-400">Uploading recording…</p>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all"
            style={{ width: `${state.progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 text-right">{state.progress}%</p>
      </div>
    );
  }

  if (state.phase === "waiting") {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Upload complete — creating your video…</p>
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="flex flex-col items-center gap-4">
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
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={() => startRecording("screen")}
        className="flex items-center gap-3 px-8 py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Record Screen
      </button>
      <button
        onClick={() => startRecording("camera")}
        className="flex items-center gap-3 px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors border border-white/20"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Record Camera
      </button>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
