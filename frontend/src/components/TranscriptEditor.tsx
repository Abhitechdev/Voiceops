"use client";

import React, { useState } from "react";
import {
  Edit3,
  CheckCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Loader2,
  Bot,
  AlertTriangle,
  FileText,
  Percent,
} from "lucide-react";
import { api, IssueExtractionResult } from "@/lib/api";

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
  const [reviewedText, setReviewedText] = useState<string>(originalTranscript);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isModified = reviewedText.trim() !== originalTranscript.trim();
  const wordCount = reviewedText.trim() ? reviewedText.trim().split(/\s+/).length : 0;

  const handleExtract = async () => {
    if (!reviewedText.trim()) {
      setError("Transcript cannot be empty. Please verify or input the spoken issue text.");
      return;
    }
    setIsExtracting(true);
    setError(null);

    try {
      const extraction = await api.extractIssue(reviewedText, language);
      onExtractionComplete({
        originalTranscript,
        reviewedTranscript: reviewedText,
        extraction,
      });
    } catch (err: any) {
      setError(err.message || "Failed to parse ticket fields. Please try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="studio-panel-elevated rounded-2xl p-6 sm:p-8 border border-zinc-800 shadow-2xl max-w-2xl mx-auto transition-all">
      {/* Studio Inspection Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs">
            02
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 font-mono tracking-tight uppercase">
              Acoustic Inspection & Review
            </h2>
            <p className="text-xs text-zinc-400">
              Human-in-the-loop verification before automated classification
            </p>
          </div>
        </div>

        {/* Confidence & Engine Telemetry Badge */}
        <div className="flex items-center space-x-2 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 text-[11px] font-mono text-zinc-300">
          <span className="text-zinc-500">ASR:</span>
          <span>{provider === "gnani_ai" ? "Gnani Live" : "Gnani Indic"}</span>
          <span className="text-zinc-700">|</span>
          <span className="text-emerald-400 font-bold">{Math.round(confidence * 100)}% CONF</span>
        </div>
      </div>

      {/* Editor Surface */}
      <div className="my-6 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono font-semibold text-zinc-300 flex items-center space-x-1.5 uppercase">
            <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Phonetic Transcript Buffer</span>
          </label>
          <div className="flex items-center space-x-2 text-[10px] font-mono text-zinc-500">
            <span>{wordCount} words</span>
            {isModified && (
              <span className="text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/60 font-semibold">
                USER_EDITED
              </span>
            )}
          </div>
        </div>

        <textarea
          rows={4}
          value={reviewedText}
          onChange={(e) => setReviewedText(e.target.value)}
          className="w-full text-sm font-sans text-zinc-100 bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-inner focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600 leading-relaxed"
          placeholder="Speech transcript will appear here. Edit if words or Telugu terms were misrecognized..."
        />

        {/* Diff Inspection Strip */}
        {isModified && (
          <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 text-xs font-mono space-y-1">
            <span className="text-[10px] text-zinc-500 block uppercase">
              Raw Phonetic Capture:
            </span>
            <span className="text-zinc-400 italic">"{originalTranscript}"</span>
          </div>
        )}
      </div>

      {/* Error Callout */}
      {error && (
        <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs font-mono flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        <button
          onClick={onReset}
          disabled={isExtracting}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 text-xs font-mono transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Re-record</span>
        </button>

        <button
          onClick={handleExtract}
          disabled={isExtracting}
          className="flex items-center space-x-2 px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs font-mono uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition active:scale-[0.98] disabled:opacity-50"
        >
          {isExtracting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Fields...</span>
            </>
          ) : (
            <>
              <span>Extract Structured Issue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
