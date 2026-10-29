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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <LayoutDashboard className="w-6 h-6 text-brand-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Operational Analytics Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time complaint tracking, category breakdown, and SLA resolution metrics from database
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* SLA Target Selector */}
          <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-700">SLA Target:</span>
            <select
              value={slaHours}
              onChange={(e) => setSlaHours(Number(e.target.value))}
              className="bg-transparent font-bold text-brand-600 focus:outline-hidden"
            >
              <option value={24}>24 Hours</option>
              <option value={48}>48 Hours (Standard)</option>
              <option value={72}>72 Hours</option>
            </select>
          </div>

          <button
            onClick={fetchAnalytics}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading && !analytics ? (
        <div className="py-24 text-center text-xs text-slate-400">Loading operational analytics...</div>
      ) : !analytics ? (
        <div className="py-20 text-center text-xs text-rose-500">Could not retrieve analytics. Ensure backend is running.</div>
      ) : (
        <>
          {/* 1. Summary Cards */}
          <DashboardCards analytics={analytics} />

          {/* 2. Visual Charts */}
          <AnalyticsCharts analytics={analytics} />

          {/* Quick Action Navigation */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Need to manage individual complaints?</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Visit the Ticket Register to change statuses, assign technicians, or inspect voice transcripts.
              </p>
            </div>
            <Link
              href="/tickets"
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition"
            >
              <span>Open Ticket Register</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
