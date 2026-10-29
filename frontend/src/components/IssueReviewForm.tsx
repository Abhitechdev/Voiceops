"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Send,
  Sparkles,
  MapPin,
  Tag,
  AlertTriangle,
  Layers,
  Loader2,
  ShieldAlert,
} from "lucide-react";
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

  const campusPresets = [
    "Computer Lab 3",
    "ECE Block Room 204",
    "Main Auditorium",
    "Central Library 2F",
    "Hostel Block C",
    "Faculty Wing B",
  ];

  const categories = [
    "Network",
    "Hardware",
    "Facilities",
    "Electrical",
    "Software",
    "Other",
  ];

  const priorities = [
    { id: "Critical", label: "Critical (SLA 4h)", color: "text-rose-400 border-rose-800 bg-rose-950/40" },
    { id: "High", label: "High (SLA 24h)", color: "text-amber-400 border-amber-800 bg-amber-950/40" },
    { id: "Medium", label: "Medium (SLA 48h)", color: "text-sky-400 border-sky-800 bg-sky-950/40" },
    { id: "Low", label: "Low (SLA 72h)", color: "text-zinc-400 border-zinc-800 bg-zinc-950" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Please ensure title and description fields are populated.");
      return;
    }
    if (hasMissingLocation) {
      setError("Location is mandatory to dispatch campus technicians. Choose or type a location.");
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
      setError(err.message || "Failed to commit ticket to database. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="studio-panel-elevated rounded-2xl p-6 sm:p-8 border border-zinc-800 shadow-2xl max-w-2xl mx-auto transition-all">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs">
            03
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 font-mono tracking-tight uppercase">
              Operational Triage Confirmation
            </h2>
            <p className="text-xs text-zinc-400">
              Verify machine-extracted entities before technicians receive dispatch
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 text-[11px] font-mono text-zinc-300">
          <span className="text-zinc-500">NLP MATCH:</span>
          <span className="text-emerald-400 font-bold">
            {Math.round(initialExtraction.confidence * 100)}% CONF
          </span>
        </div>
      </div>

      {/* AI Extraction Context Banner */}
      {initialExtraction.reasoning && (
        <div className="mt-4 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-400 flex items-start space-x-2.5">
          <Layers className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-zinc-200 font-bold block mb-0.5">ACOUSTIC NLP PARSING CONTEXT:</span>
            <span>{initialExtraction.reasoning}</span>
          </div>
        </div>
      )}

      {/* Missing Location Alert */}
      {hasMissingLocation && (
        <div className="mt-3 p-3 rounded-xl bg-amber-950/30 border border-amber-800/60 text-amber-300 text-xs font-mono flex items-start space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">LOCATION UNRESOLVED:</span>
            <span>No explicit building or room was detected in the speech buffer. Select a campus node below.</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-mono font-semibold text-zinc-300 uppercase mb-1.5">
            Work Order Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-sm font-semibold text-zinc-100 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-600"
            placeholder="e.g. Internet connectivity failure in Computer Lab 3"
          />
        </div>

        {/* Category & Location Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono font-semibold text-zinc-300 uppercase mb-1.5 flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5 text-zinc-500" />
              <span>Operational Domain</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs font-mono text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-zinc-300 uppercase mb-1.5 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Campus Location <span className="text-rose-400">*</span></span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Computer Lab 3, 2nd Floor"
              className="w-full text-xs font-mono text-zinc-100 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        {/* Location Quick Presets */}
        <div>
          <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1.5">
            Quick Campus Node Selector:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {campusPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setLocation(preset)}
                className={`text-[11px] font-mono px-2 py-1 rounded-lg border transition ${
                  location === preset
                    ? "bg-zinc-800 text-emerald-400 border-zinc-700 font-bold"
                    : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Segmented Radios */}
        <div>
          <label className="block text-xs font-mono font-semibold text-zinc-300 uppercase mb-1.5">
            Triage Severity (SLA Target)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {priorities.map((pri) => (
              <button
                key={pri.id}
                type="button"
                onClick={() => setPriority(pri.id)}
                className={`p-2.5 rounded-xl border text-xs font-mono text-center transition-all ${
                  priority === pri.id
                    ? pri.color + " font-bold shadow-sm"
                    : "bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700"
                }`}
              >
                <div className="font-bold">{pri.id}</div>
                <div className="text-[10px] opacity-75 mt-0.5">
                  {pri.id === "Critical" ? "4h SLA" : pri.id === "High" ? "24h SLA" : pri.id === "Medium" ? "48h SLA" : "72h SLA"}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Operational Description */}
        <div>
          <label className="block text-xs font-mono font-semibold text-zinc-300 uppercase mb-1.5">
            Technical Problem Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs font-sans text-zinc-200 bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 leading-relaxed"
          />
        </div>

        {/* Error Callout */}
        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs font-mono flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 text-xs font-mono transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Transcript</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs font-mono uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Committing Ticket...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Work Order</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
