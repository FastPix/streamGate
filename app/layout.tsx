import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StreamGate — Share Videos Instantly",
  description:
    "Upload or record a video and get a shareable link instantly, powered by FastPix.",
  openGraph: {
    title: "StreamGate",
    description: "Upload or record a video and share it instantly.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#0a0a0a] text-white">{children}</body>
    </html>
  );
}
