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
      title: "TOTAL DISPATCHES",
      value: analytics.total_tickets,
      subtitle: "Lifetime indexed reports",
      icon: Ticket,
      accent: "text-zinc-100",
      diode: "bg-zinc-500",
    },
    {
      title: "PENDING TRIAGE",
      value: analytics.open_tickets,
      subtitle: "Awaiting technician",
      icon: AlertCircle,
      accent: "text-amber-400",
      diode: "bg-amber-500 animate-pulse",
    },
    {
      title: "IN ACTIVE REPAIR",
      value: analytics.in_progress_tickets,
      subtitle: "Technicians in field",
      icon: PlayCircle,
      accent: "text-sky-400",
      diode: "bg-sky-500",
    },
    {
      title: "RESOLVED / CLOSED",
      value: analytics.resolved_tickets + analytics.closed_tickets,
      subtitle: "Verified completions",
      icon: CheckCircle2,
      accent: "text-emerald-400",
      diode: "bg-emerald-500",
    },
    {
      title: "SLA OVERDUE",
      value: analytics.overdue_tickets,
      subtitle: `Past ${analytics.sla_target_hours}h target`,
      icon: AlertTriangle,
      accent: analytics.overdue_tickets > 0 ? "text-rose-400" : "text-zinc-400",
      diode: analytics.overdue_tickets > 0 ? "bg-rose-500 animate-ping" : "bg-zinc-700",
    },
    {
      title: "MEAN TURNAROUND",
      value: `${analytics.avg_resolution_hours}h`,
      subtitle: "Intake to resolution",
      icon: Clock,
      accent: "text-emerald-300",
      diode: "bg-emerald-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="studio-panel p-4 rounded-xl border border-zinc-800 flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                {card.title}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${card.diode}`}></span>
            </div>

            <div>
              <div className={`text-2xl font-mono font-bold tracking-tight ${card.accent}`}>
                {card.value}
              </div>
              <p className="text-[10px] font-mono text-zinc-400 mt-0.5 truncate">
                {card.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
