"use client";

import React, { useState } from "react";
import {
  Edit3,
  CheckCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Loader2,
  FileText,
} from "lucide-react";
import { api, IssueExtractionResult } from "@/lib/api";
import { useToast } from "@/components/Toast";

interface TranscriptEditorProps {
  originalTranscript: string;
  language: string;
  provider: string;
  confidence: number;
  onReset: () => void;
  onExtractionComplete: (data: {
    originalTranscript: string;
    reviewedTranscript: string;
    extraction: IssueExtractionResult;
  }) => void;
}

export default function TranscriptEditor({
  originalTranscript,
  language,
  provider,
  confidence,
  onReset,
  onExtractionComplete,
}: TranscriptEditorProps) {
  const { toast, success, error: toastError } = useToast();
  const [reviewedText, setReviewedText] = useState<string>(originalTranscript);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isModified = reviewedText.trim() !== originalTranscript.trim();
  const wordCount = reviewedText.trim() ? reviewedText.trim().split(/\s+/).length : 0;

  const handleExtract = async () => {
    if (!reviewedText.trim()) {
      setError("Transcript cannot be empty. Please verify or type the spoken issue text.");
      return;
    }
    setIsExtracting(true);
    setError(null);

    try {
      const extraction = await api.extractIssue(reviewedText, language);
      success("Ticket details extracted! Please review below.");
      onExtractionComplete({
        originalTranscript,
        reviewedTranscript: reviewedText,
        extraction,
      });
    } catch (err: any) {
      const msg = err.message || "Failed to analyze speech. Please try again.";
      setError(msg);
      toastError(msg);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="bg-zinc-900/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-zinc-800 shadow-2xl max-w-2xl mx-auto transition-all space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
            02
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Review What Was Heard
            </h2>
            <p className="text-xs text-zinc-400">
              Check and edit the transcribed speech before generating ticket details
            </p>
          </div>
        </div>

        {/* Confidence Badge */}
        <div className="flex items-center space-x-2 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs text-zinc-300">
          <span className="text-zinc-500">Recognition:</span>
          <span className="text-emerald-400 font-semibold">{Math.round(confidence * 100)}% Match</span>
        </div>
      </div>

      {/* Editor Surface */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-300 flex items-center space-x-1.5">
            <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Spoken Transcript (Editable)</span>
          </label>
          <div className="text-[11px] text-zinc-400 space-x-2">
            <span>{wordCount} words</span>
            {isModified && (
              <span className="text-amber-400 font-medium">• Edited</span>
            )}
          </div>
        </div>

        <textarea
          rows={4}
          value={reviewedText}
          onChange={(e) => setReviewedText(e.target.value)}
          placeholder="Verify or correct the spoken report..."
          className="w-full bg-zinc-950 text-zinc-100 border border-zinc-800 focus:border-emerald-500 rounded-2xl p-4 text-sm leading-relaxed focus:outline-hidden transition"
        />

        <p className="text-[11px] text-zinc-400 italic">
          Tip: You can edit or add room numbers, floor names, or equipment names directly above.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        <button
          type="button"
          onClick={onReset}
          disabled={isExtracting}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-xs transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Record Again</span>
        </button>

        <button
          type="button"
          onClick={handleExtract}
          disabled={isExtracting || !reviewedText.trim()}
          className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-[0.98] disabled:opacity-50"
        >
          {isExtracting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-950" />
              <span>Analyzing Issue...</span>
            </>
          ) : (
            <>
              <span>Confirm & Continue</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-950" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
