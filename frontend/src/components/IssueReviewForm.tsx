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
  Loader2,
} from "lucide-react";
import { api, IssueExtractionResult, Ticket } from "@/lib/api";
import { useToast } from "@/components/Toast";

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
  const { toast, success, error: toastError } = useToast();
  const [title, setTitle] = useState<string>(initialExtraction.title);
  const [description, setDescription] = useState<string>(initialExtraction.description);
  const [category, setCategory] = useState<string>(initialExtraction.category);
  const [location, setLocation] = useState<string>(initialExtraction.location || "");
  const [priority, setPriority] = useState<string>(initialExtraction.priority);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const campusPresets = [
    "Classroom Two",
    "Computer Lab 3",
    "ECE Block Room 204",
    "Seminar Hall A",
    "Central Library 2F",
    "Hostel Block C",
  ];

  const categories = [
    "Hardware",
    "Network",
    "Facilities",
    "Electrical",
    "Plumbing",
    "Software",
    "Other",
  ];

  const priorities = [
    { id: "Critical", label: "Critical (Emergency / Safety)", color: "text-rose-400 border-rose-800 bg-rose-950/40" },
    { id: "High", label: "High (Affects ongoing classes)", color: "text-amber-400 border-amber-800 bg-amber-950/40" },
    { id: "Medium", label: "Medium (Standard maintenance)", color: "text-sky-400 border-sky-800 bg-sky-950/40" },
    { id: "Low", label: "Low (Minor cosmetic issue)", color: "text-zinc-400 border-zinc-800 bg-zinc-950" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Please ensure title and description fields are filled.");
      return;
    }
    if (!location.trim()) {
      setError("Location is required so technicians know where to go. Please type or click a location.");
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

      success(`Ticket #${createdTicket.ticket_number} created successfully!`, {
        label: "View Ticket",
        onClick: () => {
          window.location.href = `/tickets/${createdTicket.ticket_number}`;
        },
      });

      onTicketCreated(createdTicket);
    } catch (err: any) {
      const msg = err.message || "Failed to submit ticket. Please retry.";
      setError(msg);
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-zinc-900/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-zinc-800 shadow-2xl max-w-2xl mx-auto transition-all space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
            03
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Confirm Ticket Details
            </h2>
            <p className="text-xs text-zinc-400">
              Verify the issue details before assigning it to campus technicians
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Title */}
        <div>
          <label className="block text-zinc-300 font-semibold mb-1.5">
            Issue Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-zinc-300 font-semibold mb-1.5">
            Detailed Description
          </label>
          <textarea
            rows={3}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-xl p-3 text-xs leading-relaxed focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        {/* Category & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-300 font-semibold mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs focus:outline-hidden focus:border-emerald-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1.5">
              Campus Location
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Classroom Two, Lab 3..."
                className="w-full bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Location Presets */}
        <div>
          <span className="text-[11px] text-zinc-400 block mb-1.5">
            Quick Location Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {campusPresets.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocation(loc)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                  location === loc
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold"
                    : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border-zinc-800"
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Selector */}
        <div>
          <label className="block text-zinc-300 font-semibold mb-1.5">
            Priority Level
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {priorities.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPriority(p.id)}
                className={`text-left p-2.5 rounded-xl border text-xs transition ${
                  priority === p.id
                    ? `${p.color} border-current font-bold shadow-sm`
                    : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-900"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                <span>Creating Ticket in Supabase...</span>
              </>
            ) : (
              <>
                <span>Submit Ticket</span>
                <Send className="w-3.5 h-3.5 text-zinc-950" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
