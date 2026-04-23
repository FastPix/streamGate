import Link from "next/link";
import Recorder from "@/components/Recorder";

export default function RecordPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Back link */}
      <div className="mb-12 w-full max-w-lg">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="font-semibold text-lg tracking-tight">StreamGate</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Record a video</h1>
        <p className="text-gray-400">
          Choose screen recording or camera — your video will upload automatically when you stop.
        </p>
      </div>

      <Recorder />
    </main>
  );
}
