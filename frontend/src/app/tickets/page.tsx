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
import { useToast } from "@/components/Toast";

export default function TicketsPage() {
  const { toast, success, error: toastError } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedPriority, setSelectedPriority] = useState<string>("All");

  const fetchTickets = async (showToast: boolean = false) => {
    setLoading(true);
    try {
      const data = await api.listTickets({
        status: selectedStatus,
        category: selectedCategory,
        priority: selectedPriority,
        search,
      });
      setTickets(data);
      if (showToast) {
        success(`Loaded ${data.length} tickets from Supabase!`);
      }
    } catch (err: any) {
      console.error("Failed to load tickets:", err);
      toastError(err.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(false);
  }, [selectedStatus, selectedCategory, selectedPriority]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "In Progress":
        return "bg-sky-500/15 text-sky-400 border-sky-500/30";
      case "Resolved":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "Closed":
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30 font-bold";
      case "High":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30 font-semibold";
      case "Medium":
        return "bg-sky-500/15 text-sky-400 border-sky-500/30";
      case "Low":
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ListFilter className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Campus Maintenance Tickets
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time campus tickets with voice transcripts, repair locations, and status updates
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchTickets(true)}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white transition flex items-center space-x-1.5 text-xs"
            title="Refresh tickets from Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            href="/report"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Report New Issue</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900/80 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-zinc-800 shadow-md space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket ID (e.g. VO-1001), keywords, location, or issue details..."
              className="w-full text-xs text-zinc-100 bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 focus:outline-hidden focus:border-emerald-500 placeholder:text-zinc-600 transition"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition"
          >
            Search
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
                className={`text-xs px-3 py-1.5 rounded-xl border transition font-medium ${
                  selectedStatus === st
                    ? "bg-zinc-800 text-emerald-400 border-zinc-700 font-bold shadow-sm"
                    : "bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 border-zinc-800"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Category & Priority Selectors */}
          <div className="flex items-center space-x-2 text-xs">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-zinc-950 text-zinc-300 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs focus:outline-hidden focus:border-emerald-500"
            >
              <option value="All">All Categories</option>
              <option value="Network">Network</option>
              <option value="Hardware">Hardware</option>
              <option value="Facilities">Facilities</option>
              <option value="Electrical">Electrical</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Software">Software</option>
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-zinc-950 text-zinc-300 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs focus:outline-hidden focus:border-emerald-500"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ticket List View */}
      {loading ? (
        <div className="py-24 text-center text-xs text-zinc-500">
          Loading campus tickets from Supabase...
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-zinc-900/60 rounded-3xl p-12 text-center border border-zinc-800 space-y-3">
          <ListFilter className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-zinc-200">
            No Tickets Found
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            No campus maintenance tickets match your search or filter criteria. Try clearing the filters or reporting a new issue.
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-zinc-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Issue Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {tickets.map((t) => (
                  <tr
                    key={t.ticket_number}
                    className="hover:bg-zinc-850/60 transition group cursor-pointer"
                    onClick={() => {
                      window.location.href = `/tickets/${t.ticket_number}`;
                    }}
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-zinc-200 group-hover:text-emerald-400 transition">
                        {t.ticket_number}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                      <div className="font-semibold text-zinc-100 group-hover:text-emerald-300 transition truncate">
                        {t.title}
                      </div>
                      {t.transcript_reviewed && (
                        <div className="text-[11px] text-zinc-400 truncate italic mt-0.5">
                          "{t.transcript_reviewed}"
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300">
                        {t.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="flex items-center space-x-1.5 text-zinc-400 truncate max-w-[150px]">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">{t.location || "Pending"}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] uppercase px-2.5 py-0.5 rounded-full border ${getPriorityBadge(t.priority)}`}>
                        {t.priority}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] uppercase px-2.5 py-0.5 rounded-full border ${getStatusBadge(t.status)}`}>
                        {t.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/tickets/${t.ticket_number}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center space-x-1 text-zinc-400 group-hover:text-emerald-400 transition font-semibold"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
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
