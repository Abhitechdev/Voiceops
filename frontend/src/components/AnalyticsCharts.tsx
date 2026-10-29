"use client";

import React from "react";
import { AnalyticsSummary } from "@/lib/api";
import { BarChart2, PieChart, TrendingUp, MapPin } from "lucide-react";

interface AnalyticsChartsProps {
  analytics: AnalyticsSummary;
}

export default function AnalyticsCharts({ analytics }: AnalyticsChartsProps) {
  const { by_category, by_priority, by_location, trend_over_time } = analytics;

  const maxCategoryCount = Math.max(...by_category.map((c) => c.count), 1);
  const maxTrendCount = Math.max(...trend_over_time.map((t) => t.count), 1);

  const getPriorityStyle = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "bg-rose-950/40 text-rose-400 border-rose-800/80";
      case "high":
        return "bg-amber-950/40 text-amber-400 border-amber-800/80";
      case "medium":
        return "bg-sky-950/40 text-sky-400 border-sky-800/80";
      case "low":
        return "bg-zinc-900 text-zinc-400 border-zinc-800";
      default:
        return "bg-zinc-900 text-zinc-400 border-zinc-800";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
      {/* 1. Category Distribution Technical Progress Rails */}
      <div className="studio-panel p-6 rounded-2xl border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 font-mono text-xs">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-zinc-100 uppercase">
              Incident Domain Distribution
            </h3>
          </div>
          <span className="text-[10px] text-zinc-500">OPERATIONAL SPECTRUM</span>
        </div>

        {by_category.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-zinc-500">
            No domain category data logged yet
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {by_category.map((item) => {
              const percentage = Math.round((item.count / maxCategoryCount) * 100);
              return (
                <div key={item.category} className="space-y-1 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-300 font-medium">{item.category}</span>
                    <span className="text-zinc-400 text-[11px]">{item.count} tickets</span>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800/80">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Priority Level Matrix & Top Locations */}
      <div className="studio-panel p-6 rounded-2xl border border-zinc-800 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 font-mono text-xs">
          <div className="flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-zinc-100 uppercase">
              Severity Triage Matrix
            </h3>
          </div>
          <span className="text-[10px] text-zinc-500">SLA TIERS</span>
        </div>

        {by_priority.length === 0 ? (
          <div className="py-8 text-center text-xs font-mono text-zinc-500">
            No priority data logged
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {["Critical", "High", "Medium", "Low"].map((pri) => {
              const found = by_priority.find((p) => p.priority.toLowerCase() === pri.toLowerCase());
              const count = found ? found.count : 0;
              return (
                <div
                  key={pri}
                  className={`p-3 rounded-xl border text-center font-mono ${getPriorityStyle(pri)}`}
                >
                  <span className="text-[10px] uppercase font-bold block mb-1">
                    {pri}
                  </span>
                  <div className="text-2xl font-bold">{count}</div>
                  <span className="text-[9px] opacity-75">work orders</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Campus Hotspots List */}
        <div className="pt-4 border-t border-zinc-800 space-y-2.5">
          <span className="text-xs font-mono font-bold text-zinc-400 uppercase flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>High-Frequency Campus Locations</span>
          </span>
          <div className="flex flex-wrap gap-1.5 font-mono text-xs">
            {by_location.map((loc) => (
              <span
                key={loc.location}
                className="inline-flex items-center space-x-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-300"
              >
                <span>{loc.location}</span>
                <span className="bg-zinc-850 text-emerald-400 text-[10px] px-1.5 py-0.2 rounded font-bold">
                  {loc.count}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. 7-Day Velocity Histogram */}
      <div className="studio-panel p-6 rounded-2xl border border-zinc-800 lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 font-mono text-xs">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-zinc-100 uppercase">
              7-Day Ingestion Velocity
            </h3>
          </div>
          <span className="text-[10px] text-zinc-500">HOURLY/DAILY AGGREGATION</span>
        </div>

        <div className="grid grid-cols-7 gap-2 items-end h-40 pt-4">
          {trend_over_time.map((day) => {
            const heightPercent = maxTrendCount > 0 ? Math.round((day.count / maxTrendCount) * 100) : 0;
            const displayDate = day.date.slice(5);
            return (
              <div key={day.date} className="flex flex-col items-center justify-end h-full group font-mono">
                <span className="text-[11px] font-bold text-zinc-400 mb-1 group-hover:text-emerald-400 transition">
                  {day.count}
                </span>
                <div className="w-full max-w-[48px] bg-zinc-950 border border-zinc-800 rounded-t-lg h-full flex items-end overflow-hidden p-1">
                  <div
                    className="w-full bg-emerald-500 rounded-t-xs transition-all duration-500 group-hover:bg-emerald-400"
                    style={{ height: `${Math.max(heightPercent, 8)}%` }}
                  />
                </div>
                <span className="text-[10px] text-zinc-500 mt-2 font-mono">{displayDate}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
