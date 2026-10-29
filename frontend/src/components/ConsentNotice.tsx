"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Info, X } from "lucide-react";

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
    <div className="bg-indigo-50/90 border-b border-indigo-100 text-xs text-indigo-900 px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span>
            <strong>Voice Privacy Notice:</strong> Audio recorded is processed strictly for speech-to-text transcription (via Gnani AI). Raw audio is discarded after transcription and not shared or permanently stored.
          </span>
        </div>
        <div className="flex items-center space-x-3 ml-4">
          <button
            onClick={handleAccept}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-xs transition"
          >
            I Understand
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-indigo-400 hover:text-indigo-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
