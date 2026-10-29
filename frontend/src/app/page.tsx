"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mic,
  ArrowRight,
  ShieldCheck,
  Radio,
  Activity,
  Layers,
  CheckCircle2,
  ListFilter,
  BarChart3,
  Cpu,
  Clock,
  Volume2,
  Terminal,
  MapPin,
  Flame,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { api, AnalyticsSummary, Ticket } from "@/lib/api";

export default function HomePage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<"telugu" | "english">("telugu");

  useEffect(() => {
    api.getAnalytics()
      .then(setAnalytics)
      .catch(() => {});

    api.listTickets({ limit: 4 })
      .then((tickets) => setRecentTickets(tickets.slice(0, 4)))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-16 pb-20">
      {/* 1. Asymmetric Command & Dispatch Hero */}
      <section className="relative pt-10 sm:pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Mission Control Telemetry */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold text-emerald-400">DISPATCH PROTOCOL ACTIVE</span>
              <span className="text-zinc-600">/</span>
              <span>GNANI INDIC ASR</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.08]">
              Speak in Telugu or English. <br />
              <span className="text-zinc-400 font-medium">
                We Dispatch to Physical Resolution.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
              VoiceOps converts verbal campus and enterprise field reports into structured, triaged operational tickets. Acoustic speech recognition via Gnani AI, human-in-the-loop transcript review, and deterministic SLA tracking.
            </p>

            {/* Tactical Action Clusters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                href="/report"
                className="inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
              >
                <Mic className="w-4 h-4 text-zinc-950" />
                <span>Record Voice Dispatch</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>

              <Link
                href="/tickets"
                className="inline-flex items-center justify-center space-x-2 px-5 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-semibold text-sm transition-all"
              >
                <ListFilter className="w-4 h-4 text-zinc-400" />
                <span>Inspect Ticket Register</span>
              </Link>
            </div>

            {/* Live Operational Counters Strip */}
            {analytics && (
              <div className="pt-6 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                  <div className="text-[10px] font-mono uppercase text-zinc-400">Total Work Orders</div>
                  <div className="text-2xl font-mono font-bold text-white mt-0.5">{analytics.total_tickets}</div>
                  <div className="text-[10px] text-zinc-400">In SQLite Registry</div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                  <div className="text-[10px] font-mono uppercase text-amber-400">Open Triage</div>
                  <div className="text-2xl font-mono font-bold text-amber-300 mt-0.5">{analytics.open_tickets}</div>
                  <div className="text-[10px] text-zinc-400">Awaiting technician</div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                  <div className="text-[10px] font-mono uppercase text-sky-400">In Active Fix</div>
                  <div className="text-2xl font-mono font-bold text-sky-300 mt-0.5">{analytics.in_progress_tickets}</div>
                  <div className="text-[10px] text-zinc-400">Dispatched</div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                  <div className="text-[10px] font-mono uppercase text-emerald-400">Resolved SLA</div>
                  <div className="text-2xl font-mono font-bold text-emerald-400 mt-0.5">{analytics.avg_resolution_hours}h</div>
                  <div className="text-[10px] text-zinc-400">Mean turnaround</div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Studio Audio Deck & Indic Acoustic Telemetry */}
          <div className="lg:col-span-5">
            <div className="studio-panel rounded-2xl p-5 border border-zinc-800 shadow-2xl relative overflow-hidden">
              {/* Studio Header Bar */}
              <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></div>
                  <span className="font-mono text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    INDIC AUDIO MONITOR
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] font-mono text-zinc-400">
                  <span>16kHz PCM</span>
                  <span>•</span>
                  <span className="text-emerald-400">PRISMA v2.5</span>
                </div>
              </div>

              {/* Reactive Equalizer / Waveform Visualization */}
              <div className="my-5 p-4 rounded-xl bg-zinc-950 border border-zinc-800/90 flex flex-col justify-between h-36 relative">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>VU CH-01 [SPEECH]</span>
                  <span className="text-emerald-400 font-mono">-14.2 dBFS (OPTIMAL)</span>
                </div>

                {/* Animated Frequency Bars */}
                <div className="flex items-end justify-between gap-1 h-20 px-1">
                  {[25, 45, 60, 30, 85, 95, 70, 40, 65, 80, 55, 90, 75, 50, 85, 60, 35, 70, 95, 40, 60, 80].map(
                    (height, idx) => (
                      <div
                        key={idx}
                        className="w-full bg-zinc-800 rounded-t-xs overflow-hidden flex flex-col justify-end"
                        style={{ height: "100%" }}
                      >
                        <div
                          className={`w-full rounded-t-xs transition-all duration-300 ${
                            idx % 4 === 0
                              ? "bg-emerald-400 animate-wave"
                              : idx % 3 === 0
                              ? "bg-emerald-500 animate-wave"
                              : "bg-zinc-600"
                          }`}
                          style={{
                            height: `${height}%`,
                            animationDelay: `${idx * 60}ms`,
                          }}
                        />
                      </div>
                    )
                  )}
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
                  <span>100Hz</span>
                  <span>1kHz</span>
                  <span>4kHz</span>
                  <span>8kHz</span>
                </div>
              </div>

              {/* Indic Language Switcher Tabs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-zinc-400 uppercase">
                    Evaluation Presets
                  </span>
                  <div className="flex space-x-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-[11px] font-mono">
                    <button
                      onClick={() => setActiveTab("telugu")}
                      className={`px-2 py-0.5 rounded-md transition ${
                        activeTab === "telugu"
                          ? "bg-zinc-800 text-emerald-400 font-bold"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      తెలుగు (te-IN)
                    </button>
                    <button
                      onClick={() => setActiveTab("english")}
                      className={`px-2 py-0.5 rounded-md transition ${
                        activeTab === "english"
                          ? "bg-zinc-800 text-emerald-400 font-bold"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      English (en-IN)
                    </button>
                  </div>
                </div>

                {/* Preset Script Card */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                      {activeTab === "telugu" ? "CODE-MIXED TELUGU SAMPLE" : "CAMPUS ENGLISH SAMPLE"}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">Confidence: 94.6%</span>
                  </div>
                  <p className="text-zinc-300 text-xs italic leading-relaxed">
                    {activeTab === "telugu"
                      ? '"Classroom two lo projector switch on avvatledu, HDMI cable loose ga undi screen blue ga vastundi."'
                      : '"The computer lab 3 internet connection has not been working since morning, students cannot submit their lab assignments."'}
                  </p>
                  <div className="pt-2 flex items-center justify-between border-t border-zinc-900 text-[11px]">
                    <span className="text-zinc-400">Target: Hardware & Network Ops</span>
                    <Link
                      href="/report"
                      className="text-emerald-400 hover:text-emerald-300 font-mono font-medium flex items-center space-x-1"
                    >
                      <span>Simulate Dispatch</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Architectural Bento Grid - Zero Slop Operational Foundation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 uppercase tracking-widest mb-1.5">
            <Radio className="w-3.5 h-3.5" />
            <span>OPERATIONAL PIPELINE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Engineered for Ground Realities
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
            A fault-tolerant loop transforming raw phonetic speech into technician-dispatched work orders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Card 1: Indic Voice Model (Col span 7) */}
          <div className="md:col-span-7 studio-panel p-6 rounded-2xl border border-zinc-800 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-emerald-400">
                <Volume2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100 tracking-tight">
                Gnani AI Indic Phoneme Recognition
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-lg">
                Engineered specifically for Indian acoustic accents, colloquial speech, and code-mixed Telugu-English sentences. Transcribes real ambient laboratory and workshop recordings with high phoneme accuracy.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span className="text-emerald-400 font-semibold">16kHz Mono Sampling</span>
              <span>Telugu • English • Hindi</span>
            </div>
          </div>

          {/* Card 2: Human In The Loop (Col span 5) */}
          <div className="md:col-span-5 studio-panel p-6 rounded-2xl border border-zinc-800 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-sky-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100 tracking-tight">
                Zero-Hallucination Review Rail
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Reporters review and correct raw speech before NLP ticket generation occurs, eliminating false dispatches and AI hallucinations.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>Diff Engine</span>
              <span className="text-sky-400 font-semibold">Audited Transcripts</span>
            </div>
          </div>

          {/* Card 3: Deterministic Categorization (Col span 5) */}
          <div className="md:col-span-5 studio-panel p-6 rounded-2xl border border-zinc-800 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-amber-400">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100 tracking-tight">
                Campus Entity Classification
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Extracts location nodes (e.g., Computer Lab 3, Hostel B), operational domains (Network, Facilities, Hardware), and priority severity.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>Regex & NLP Rules</span>
              <span className="text-amber-400 font-semibold">Deterministic Schema</span>
            </div>
          </div>

          {/* Card 4: SLA Turnaround Watchdog (Col span 7) */}
          <div className="md:col-span-7 studio-panel p-6 rounded-2xl border border-zinc-800 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-emerald-400">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-100 tracking-tight">
                SLA Lifecycle & Technician Dispatch
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-lg">
                SQLite-backed transactional workflow engine enforcing strict resolution targets (24h / 48h / 72h). Provides complete audit trails, internal technician notes, and escalation timers.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span className="text-emerald-400 font-semibold">State Machine: Open → Dispatched → Resolved</span>
              <span>SQLite Operations</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Real-Time Operational Register Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="studio-panel rounded-2xl p-6 border border-zinc-800 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold font-mono text-zinc-100 uppercase tracking-wider">
                  Live Dispatch Ledger
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real operational tickets ingested via voice and manual dispatch
              </p>
            </div>
            <Link
              href="/tickets"
              className="text-xs font-mono font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
            >
              <span>View All Records</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-zinc-400">
              No tickets recorded yet. Record the first dispatch above.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentTickets.map((t) => (
                <Link
                  key={t.ticket_number}
                  href={`/tickets/${t.ticket_number}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-800/90 hover:border-zinc-700 transition group gap-3"
                >
                  <div className="flex items-start sm:items-center space-x-3">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {t.ticket_number}
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-zinc-100 group-hover:text-emerald-400 transition">
                        {t.title}
                      </h4>
                      <div className="flex items-center space-x-2 text-[11px] text-zinc-400 mt-0.5">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-zinc-400" />
                          <span>{t.location || "Location pending"}</span>
                        </span>
                        <span>•</span>
                        <span>{t.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                        t.priority === "Critical"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          : t.priority === "High"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-zinc-800 text-zinc-300 border-zinc-700"
                      }`}
                    >
                      {t.priority}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                        t.status === "Resolved"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : t.status === "In Progress"
                          ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {t.status}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
