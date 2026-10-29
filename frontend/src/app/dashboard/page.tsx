"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  RefreshCw,
  Clock,
  Shield,
  Layers,
  ArrowRight,
  TrendingUp,
  Download,
  AlertTriangle,
  Radio,
} from "lucide-react";
import { api, AnalyticsSummary } from "@/lib/api";
import DashboardCards from "@/components/DashboardCards";
import AnalyticsCharts from "@/components/AnalyticsCharts";

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [slaHours, setSlaHours] = useState<number>(48);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await api.getAnalytics(slaHours);
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [slaHours]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center space-x-2">
            <LayoutDashboard className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-bold font-mono text-zinc-100 tracking-tight uppercase">
              Operations Control Room
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time complaint telemetry, SLA resolution clock, and category ingestion metrics from SQLite
          </p>
        </div>

        <div className="flex items-center space-x-3 font-mono text-xs">
          {/* SLA Target Selector */}
          <div className="flex items-center space-x-2 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-400">SLA WINDOW:</span>
            <select
              value={slaHours}
              onChange={(e) => setSlaHours(Number(e.target.value))}
              className="bg-zinc-950 font-bold text-emerald-400 focus:outline-hidden border border-zinc-800 rounded px-1.5 py-0.5"
            >
              <option value={24}>24 Hours</option>
              <option value={48}>48 Hours (Standard)</option>
              <option value={72}>72 Hours</option>
            </select>
          </div>

          <button
            onClick={fetchAnalytics}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {loading && !analytics ? (
        <div className="py-24 text-center text-xs font-mono text-zinc-500">
          Aggregating database telemetry...
        </div>
      ) : !analytics ? (
        <div className="py-20 text-center text-xs font-mono text-rose-400">
          Could not retrieve telemetry. Ensure backend is running.
        </div>
      ) : (
        <>
          {/* 1. Summary Hardware Cards */}
          <DashboardCards analytics={analytics} />

          {/* 2. Visual Charts */}
          <AnalyticsCharts analytics={analytics} />

          {/* Quick Action Dispatch Banner */}
          <div className="studio-panel p-6 rounded-2xl border border-zinc-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono">
            <div>
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                Direct Field Dispatch Console
              </h3>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                Review specific acoustic transcripts, inspect technician logs, and update status transitions.
              </p>
            </div>
            <Link
              href="/tickets"
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold transition shrink-0"
            >
              <span>Open Ticket Register</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
