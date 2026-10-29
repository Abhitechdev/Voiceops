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
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "In Progress":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Resolved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Closed":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-rose-100 text-rose-800 font-bold";
      case "High":
        return "bg-amber-100 text-amber-800 font-semibold";
      case "Medium":
        return "bg-blue-100 text-blue-800";
      case "Low":
        return "bg-slate-100 text-slate-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <ListFilter className="w-6 h-6 text-brand-600" />
            <span>Ticket Register</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, and review service reports created through voice and manual entry
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchTickets}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <Link
            href="/report"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Report Issue</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket number (VO-1001), keywords, location, or problem description..."
              className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition"
          >
            Search
          </button>
        </form>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
          <span className="font-semibold text-slate-500 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </span>

          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
            {["All", "Open", "In Progress", "Resolved"].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  selectedStatus === st
                    ? "bg-white text-brand-700 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="All">All Categories</option>
            <option value="Network">Network</option>
            <option value="Hardware">Hardware</option>
            <option value="Electrical">Electrical</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Facility">Facility</option>
          </select>

          {/* Priority Dropdown */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="glass-panel rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading tickets from database...</div>
        ) : tickets.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <span className="text-sm font-semibold text-slate-600 block">No matching tickets found</span>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search criteria or record a new complaint via voice.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Summary & Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reported</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-600">
                      <Link href={`/tickets/${t.ticket_number}`} className="hover:underline">
                        {t.ticket_number}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs sm:max-w-sm">
                      <Link
                        href={`/tickets/${t.ticket_number}`}
                        className="font-bold text-slate-800 hover:text-brand-600 transition block truncate"
                      >
                        {t.title}
                      </Link>
                      <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {t.description}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700">{t.category}</td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-[120px]">{t.location || "Unspecified"}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${getPriorityBadge(t.priority)}`}>
                        {t.priority}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                          t.status
                        )}`}
                      >
                        {t.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {t.created_at ? new Date(t.created_at).toLocaleDateString() : ""}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/tickets/${t.ticket_number}`}
                        className="inline-flex items-center space-x-1 text-brand-600 hover:text-brand-700 font-bold hover:underline"
                      >
                        <span>Manage</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
