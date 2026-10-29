"use client";

import React from "react";
import { Ticket, Clock, CheckCircle2, AlertCircle, AlertTriangle, PlayCircle, BarChart3 } from "lucide-react";
import { AnalyticsSummary } from "@/lib/api";

interface DashboardCardsProps {
  analytics: AnalyticsSummary;
}

export default function DashboardCards({ analytics }: DashboardCardsProps) {
  const cards = [
    {
      title: "Total Reports",
      value: analytics.total_tickets,
      subtitle: "All-time logged issues",
      icon: Ticket,
      color: "from-blue-600 to-indigo-600",
      bgBadge: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      title: "Open Pending",
      value: analytics.open_tickets,
      subtitle: "Awaiting triage / assignment",
      icon: AlertCircle,
      color: "from-amber-500 to-orange-500",
      bgBadge: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      title: "In Progress",
      value: analytics.in_progress_tickets,
      subtitle: "Technicians actively working",
      icon: PlayCircle,
      color: "from-indigo-600 to-violet-600",
      bgBadge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    {
      title: "Resolved / Closed",
      value: analytics.resolved_tickets + analytics.closed_tickets,
      subtitle: "Completed resolutions",
      icon: CheckCircle2,
      color: "from-emerald-500 to-teal-600",
      bgBadge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      title: "Overdue (SLA)",
      value: analytics.overdue_tickets,
      subtitle: `Exceeding ${analytics.sla_target_hours}h target`,
      icon: AlertTriangle,
      color: "from-rose-500 to-red-600",
      bgBadge: "bg-rose-50 text-rose-700 border-rose-200",
    },
    {
      title: "Avg Resolution",
      value: `${analytics.avg_resolution_hours}h`,
      subtitle: "From report to resolution",
      icon: Clock,
      color: "from-cyan-600 to-blue-600",
      bgBadge: "bg-cyan-50 text-cyan-700 border-cyan-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="glass-panel p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500">{card.title}</span>
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${card.color} text-white flex items-center justify-center shadow-xs`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">{card.value}</div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">{card.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
