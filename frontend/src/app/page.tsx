"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mic,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  ListFilter,
  BarChart3,
  Cpu,
  Clock,
  Sparkles,
} from "lucide-react";
import { api, AnalyticsSummary, Ticket } from "@/lib/api";

export default function HomePage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    api.getAnalytics()
      .then(setAnalytics)
      .catch(() => {});

    api.listTickets({ limit: 4 })
      .then((tickets) => setRecentTickets(tickets.slice(0, 4)))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-brand-300/30 to-indigo-300/20 blur-3xl rounded-full pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span>Gnani AI Great Indian AI Internship Challenge 2026</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight sm:leading-none">
            Speak Your Problem. <br />
            <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              We Move It to Resolution.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            VoiceOps replaces informal verbal complaints with an automated, trackable operational pipeline. Record your issue in Telugu or English, verify the speech transcript, confirm extracted details, and monitor until resolution.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/report"
              className="w-full sm:w-auto flex items-center justify-center space-x-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold text-base shadow-lg shadow-brand-500/25 transition active:scale-98"
            >
              <Mic className="w-5 h-5 animate-pulse" />
              <span>Record Voice Complaint</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/tickets"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-base shadow-xs transition"
            >
              <ListFilter className="w-4 h-4 text-slate-500" />
              <span>View Ticket Register</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Live Operational Metrics Preview */}
      {analytics && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-md">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-brand-600" />
                  <span>Real Database Activity Snapshot</span>
                </h2>
                <p className="text-xs text-slate-500">Live counts calculated directly from operational SQLite records</p>
              </div>
              <Link
                href="/dashboard"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
              >
                <span>Full Analytics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-xs font-semibold text-slate-500 block">Total Logged</span>
                <span className="text-3xl font-black text-slate-900 mt-1 block">{analytics.total_tickets}</span>
                <span className="text-[11px] text-slate-400">Total service requests</span>
              </div>
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
                <span className="text-xs font-semibold text-amber-700 block">Open Pending</span>
                <span className="text-3xl font-black text-amber-900 mt-1 block">{analytics.open_tickets}</span>
                <span className="text-[11px] text-amber-600">Awaiting technician</span>
              </div>
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80">
                <span className="text-xs font-semibold text-indigo-700 block">In Progress</span>
                <span className="text-3xl font-black text-indigo-900 mt-1 block">{analytics.in_progress_tickets}</span>
                <span className="text-[11px] text-indigo-600">Actively being fixed</span>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                <span className="text-xs font-semibold text-emerald-700 block">Resolved / Closed</span>
                <span className="text-3xl font-black text-emerald-900 mt-1 block">
                  {analytics.resolved_tickets + analytics.closed_tickets}
                </span>
                <span className="text-[11px] text-emerald-600">Avg {analytics.avg_resolution_hours}h turnaround</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4 Feature Value Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Engineered for Ground Realities
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Moving beyond simple transcription into a complete, reliable issue resolution lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Gnani AI Indian Voice STT</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Accepts voice complaints in Telugu (తెలుగు), Indian English, and code-mixed speech. Users can review and edit the transcript before details are processed.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Structured Issue Extraction</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automatically identifies category, location, and priority. Crucially flags missing information (e.g. unknown room) so unconfirmed details never silently become facts.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Trackable Lifecycle & Audit</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sequential IDs (<code className="font-mono font-bold text-brand-600">VO-1001</code>), full audit history for every status change, internal technician notes, and true database-derived analytics.
            </p>
          </div>
        </div>
      </section>

      {/* Recent Activity Table Preview */}
      {recentTickets.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Recent Service Reports</h2>
              <Link href="/tickets" className="text-xs font-semibold text-brand-600 hover:underline">
                View all tickets →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                    <th className="py-2.5 px-3">Ticket ID</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-mono font-bold text-brand-600">
                        <Link href={`/tickets/${t.ticket_number}`} className="hover:underline">
                          {t.ticket_number}
                        </Link>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{t.title}</td>
                      <td className="py-3 px-3 text-slate-600">{t.category}</td>
                      <td className="py-3 px-3 text-slate-500">{t.location || "Not specified"}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            t.priority === "Critical"
                              ? "bg-rose-100 text-rose-800"
                              : t.priority === "High"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">{t.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
