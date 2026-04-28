import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use — StreamGate",
  description: "StreamGate terms of use, content policy, and media retention policy.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen px-6 py-16 max-w-xl mx-auto">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-12"
      >
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <span className="font-medium text-white">StreamGate</span>
      </Link>

      {/* Title */}
      <h1 className="text-2xl font-bold tracking-tight mb-1">Terms of Use</h1>
      <p className="text-gray-600 text-sm mb-10">Effective April 24, 2026</p>

      <p className="text-gray-400 text-base leading-relaxed mb-10">
        By uploading or sharing a video through StreamGate, you agree to the following terms.
      </p>

      <div className="space-y-10">

        {/* Media Retention */}
        <section>
          <h2 className="text-base font-semibold text-white mb-3">Media Retention</h2>
          <div className="px-4 py-3 rounded-xl border border-orange-500/20 bg-orange-500/5 text-orange-200 text-base leading-relaxed">
            Videos are stored and streamed for <strong className="text-white">15 days</strong> from upload, then permanently deleted — no exceptions, no recovery.
          </div>
        </section>

        {/* Content Policy */}
        <section>
          <h2 className="text-base font-semibold text-white mb-3">Content Policy</h2>
          <p className="text-gray-400 text-base leading-relaxed mb-3">
            StreamGate is intended for legitimate video sharing — screencasts, demos, presentations, and personal recordings.
            The following content is strictly prohibited:
          </p>
          <ul className="space-y-2 text-gray-500 text-base">
            {[
              "Hateful, discriminatory, or harassing content",
              "Pornographic or sexually explicit material",
              "Graphic violence or gore",
              "Content that infringes on copyright or intellectual property",
              "Content that violates any applicable law or regulation",
              "Spam or deceptive material",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-orange-500 shrink-0">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-gray-500 text-base leading-relaxed mt-3">
            We reserve the right to remove any content that violates this policy, at any time and without notice.
          </p>
        </section>

        {/* Your Content */}
        <section>
          <h2 className="text-base font-semibold text-white mb-3">Your Content</h2>
          <p className="text-gray-400 text-base leading-relaxed">
            You retain full ownership of any video you upload. By uploading, you grant StreamGate a limited,
            non-exclusive license to store and deliver your video via your shareable link. We do not use your
            content for any other purpose.
          </p>
        </section>

      </div>

      {/* Footer */}
      <div className="mt-14 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-gray-700">
        <span>© {new Date().getFullYear()} StreamGate</span>
        <a
          href="https://github.com/FastPix/streamgate/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-500 transition-colors"
        >
          Report an issue
        </a>
      </div>
    </main>
  );
}
