import { Metadata } from "next";
import Link from "next/link";
import PlayerLoader from "@/components/PlayerLoader";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const title = "Watch on StreamGate";
  const description = "A video shared via StreamGate, powered by FastPix.";
  const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/share/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: shareUrl,
      type: "video.other",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function WatchPage({ params }: Props) {
  const { id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const shareUrl = `${baseUrl}/share/${id}`;

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10">
      {/* Header */}
      <div className="w-full max-w-3xl mb-8 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="font-medium text-white">StreamGate</span>
        </Link>
        <Link
          href="/"
          className="text-sm text-orange-400 hover:text-orange-300 transition-colors font-medium"
        >
          + New video
        </Link>
      </div>

      {/* Player */}
      <div className="w-full max-w-3xl">
        <PlayerLoader mediaId={id} shareUrl={shareUrl} />
      </div>
    </main>
  );
}
