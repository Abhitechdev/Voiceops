"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Mic,
  LayoutDashboard,
  ListFilter,
  User as UserIcon,
  LogOut,
  Sparkles,
  Menu,
  X,
  Plus,
} from "lucide-react";
import { api, User } from "@/lib/api";
import { useToast } from "@/components/Toast";

export default function Navbar() {
  const pathname = usePathname();
  const { toast, info } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    setCurrentUser(api.getCurrentUser());

    api.checkHealth()
      .then((data) => {
        setBackendHealthy(data.status === "healthy");
      })
      .catch(() => setBackendHealthy(false));
  }, [pathname]);

  const handleLogout = () => {
    const prevName = currentUser?.name;
    api.logout();
    setCurrentUser(null);
    info(prevName ? `Signed out ${prevName}. See you soon!` : "Signed out successfully.");
    setTimeout(() => {
      window.location.href = "/";
    }, 600);
  };

  const navLinks = [
    { name: "Report Issue", href: "/report", icon: Mic },
    { name: "Campus Tickets", href: "/tickets", icon: ListFilter },
    { name: "Staff Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Mark & Campus Status */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-all shadow-sm">
                <Mic className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-emerald-300 transition">
                    VoiceOps
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                    Campus Helpdesk
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 hidden sm:inline -mt-0.5">
                  Voice-to-Ticket for Students & Staff
                </span>
              </div>
            </Link>

            {/* Cloud & AI Status */}
            <div className="hidden lg:flex items-center space-x-2 pl-3 border-l border-zinc-800 text-xs">
              <span className="relative flex h-2 w-2">
                {backendHealthy === true ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                ) : backendHealthy === false ? (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400 animate-pulse"></span>
                )}
              </span>
              <span className="text-zinc-400 font-medium">
                {backendHealthy === true
                  ? "Gnani Voice AI & Supabase Live"
                  : backendHealthy === false
                  ? "Reconnecting..."
                  : "Checking status..."}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-zinc-900/70 p-1.5 rounded-xl border border-zinc-800/80">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-zinc-800 text-emerald-400 shadow-sm border border-zinc-700/60 font-semibold"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action / User Profile */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <Link
              href="/report"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 text-zinc-950" />
              <span>Report Issue</span>
            </Link>

            {currentUser ? (
              <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[11px] font-bold">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-zinc-200 text-xs font-semibold leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-zinc-400 text-[10px] capitalize">
                    {currentUser.role === "reporter" ? "Student / Reporter" : currentUser.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="text-zinc-400 hover:text-rose-400 p-1 transition ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition"
              >
                <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 px-2 border-t border-zinc-800/80 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium ${
                    isActive
                      ? "bg-zinc-800 text-emerald-400 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
