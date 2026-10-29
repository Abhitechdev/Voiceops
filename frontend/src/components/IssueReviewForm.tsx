"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, ArrowLeft, Send, Sparkles, MapPin, Tag, AlertTriangle, Layers, Loader2 } from "lucide-react";
import { api, IssueExtractionResult, Ticket } from "@/lib/api";

interface IssueReviewFormProps {
  originalTranscript?: string;
  reviewedTranscript: string;
  initialExtraction: IssueExtractionResult;
  onBack: () => void;
  onTicketCreated: (ticket: Ticket) => void;
}

export default function IssueReviewForm({
  originalTranscript,
  reviewedTranscript,
  initialExtraction,
  onBack,
  onTicketCreated,
}: IssueReviewFormProps) {
  const [title, setTitle] = useState<string>(initialExtraction.title);
  const [description, setDescription] = useState<string>(initialExtraction.description);
  const [category, setCategory] = useState<string>(initialExtraction.category);
  const [location, setLocation] = useState<string>(initialExtraction.location || "");
  const [priority, setPriority] = useState<string>(initialExtraction.priority);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const hasMissingLocation = !location.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Please ensure title and description are filled out.");
      return;
    }
    if (hasMissingLocation) {
      setError("Please specify the campus location (e.g., Computer Lab 3, Classroom 102) to ensure technicians can dispatch.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const createdTicket = await api.createTicket({
        title: title.trim(),
        description: description.trim(),
        transcript_original: originalTranscript,
        transcript_reviewed: reviewedTranscript.trim(),
        category,
        location: location.trim(),
        priority,
      });

      onTicketCreated(createdTicket);
    } catch (err: any) {
      setError(err.message || "Failed to create ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xl max-w-2xl mx-auto transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            3
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Confirm Ticket Information</h2>
            <p className="text-xs text-slate-500">
              Extracted fields are proposals — verify or adjust before final submission
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>{Math.round(initialExtraction.confidence * 100)}% Match</span>
        </div>
      </div>

      {/* Extraction Reasoning Callout */}
      {initialExtraction.reasoning && (
        <div className="mt-4 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-xs flex items-start space-x-2">
          <Layers className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">AI Extraction Context:</span>
            <span>{initialExtraction.reasoning}</span>
          </div>
        </div>
      )}

      {/* Missing Location Warning Banner */}
      {hasMissingLocation && (
        <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Missing Location Notice:</span>
            <span>No specific room or lab was detected in the voice note. Please specify below.</span>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Issue Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            placeholder="e.g. Internet connectivity failure in Computer Lab 3"
          />
        </div>

        {/* Category & Priority Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Category</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            >
              <option value="Network">Network (Wi-Fi, LAN, Router)</option>
              <option value="Hardware">Hardware (Projector, PC, Display)</option>
              <option value="Electrical">Electrical (Power, Spark, Lighting)</option>
              <option value="Plumbing">Plumbing (Water, Pipes, Washroom)</option>
              <option value="Facility">Facility (Furniture, Doors, Locks)</option>
              <option value="Other">Other Operational Issue</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Priority Level</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            >
              <option value="Low">Low (Minor / Non-blocking)</option>
              <option value="Medium">Medium (Normal Operational)</option>
              <option value="High">High (Class / Lab Interrupted)</option>
              <option value="Critical">Critical (Safety / Campus Hazard)</option>
            </select>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Campus Location</span> <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={`w-full text-sm text-slate-800 bg-white border rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-500 ${
              hasMissingLocation ? "border-amber-400 bg-amber-50/20" : "border-slate-300"
            }`}
            placeholder="e.g., Computer Lab 3, Classroom 2, 2nd Floor CSE Block"
          />
        </div>

        {/* Full Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Detailed Problem Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-sm text-slate-800 bg-white border border-slate-300 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200/80">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Transcript</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm shadow-md shadow-emerald-500/25 transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Ticket...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Confirm & Submit Ticket</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
