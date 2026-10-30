"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mic,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
  CheckCircle2,
  ListFilter,
  BarChart3,
  Clock,
  Volume2,
  MapPin,
  Sparkles,
  ArrowUpRight,
  Headphones,
  FileCheck,
  Wrench,
  Languages,
} from "lucide-react";
import { api, AnalyticsSummary, Ticket } from "@/lib/api";
import { useToast } from "@/components/Toast";

export default function HomePage() {
  const router = useRouter();
  const { toast, success } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"telugu" | "english">("telugu");

  useEffect(() => {
    api.getAnalytics()
      .then(setAnalytics)
      .catch(() => {});

    setLoadingTickets(true);
    api.listTickets({ limit: 6 })
      .then((tickets) => {
        setRecentTickets(tickets);
      })
      .catch((err) => {
        console.error("Failed to load tickets:", err);
      })
      .finally(() => {
        setLoadingTickets(false);
      });
  }, []);

  const handleSimulateSample = () => {
    const sampleText =
      activeTab === "telugu"
        ? "Classroom two lo projector switch on avvatledu, HDMI cable loose ga undi screen blue ga vastundi."
        : "The computer lab 3 internet connection has not been working since morning, students cannot submit their lab assignments.";

    success(`Loaded ${activeTab === "telugu" ? "Telugu" : "English"} sample speech!`, {
      label: "Open Form",
      onClick: () => router.push("/report"),
    });

    setTimeout(() => {
      router.push("/report");
    }, 600);
  };

  return (
    <div className="space-y-16 pb-20">
      {/* 1. Hero Section */}
      <section className="relative pt-10 sm:pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>AI Voice Helpdesk</span>
              <span className="text-zinc-600">•</span>
              <span>Telugu & English Supported</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
              Report Campus Issues in Seconds. <br />
              <span className="text-emerald-400 font-semibold">
                Just Speak Your Mind.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 max-w-2xl leading-relaxed">
              VoiceOps turns spoken voice complaints from students and faculty into assigned maintenance tickets. Instant Telugu and English speech recognition with real-time tracking from report to repair.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Link
                href="/report"
                className="inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
              >
                <Mic className="w-4 h-4 text-zinc-950" />
                <span>Report an Issue with Voice</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>

              <Link
                href="/tickets"
                className="inline-flex items-center justify-center space-x-2 px-5 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-semibold text-sm transition-all"
              >
                <ListFilter className="w-4 h-4 text-zinc-400" />
                <span>View Campus Tickets</span>
              </Link>
            </div>

            {/* Live Campus Statistics Strip */}
            {analytics && (
              <div className="pt-6 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800">
                  <div className="text-[11px] font-medium text-zinc-400">Total Logged</div>
                  <div className="text-2xl font-bold text-white mt-0.5">{analytics.total_tickets}</div>
                  <div className="text-[10px] text-zinc-500">Live in Supabase</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800">
                  <div className="text-[11px] font-medium text-amber-400">Under Review</div>
                  <div className="text-2xl font-bold text-amber-300 mt-0.5">{analytics.open_tickets}</div>
                  <div className="text-[10px] text-zinc-500">Awaiting technician</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800">
                  <div className="text-[11px] font-medium text-sky-400">In Active Fix</div>
                  <div className="text-2xl font-bold text-sky-300 mt-0.5">{analytics.in_progress_tickets}</div>
                  <div className="text-[10px] text-zinc-500">Technician assigned</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800">
                  <div className="text-[11px] font-medium text-emerald-400">Avg. Resolution</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-0.5">{analytics.avg_resolution_hours}h</div>
                  <div className="text-[10px] text-zinc-500">Campus turnaround</div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Interactive Voice Simulator Card */}
          <div className="lg:col-span-5">
            <div className="bg-zinc-900/90 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800 shadow-2xl relative overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    Interactive Voice Demo
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-zinc-400">
                  <Headphones className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Gnani AI Speech</span>
                </div>
              </div>

              {/* Waveform Visualization */}
              <div className="my-5 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between h-36 relative">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Voice Frequency Spectrum</span>
                  <span className="text-emerald-400 font-medium">Optimal Clarity</span>
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

                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <span>Low Freq</span>
                  <span>Mid Vocal</span>
                  <span>High Detail</span>
                </div>
              </div>

              {/* Language Switcher Tabs */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300">
                    Select Test Scenario:
                  </span>
                  <div className="flex space-x-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                    <button
                      onClick={() => setActiveTab("telugu")}
                      className={`px-3 py-1 rounded-lg transition font-medium ${
                        activeTab === "telugu"
                          ? "bg-zinc-800 text-emerald-400 font-bold shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      తెలుగు (Telugu)
                    </button>
                    <button
                      onClick={() => setActiveTab("english")}
                      className={`px-3 py-1 rounded-lg transition font-medium ${
                        activeTab === "english"
                          ? "bg-zinc-800 text-emerald-400 font-bold shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                {/* Preset Script Card */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-400 font-semibold">
                      {activeTab === "telugu" ? "Telugu Classroom Issue" : "Computer Lab Outage"}
                    </span>
                    <span className="text-[11px] text-zinc-400">95% Recognition Accuracy</span>
                  </div>
                  <p className="text-zinc-300 text-xs italic leading-relaxed">
                    {activeTab === "telugu"
                      ? '"Classroom two lo projector switch on avvatledu, HDMI cable loose ga undi screen blue ga vastundi."'
                      : '"The computer lab 3 internet connection has not been working since morning, students cannot submit their lab assignments."'}
                  </p>
                  <div className="pt-2 flex items-center justify-between border-t border-zinc-900 text-xs">
                    <span className="text-zinc-400">
                      {activeTab === "telugu" ? "Auto-tagged: Hardware Ops" : "Auto-tagged: Network Team"}
                    </span>
                    <button
                      onClick={handleSimulateSample}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold flex items-center space-x-1.5 transition active:scale-95"
                    >
                      <span>Try This Sample</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Feature Cards for Normal Users */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Designed for Campus Life
          </h2>
          <p className="text-sm text-zinc-400">
            No confusing forms or technical jargon. Anyone on campus can submit an issue in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Languages className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Speak Naturally</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Supports conversational Telugu, English, and code-mixed speech without requiring polished language.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Review Before Submitting</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Always review the transcribed text, edit words, or tweak details before the ticket is created.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Smart Location Tagging</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Detects classrooms, labs, hostels, and libraries to ensure the right maintenance team is dispatched.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Real-Time Progress</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Check live status updates as technicians inspect, repair, and resolve campus reports.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Real-Time Tickets Display */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-zinc-800 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Recent Campus Tickets
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Live tickets from students and faculty stored securely in Supabase
              </p>
            </div>
            <Link
              href="/tickets"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
            >
              <span>View All Campus Tickets</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingTickets ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              Loading recent tickets from Supabase...
            </div>
          ) : recentTickets.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-xs text-zinc-400">
                No tickets recorded yet. Be the first to report an issue!
              </p>
              <Link
                href="/report"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Report First Issue</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {recentTickets.map((t) => (
                <Link
                  key={t.ticket_number}
                  href={`/tickets/${t.ticket_number}`}
                  className="flex flex-col justify-between p-4 rounded-2xl bg-zinc-950/70 hover:bg-zinc-850/80 border border-zinc-800/80 hover:border-emerald-500/40 transition group space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-zinc-900 text-emerald-400 border border-zinc-800">
                        {t.ticket_number}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                          t.status === "Resolved"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : t.status === "In Progress"
                            ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-semibold text-zinc-100 group-hover:text-emerald-300 transition line-clamp-2">
                      {t.title}
                    </h4>

                    <div className="flex items-center space-x-2 text-[11px] text-zinc-400">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span className="truncate">{t.location || "Campus general"}</span>
                      </span>
                      <span>•</span>
                      <span>{t.category}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px]">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        t.priority === "Critical"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          : t.priority === "High"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800"
                      }`}
                    >
                      {t.priority} Priority
                    </span>
                    <span className="text-zinc-500 group-hover:text-emerald-400 flex items-center space-x-1 transition font-medium">
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
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
