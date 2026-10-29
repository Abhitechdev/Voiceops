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
  UserCheck,
  Radio,
  Volume2,
} from "lucide-react";
import { api, Ticket } from "@/lib/api";

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [newStatus, setNewStatus] = useState<string>("");
  const [resolutionNotes, setResolutionNotes] = useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  const [noteText, setNoteText] = useState<string>("");
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);

  const fetchTicket = async () => {
    try {
      const data = await api.getTicket(ticketId);
      setTicket(data);
      setNewStatus(data.status);
      setResolutionNotes(data.resolution_notes || "");
    } catch (err: any) {
      setError(err.message || "Failed to load ticket records");
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
    } catch (err: any) {
      alert(err.message || "Failed to update status");
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
      fetchTicket();
    } catch (err: any) {
      alert(err.message || "Failed to append technician note");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs font-mono text-zinc-500">
        Querying ticket record #{ticketId}...
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4 font-mono">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-zinc-100 uppercase">Ticket Not Found</h2>
        <p className="text-xs text-zinc-500">{error || "Could not retrieve ticket record from database."}</p>
        <Link
          href="/tickets"
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Register</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Return Link & Ticket Header */}
      <div>
        <Link
          href="/tickets"
          className="inline-flex items-center space-x-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-200 mb-3 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Ticket Register</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-sm font-bold px-3 py-1 bg-zinc-900 text-emerald-400 rounded-lg border border-zinc-700">
              {ticket.ticket_number}
            </span>
            <h1 className="text-lg sm:text-2xl font-bold text-zinc-100 tracking-tight">
              {ticket.title}
            </h1>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs">
            <span
              className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${
                ticket.priority === "Critical"
                  ? "bg-rose-950/40 text-rose-400 border-rose-800"
                  : ticket.priority === "High"
                  ? "bg-amber-950/40 text-amber-400 border-amber-800"
                  : "bg-zinc-900 text-zinc-300 border-zinc-800"
              }`}
            >
              {ticket.priority}
            </span>

            <span
              className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${
                ticket.status === "Resolved"
                  ? "bg-emerald-950/40 text-emerald-400 border-emerald-800"
                  : ticket.status === "In Progress"
                  ? "bg-sky-950/40 text-sky-400 border-sky-800"
                  : "bg-amber-950/40 text-amber-400 border-amber-800"
              }`}
            >
              {ticket.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Incident Details & Acoustic Evidence */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Description */}
          <div className="studio-panel p-6 rounded-2xl border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 font-mono text-xs text-zinc-400">
              <span className="flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-zinc-200 font-semibold">{ticket.location || "Campus Node Unspecified"}</span>
              </span>
              <span>DOMAIN: {ticket.category}</span>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                Technical Incident Description:
              </span>
              <p className="text-sm text-zinc-200 leading-relaxed font-sans">
                {ticket.description}
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-[11px] text-zinc-400">
              <div>
                <span className="text-zinc-400 block">SUBMITTED AT:</span>
                <span className="text-zinc-300 font-bold">{new Date(ticket.created_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-zinc-400 block">REPORTER:</span>
                <span className="text-zinc-300 font-bold">{ticket.reporter_name || "Campus Reporter"}</span>
              </div>
              <div>
                <span className="text-zinc-400 block">SLA CLOCK:</span>
                <span className="text-emerald-400 font-bold">Standard 48h</span>
              </div>
            </div>
          </div>

          {/* Acoustic Evidence Deck (Speech Audio & Transcripts) */}
          <div className="studio-panel p-6 rounded-2xl border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 font-mono text-xs">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-zinc-200 uppercase">
                  Acoustic Speech Record
                </h3>
              </div>
              <span className="text-[10px] text-zinc-500">GNANI AI ASR TELEMETRY</span>
            </div>

            {ticket.transcript_reviewed ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider block">
                    Verified Speech Transcript:
                  </span>
                  <p className="text-zinc-200 italic font-sans leading-relaxed text-sm">
                    "{ticket.transcript_reviewed}"
                  </p>
                </div>

                {ticket.transcript_original && ticket.transcript_original !== ticket.transcript_reviewed && (
                  <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-[11px] text-zinc-500">
                    <span className="text-zinc-400 block mb-0.5">Raw Initial Phonetic Stream:</span>
                    <span className="italic">"{ticket.transcript_original}"</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs font-mono text-zinc-500">
                Ticket created via manual operational input (no voice file attached).
              </div>
            )}
          </div>

          {/* Technician Audit Log & Internal Notes */}
          <div className="studio-panel p-6 rounded-2xl border border-zinc-800 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-zinc-800 font-mono text-xs">
              <History className="w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-zinc-200 uppercase">
                Field Technician Activity Log
              </h3>
            </div>

            {ticket.notes && ticket.notes.length > 0 ? (
              <div className="space-y-3">
                {ticket.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span className="text-emerald-400 font-bold">{note.author_name}</span>
                      <span>{new Date(note.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-zinc-200 font-sans text-xs pt-1">{note.note}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs font-mono text-zinc-500">
                No activity notes recorded yet.
              </div>
            )}

            {/* Append Note Input */}
            <form onSubmit={handleAddNote} className="pt-2 flex gap-2">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add technician observation or field status..."
                className="flex-1 text-xs font-mono text-zinc-100 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 focus:outline-hidden focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={isSubmittingNote || !noteText.trim()}
                className="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-mono font-bold rounded-xl transition disabled:opacity-50 flex items-center space-x-1"
              >
                <span>Log</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (4 cols): Dispatch & Resolution Control */}
        <div className="lg:col-span-4 space-y-6">
          <div className="studio-panel-elevated p-6 rounded-2xl border border-zinc-800 space-y-5">
            <div className="flex items-center space-x-2 pb-3 border-b border-zinc-800 font-mono text-xs">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-zinc-200 uppercase">
                Dispatch Lifecycle
              </h3>
            </div>

            <form onSubmit={handleStatusUpdate} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-zinc-400 uppercase text-[10px] mb-1.5">
                  Update Operational Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-xl p-2.5 focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="Open">Open (Pending Triage)</option>
                  <option value="In Progress">In Progress (Dispatched)</option>
                  <option value="Resolved">Resolved (Completed)</option>
                  <option value="Closed">Closed (Archived)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 uppercase text-[10px] mb-1.5">
                  Resolution Sign-off Notes
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Document actions taken by technician..."
                  className="w-full bg-zinc-950 text-zinc-200 border border-zinc-800 rounded-xl p-3 focus:outline-hidden focus:border-emerald-500 leading-relaxed font-sans text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingStatus}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                {isUpdatingStatus ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Committing...</span>
                  </>
                ) : (
                  <span>Commit Status Change</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
