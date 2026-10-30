"use client";

import React from "react";
import { Ticket, Clock, CheckCircle2, AlertCircle, AlertTriangle, PlayCircle } from "lucide-react";
import { AnalyticsSummary } from "@/lib/api";

interface DashboardCardsProps {
  analytics: AnalyticsSummary;
}

export default function DashboardCards({ analytics }: DashboardCardsProps) {
  const cards = [
    {
      title: "Total Tickets",
      value: analytics.total_tickets,
      subtitle: "All recorded campus issues",
      icon: Ticket,
      accent: "text-zinc-100",
      diode: "bg-emerald-500",
    },
    {
      title: "Under Review",
      value: analytics.open_tickets,
      subtitle: "Awaiting inspection",
      icon: AlertCircle,
      accent: "text-amber-400",
      diode: "bg-amber-500",
    },
    {
      title: "In Progress",
      value: analytics.in_progress_tickets,
      subtitle: "Technicians on site",
      icon: PlayCircle,
      accent: "text-sky-400",
      diode: "bg-sky-500",
    },
    {
      title: "Resolved Issues",
      value: analytics.resolved_tickets + analytics.closed_tickets,
      subtitle: "Successfully repaired",
      icon: CheckCircle2,
      accent: "text-emerald-400",
      diode: "bg-emerald-500",
    },
    {
      title: "Overdue (>48h)",
      value: analytics.overdue_tickets,
      subtitle: `Target: ${analytics.sla_target_hours}h`,
      icon: AlertTriangle,
      accent: analytics.overdue_tickets > 0 ? "text-rose-400" : "text-zinc-400",
      diode: analytics.overdue_tickets > 0 ? "bg-rose-500 animate-pulse" : "bg-zinc-700",
    },
    {
      title: "Avg. Turnaround",
      value: `${analytics.avg_resolution_hours}h`,
      subtitle: "Mean repair time",
      icon: Clock,
      accent: "text-emerald-300",
      diode: "bg-emerald-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-zinc-900/80 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-zinc-800 flex flex-col justify-between space-y-3 shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">
                {card.title}
              </span>
              <span className={`w-2 h-2 rounded-full ${card.diode}`}></span>
            </div>

            <div>
              <div className={`text-2xl font-bold tracking-tight ${card.accent}`}>
                {card.value}
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                {card.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
