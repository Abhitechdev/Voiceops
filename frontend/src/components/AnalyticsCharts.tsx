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

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "bg-rose-500 text-rose-50";
      case "high":
        return "bg-amber-500 text-amber-50";
      case "medium":
        return "bg-blue-500 text-blue-50";
      case "low":
        return "bg-slate-400 text-slate-50";
      default:
        return "bg-slate-300 text-slate-800";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
      {/* 1. Category Distribution Bar Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900">Issues by Operational Category</h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">Database Records</span>
        </div>

        {by_category.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No category data recorded yet</div>
        ) : (
          <div className="space-y-3">
            {by_category.map((item) => {
              const percentage = Math.round((item.count / maxCategoryCount) * 100);
              return (
                <div key={item.category}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">{item.category}</span>
                    <span className="text-slate-500 font-mono font-medium">{item.count} tickets</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-brand-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Priority Matrix Distribution */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Priority Level Breakdown</h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">Triage Severity</span>
        </div>

        {by_priority.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No priority data recorded yet</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2">
            {["Critical", "High", "Medium", "Low"].map((pri) => {
              const found = by_priority.find((p) => p.priority.toLowerCase() === pri.toLowerCase());
              const count = found ? found.count : 0;
              return (
                <div key={pri} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider mb-2 ${getPriorityColor(pri)}`}>
                    {pri}
                  </span>
                  <div className="text-2xl font-bold text-slate-900">{count}</div>
                  <span className="text-[10px] text-slate-400">tickets</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Top Locations sub-panel */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-600 flex items-center space-x-1.5 mb-2.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Top Recurring Campus Locations</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {by_location.map((loc) => (
              <span
                key={loc.location}
                className="inline-flex items-center space-x-1.5 text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 shadow-2xs"
              >
                <span className="font-medium">{loc.location}</span>
                <span className="bg-slate-100 text-slate-600 text-[10px] font-mono px-1.5 py-0.2 rounded font-bold">
                  {loc.count}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. 7-Day Trend Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200/90 shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Complaint Velocity (Last 7 Days)</h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">Daily Ingestion Rate</span>
        </div>

        <div className="grid grid-cols-7 gap-2 items-end h-40 pt-6">
          {trend_over_time.map((day) => {
            const heightPercent = maxTrendCount > 0 ? Math.round((day.count / maxTrendCount) * 100) : 0;
            const displayDate = day.date.slice(5); // MM-DD
            return (
              <div key={day.date} className="flex flex-col items-center justify-end h-full group">
                <span className="text-[11px] font-bold text-slate-700 mb-1 group-hover:text-brand-600 transition">
                  {day.count}
                </span>
                <div className="w-full max-w-[48px] bg-slate-100 rounded-t-lg h-full flex items-end overflow-hidden p-1">
                  <div
                    style={{ height: `${Math.max(heightPercent, 8)}%` }}
                    className="w-full bg-gradient-to-t from-brand-600 to-indigo-500 rounded-md transition-all group-hover:brightness-110"
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-400 mt-2">{displayDate}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
