import Link from "next/link";
import Uploader from "@/components/Uploader";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="font-semibold text-lg tracking-tight">StreamGate</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
          Share video, instantly
        </h1>
        <p className="text-gray-400 text-lg max-w-sm mx-auto">
          Drop a video or record your screen — get a shareable link in seconds.
        </p>
      </div>

      {/* Upload zone */}
      <Uploader />

      {/* Divider */}
      <div className="my-8 flex items-center gap-4 w-full max-w-lg">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-gray-600 text-sm">or</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Record button */}
      <Link
        href="/record"
        className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 hover:bg-white/5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
      >
        <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" />
        </svg>
        Record your screen or camera
      </Link>

      <footer className="mt-16 text-sm text-gray-500 flex items-center gap-4">
        <span>
          Powered by{" "}
          <a href="https://fastpix.io" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
            FastPix
          </a>
        </span>
        <span className="text-gray-700">·</span>
        <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
          Terms
        </Link>
      </footer>
    </main>
  );
}
