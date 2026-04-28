"use client";

import { useState } from "react";
import copy from "copy-to-clipboard";

interface CopyLinkProps {
  url: string;
}

export default function CopyLink({ url }: CopyLinkProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    let resolvedUrl = url;

    if (typeof window !== "undefined") {
      const parsedUrl = new URL(url, window.location.origin);
      parsedUrl.protocol = window.location.protocol;
      parsedUrl.host = window.location.host;
      resolvedUrl = parsedUrl.toString();
    }

    copy(resolvedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium text-white transition-colors border border-white/20"
    >
      {copied ? (
        <>
          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy link
        </>
      )}
    </button>
  );
}
