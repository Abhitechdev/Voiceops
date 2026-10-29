"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, X } from "lucide-react";

export default function ConsentNotice() {
  const [dismissed, setDismissed] = useState<boolean>(true);

  useEffect(() => {
    const hasConsented = localStorage.getItem("voiceops_consent");
    if (!hasConsented) {
      setDismissed(false);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("voiceops_consent", "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-300 px-4 py-2 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-mono text-[11px] leading-relaxed">
            <strong className="text-zinc-100 font-semibold">VOICE PRIVACY PROTOCOL:</strong> Audio streams are parsed through Gnani AI ASR solely for phonetic transcript extraction. Raw PCM buffers are purged post-inference.
          </span>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleAccept}
            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-[11px] font-mono rounded transition"
          >
            Acknowledge
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-zinc-500 hover:text-zinc-300 p-1"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
