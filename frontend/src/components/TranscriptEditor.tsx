"use client";

import React, { useState } from "react";
import { Edit3, CheckCircle, ArrowRight, RotateCcw, Sparkles, Loader2, Bot, AlertTriangle } from "lucide-react";
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

  const handleExtract = async () => {
    if (!reviewedText.trim()) {
      setError("Transcript cannot be empty. Please enter or review the complaint text.");
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
      setError(err.message || "Failed to extract structured issue. Please try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xl max-w-2xl mx-auto transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
            2
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Review & Correct Transcript</h2>
            <p className="text-xs text-slate-500">
              Check for speech recognition errors before extracting fields
            </p>
          </div>
        </div>

        {/* AI Provider Tag */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-600">
          <Bot className="w-3.5 h-3.5 text-indigo-500" />
          <span>{provider === "gnani_ai" ? "Gnani AI STT" : "Gnani Mock Adapter"}</span>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-600">{Math.round(confidence * 100)}% conf</span>
        </div>
      </div>

      {/* Editable Area */}
      <div className="my-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Spoken Complaint Transcript (Editable)</span>
          </label>
          {isModified && (
            <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Edited by user
            </span>
          )}
        </div>

        <textarea
          rows={4}
          value={reviewedText}
          onChange={(e) => setReviewedText(e.target.value)}
          className="w-full text-sm text-slate-800 bg-white border border-slate-300 rounded-xl p-4 shadow-inner focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
          placeholder="Speech transcript will appear here. Edit if words were misrecognized..."
        />

        {/* Original versus Reviewed reference if changed */}
        {isModified && (
          <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
            <span className="font-semibold text-slate-600 block mb-1">Original raw speech transcript:</span>
            <span className="italic">"{originalTranscript}"</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200/80">
        <button
          onClick={onReset}
          disabled={isExtracting}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Re-record Voice</span>
        </button>

        <button
          onClick={handleExtract}
          disabled={isExtracting}
          className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md shadow-brand-500/25 transition disabled:opacity-50"
        >
          {isExtracting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing Issue Fields...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Extract Structured Issue</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
