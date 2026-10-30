"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Tag,
  AlertCircle,
  CheckCircle2,
  PlayCircle,
  FileText,
  MessageSquare,
  History,
  Send,
  Loader2,
  Shield,
  Volume2,
  Copy,
  Check,
  User,
  Share2,
} from "lucide-react";
import { api, Ticket } from "@/lib/api";
import { useToast } from "@/components/Toast";

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast, success, error: toastError } = useToast();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [newStatus, setNewStatus] = useState<string>("");
  const [resolutionNotes, setResolutionNotes] = useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  const [noteText, setNoteText] = useState<string>("");
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const fetchTicket = async () => {
    try {
      const data = await api.getTicket(ticketId);
      setTicket(data);
      setNewStatus(data.status);
      setResolutionNotes(data.resolution_notes || "");
    } catch (err: any) {
      setError(err.message || "Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    setIsUpdatingStatus(true);
    try {
      const updated = await api.updateTicket(ticket.ticket_number, {
        status: newStatus,
        resolution_notes: resolutionNotes.trim() || undefined,
      });
      setTicket(updated);
      success(`Ticket status updated to "${newStatus}"!`, {
        label: "View All",
        onClick: () => router.push("/tickets"),
      });
    } catch (err: any) {
      toastError(err.message || "Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !noteText.trim()) return;

    setIsSubmittingNote(true);
    try {
      await api.addNote(ticket.ticket_number, noteText.trim());
      setNoteText("");
      await fetchTicket();
      success("Note added to ticket history!");
    } catch (err: any) {
      toastError(err.message || "Failed to add note");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      success("Ticket link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-zinc-500">
        Loading ticket details for #{ticketId}...
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Ticket Not Found</h2>
        <p className="text-xs text-zinc-400">{error || "Could not retrieve ticket record from database."}</p>
        <Link
          href="/tickets"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Tickets</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Return Link & Action Bar */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/tickets"
            className="inline-flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Tickets</span>
          </Link>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Share Ticket</span>
              </>
            )}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-bold px-3 py-1 bg-zinc-900 text-emerald-400 rounded-xl border border-zinc-800">
              {ticket.ticket_number}
            </span>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
              {ticket.title}
            </h1>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span
              className={`px-3 py-1 rounded-full font-semibold uppercase text-[10px] border ${
                ticket.priority === "Critical"
                  ? "bg-rose-500/15 text-rose-400 border-rose-500/30 font-bold"
                  : ticket.priority === "High"
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  : "bg-zinc-900 text-zinc-300 border-zinc-800"
              }`}
            >
              {ticket.priority} Priority
            </span>

            <span
              className={`px-3 py-1 rounded-full font-semibold uppercase text-[10px] border ${
                ticket.status === "Resolved"
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : ticket.status === "In Progress"
                  ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                  : "bg-amber-500/15 text-amber-400 border-amber-500/30"
              }`}
            >
              {ticket.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Incident Details & Audio/Transcript */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Description */}
          <div className="bg-zinc-900/80 backdrop-blur-xl p-6 rounded-3xl border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-xs text-zinc-400">
              <span className="flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span className="text-zinc-200 font-semibold">{ticket.location || "Campus Location Pending"}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                Category: {ticket.category}
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-zinc-400 block mb-1">
                Issue Description:
              </span>
              <p className="text-sm text-zinc-200 leading-relaxed font-sans">
                {ticket.description}
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-zinc-400">
              <div>
                <span className="text-zinc-500 block text-[11px]">REPORTED ON:</span>
                <span className="text-zinc-300 font-medium">{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">SUBMITTED BY:</span>
                <span className="text-zinc-300 font-medium">{ticket.reporter_name || "Campus Reporter"}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">SLA TARGET:</span>
                <span className="text-emerald-400 font-medium">Standard 48 Hours</span>
              </div>
            </div>
          </div>

          {/* Voice Speech Record */}
          <div className="bg-zinc-900/80 backdrop-blur-xl p-6 rounded-3xl border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-xs">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-zinc-200">
                  Original Voice Speech & Transcript
                </h3>
              </div>
              <span className="text-xs text-emerald-400 font-medium">Transcribed via Gnani AI</span>
            </div>

            {ticket.transcript_reviewed ? (
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                  <span className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider block">
                    Verified Speech Text (Telugu / English):
                  </span>
                  <p className="text-zinc-200 italic leading-relaxed text-sm">
                    "{ticket.transcript_reviewed}"
                  </p>
                </div>

                {ticket.transcript_original && ticket.transcript_original !== ticket.transcript_reviewed && (
                  <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400">
                    <span className="text-zinc-500 block mb-0.5 text-[11px]">Raw ASR Transcript:</span>
                    <span className="italic">"{ticket.transcript_original}"</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-zinc-500">
                Ticket created via manual entry.
              </div>
            )}
          </div>

          {/* Technician Notes & Activity History */}
          <div className="bg-zinc-900/80 backdrop-blur-xl p-6 rounded-3xl border border-zinc-800 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-zinc-800 text-xs">
              <History className="w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-zinc-200">
                Technician Notes & Progress Updates
              </h3>
            </div>

            {ticket.notes && ticket.notes.length > 0 ? (
              <div className="space-y-2.5">
                {ticket.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span className="text-emerald-400 font-semibold">{note.author_name || "Campus Staff"}</span>
                      <span>{new Date(note.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-zinc-200 text-xs pt-1">{note.note}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-3 text-center text-xs text-zinc-500">
                No technician notes recorded yet.
              </div>
            )}

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="pt-2 flex gap-2">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add technician comment or repair update..."
                className="flex-1 text-xs text-zinc-100 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 focus:outline-hidden focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isSubmittingNote || !noteText.trim()}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition disabled:opacity-50 flex items-center space-x-1.5"
              >
                <span>Save Note</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (4 cols): Update Status & Resolution */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900/90 backdrop-blur-xl p-6 rounded-3xl border border-zinc-800 space-y-5">
            <div className="flex items-center space-x-2 pb-3 border-b border-zinc-800 text-xs">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-zinc-200">
                Update Ticket Status
              </h3>
            </div>

            <form onSubmit={handleStatusUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">
                  Change Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-xl p-2.5 focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="Open">Open (Pending Inspection)</option>
                  <option value="In Progress">In Progress (Work Assigned)</option>
                  <option value="Resolved">Resolved (Fixed)</option>
                  <option value="Closed">Closed (Archived)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">
                  Resolution Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe repair actions taken (e.g. HDMI cable replaced in Room 2)..."
                  className="w-full bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-xl p-3 focus:outline-hidden focus:border-emerald-500 text-xs leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingStatus}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                {isUpdatingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Updating in Supabase...</span>
                  </>
                ) : (
                  <span>Save Status Update</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
