"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ListFilter,
  Search,
  Plus,
  RefreshCw,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  AlertTriangle,
  ArrowRight,
  Filter,
  Tag,
  Radio,
  SlidersHorizontal,
} from "lucide-react";
import { api, Ticket } from "@/lib/api";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedPriority, setSelectedPriority] = useState<string>("All");

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await api.listTickets({
        status: selectedStatus,
        category: selectedCategory,
        priority: selectedPriority,
        search,
      });
      setTickets(data);
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [selectedStatus, selectedCategory, selectedPriority]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-amber-950/40 text-amber-400 border-amber-800/60";
      case "In Progress":
        return "bg-sky-950/40 text-sky-400 border-sky-800/60";
      case "Resolved":
        return "bg-emerald-950/40 text-emerald-400 border-emerald-800/60";
      case "Closed":
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-rose-950/40 text-rose-400 border-rose-800/60 font-bold";
      case "High":
        return "bg-amber-950/40 text-amber-400 border-amber-800/60 font-semibold";
      case "Medium":
        return "bg-sky-950/40 text-sky-400 border-sky-800/60";
      case "Low":
        return "bg-zinc-900 text-zinc-400 border-zinc-800";
      default:
        return "bg-zinc-900 text-zinc-400 border-zinc-800";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center space-x-2">
            <ListFilter className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-bold font-mono text-zinc-100 tracking-tight uppercase">
              Operational Ticket Register
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            SQLite database of triaged service reports with acoustic transcripts and SLA timers
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchTickets}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </button>

          <Link
            href="/report"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold font-mono text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Dispatch</span>
          </Link>
        </div>
      </div>

      {/* Filter Matrix & Search Strip */}
      <div className="studio-panel p-4 rounded-2xl border border-zinc-800 shadow-md space-y-3.5">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket ID (VO-1001), keywords, location, or spoken transcript..."
              className="w-full text-xs font-mono text-zinc-100 bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 placeholder:text-zinc-600"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-mono font-bold rounded-xl transition"
          >
            Query
          </button>
        </form>

        {/* Filter Badges & Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {["All", "Open", "In Progress", "Resolved", "Closed"].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition ${
                  selectedStatus === st
                    ? "bg-zinc-800 text-emerald-400 border-zinc-700 font-bold"
                    : "bg-zinc-950 text-zinc-500 hover:text-zinc-300 border-zinc-800"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Category & Priority Selectors */}
          <div className="flex items-center space-x-2 text-xs font-mono">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-zinc-950 text-zinc-300 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:border-emerald-500"
            >
              <option value="All">All Domains</option>
              <option value="Network">Network</option>
              <option value="Hardware">Hardware</option>
              <option value="Facilities">Facilities</option>
              <option value="Electrical">Electrical</option>
              <option value="Software">Software</option>
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-zinc-950 text-zinc-300 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:border-emerald-500"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ticket Table Register View */}
      {loading ? (
        <div className="py-24 text-center text-xs font-mono text-zinc-500">
          Querying SQLite database records...
        </div>
      ) : tickets.length === 0 ? (
        <div className="studio-panel rounded-2xl p-12 text-center border border-zinc-800 space-y-3">
          <ListFilter className="w-8 h-8 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-mono font-bold text-zinc-200 uppercase">
            No Records Found
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            No work orders match the active filter criteria. Try adjusting the query or record a new ticket.
          </p>
        </div>
      ) : (
        <div className="studio-panel rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/80 font-mono text-[11px] text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Ticket ID</th>
                  <th className="py-3.5 px-4 font-semibold">Incident Title</th>
                  <th className="py-3.5 px-4 font-semibold">Domain</th>
                  <th className="py-3.5 px-4 font-semibold">Campus Node</th>
                  <th className="py-3.5 px-4 font-semibold">Severity</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 font-mono">
                {tickets.map((t) => (
                  <tr
                    key={t.ticket_number}
                    className="hover:bg-zinc-850/60 transition group"
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-zinc-200 group-hover:text-emerald-400 transition">
                        {t.ticket_number}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-sans max-w-xs sm:max-w-md">
                      <div className="font-medium text-zinc-100 truncate">
                        {t.title}
                      </div>
                      {t.transcript_reviewed && (
                        <div className="text-[11px] text-zinc-400 truncate italic mt-0.5">
                          "{t.transcript_reviewed}"
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                        {t.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="flex items-center space-x-1 text-zinc-400 truncate max-w-[140px]">
                        <MapPin className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">{t.location || "Pending"}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${getPriorityBadge(t.priority)}`}>
                        {t.priority}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${getStatusBadge(t.status)}`}>
                        {t.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/tickets/${t.ticket_number}`}
                        className="inline-flex items-center space-x-1 text-zinc-400 group-hover:text-emerald-400 transition font-bold"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
