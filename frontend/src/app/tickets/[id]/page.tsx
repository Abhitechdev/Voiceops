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
} from "lucide-react";
import { api, Ticket } from "@/lib/api";

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Status and resolution state
  const [newStatus, setNewStatus] = useState<string>("");
  const [resolutionNotes, setResolutionNotes] = useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Internal note state
  const [noteText, setNoteText] = useState<string>("");
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);

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
      alert(err.message || "Failed to add note");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading ticket details...</div>;
  }

  if (error || !ticket) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Ticket Not Found</h2>
        <p className="text-xs text-slate-500">{error || "Could not retrieve ticket"}</p>
        <Link
          href="/tickets"
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Ticket Register</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button & Title Header */}
      <div>
        <Link
          href="/tickets"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold mb-3 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Register</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-sm font-black px-3 py-1 bg-brand-50 text-brand-700 rounded-lg border border-brand-200">
              {ticket.ticket_number}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {ticket.title}
            </h1>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span
              className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                ticket.status === "Resolved"
                  ? "bg-emerald-100 text-emerald-800"
                  : ticket.status === "In Progress"
                  ? "bg-indigo-100 text-indigo-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {ticket.status}
            </span>
            <span
              className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                ticket.priority === "Critical"
                  ? "bg-rose-100 text-rose-800"
                  : ticket.priority === "High"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {ticket.priority}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Transcripts (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Issue Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Problem Description
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Category</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{ticket.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Location</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {ticket.location || "Unspecified"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Reported By</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {ticket.reporter_name || "Guest Reporter"}
                </span>
              </div>
            </div>
          </div>

          {/* Speech Transcripts (Original vs Reviewed) */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-brand-600" />
              <span>Voice Note Speech Transcripts</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="font-bold text-slate-600 block mb-1">
                  User-Reviewed Transcript:
                </span>
                <p className="text-slate-800 italic">"{ticket.transcript_reviewed}"</p>
              </div>

              {ticket.transcript_original && (
                <div className="p-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <span className="font-medium text-slate-400 block mb-1">
                    Original Gnani AI Raw Output:
                  </span>
                  <p className="text-slate-500 italic">"{ticket.transcript_original}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Internal Notes */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Technician Internal Notes ({ticket.notes.length})</span>
            </h2>

            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add technician note (e.g., Replacement part ordered, dispatched Rajesh)..."
                className="flex-1 text-xs text-slate-800 bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={isSubmittingNote || !noteText.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
              >
                {isSubmittingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </form>

            <div className="space-y-2 mt-4">
              {ticket.notes.length === 0 ? (
                <span className="text-xs text-slate-400 italic block py-2">No internal notes added yet.</span>
              ) : (
                ticket.notes.map((n) => (
                  <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-bold text-slate-700">{n.author_name}</span>
                      <span>{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-700">{n.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Workflow Management & History (1 col) */}
        <div className="space-y-6">
          {/* Status & Resolution Form */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center space-x-1.5">
              <Shield className="w-4 h-4 text-brand-600" />
              <span>Update Ticket Workflow</span>
            </h2>

            <form onSubmit={handleStatusUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Change Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resolution Notes
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe resolution details before closing (e.g., replaced switch port, repaired leaking pipe)..."
                  className="w-full text-xs text-slate-800 bg-white border border-slate-300 rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingStatus}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-xs transition shadow-sm"
              >
                {isUpdatingStatus ? "Updating..." : "Save Status Change"}
              </button>
            </form>
          </div>

          {/* Chronological Audit Trail */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center space-x-1.5">
              <History className="w-4 h-4 text-slate-500" />
              <span>Status Audit Trail</span>
            </h2>

            <div className="space-y-3">
              {ticket.history.map((h, i) => (
                <div key={h.id} className="relative pl-5 text-xs">
                  <div className="absolute left-0 top-1 w-2 h-2 rounded-full bg-brand-500" />
                  {i < ticket.history.length - 1 && (
                    <div className="absolute left-[3.5px] top-3 bottom-0 w-0.5 bg-slate-200" />
                  )}
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-bold text-slate-700 uppercase tracking-wider">{h.action}</span>
                    <span>{new Date(h.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{h.new_value || h.action}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
