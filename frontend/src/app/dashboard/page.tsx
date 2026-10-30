"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  RefreshCw,
  Clock,
  ArrowRight,
  TrendingUp,
  Download,
  AlertTriangle,
} from "lucide-react";
import { api, AnalyticsSummary } from "@/lib/api";
import DashboardCards from "@/components/DashboardCards";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import { useToast } from "@/components/Toast";

export default function DashboardPage() {
  const { toast, success, error: toastError } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [slaHours, setSlaHours] = useState<number>(48);

  const fetchAnalytics = async (showToast: boolean = false) => {
    setLoading(true);
    try {
      const data = await api.getAnalytics(slaHours);
      setAnalytics(data);
      if (showToast) {
        success("Dashboard metrics refreshed from Supabase!");
      }
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
      toastError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(false);
  }, [slaHours]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Campus Operations & Analytics
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time complaint statistics, turnaround times, and issue categories across campus
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {/* Target Selector */}
          <div className="flex items-center space-x-2 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-400">Resolution Goal:</span>
            <select
              value={slaHours}
              onChange={(e) => setSlaHours(Number(e.target.value))}
              className="bg-zinc-950 font-semibold text-emerald-400 focus:outline-hidden border border-zinc-800 rounded-lg px-2 py-1 cursor-pointer"
            >
              <option value={24}>24 Hours</option>
              <option value={48}>48 Hours (Standard)</option>
              <option value={72}>72 Hours</option>
            </select>
          </div>

          <button
            onClick={() => fetchAnalytics(true)}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white transition flex items-center space-x-1.5"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {loading && !analytics ? (
        <div className="py-24 text-center text-xs text-zinc-500">
          Loading campus operational data from Supabase...
        </div>
      ) : !analytics ? (
        <div className="py-20 text-center text-xs text-rose-400">
          Could not retrieve analytics. Please verify database connection.
        </div>
      ) : (
        <>
          {/* 1. Summary Cards */}
          <DashboardCards analytics={analytics} />

          {/* 2. Visual Charts */}
          <AnalyticsCharts analytics={analytics} />

          {/* Quick Action Banner */}
          <div className="bg-zinc-900/80 backdrop-blur-xl p-6 rounded-3xl border border-zinc-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">
                Campus Maintenance Dispatch
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Review voice transcripts, inspect technician logs, and update status transitions in real-time.
              </p>
            </div>
            <Link
              href="/tickets"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition shrink-0 shadow-md shadow-emerald-500/20 active:scale-95"
            >
              <span>View All Campus Tickets</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-950" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
