"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Mic,
  Activity,
  LayoutDashboard,
  ListFilter,
  Shield,
  User as UserIcon,
  LogOut,
  Radio,
  PlusCircle,
  Menu,
  X,
} from "lucide-react";
import { api, User } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [mockMode, setMockMode] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    setCurrentUser(api.getCurrentUser());

    api.checkHealth()
      .then((data) => {
        setBackendHealthy(data.status === "healthy");
        setMockMode(Boolean(data.gnani_mock_mode));
      })
      .catch(() => setBackendHealthy(false));
  }, [pathname]);

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    window.location.href = "/";
  };

  const navLinks = [
    { name: "Voice Dispatch", href: "/report", icon: Mic, badge: "REC" },
    { name: "Ticket Register", href: "/tickets", icon: ListFilter },
    { name: "Control Room", href: "/dashboard", icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Mark & Signal Telemetry */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/50 group-hover:text-emerald-300 transition-all shadow-inner">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="font-mono text-base font-bold tracking-tight text-zinc-100">
                    VOICEOPS
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 font-semibold">
                    v2.5
                  </span>
                </div>
                <span className="text-[9px] font-mono tracking-widest text-emerald-500/80 uppercase -mt-0.5">
                  Gnani ASR Telemetry
                </span>
              </div>
            </Link>

            {/* Hardware Status Diode */}
            <div className="hidden lg:flex items-center space-x-2 pl-4 border-l border-zinc-800 text-[11px] font-mono">
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
              <span className="text-zinc-400">
                {backendHealthy === true
                  ? mockMode
                    ? "ENGINE: MOCK_ADAPTER"
                    : "ENGINE: GNANI_LIVE_ASR"
                  : backendHealthy === false
                  ? "SYSTEM: OFFLINE"
                  : "CONNECTING..."}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/80">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-zinc-800 text-emerald-400 shadow-sm border border-zinc-700/60 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action / Auth Status */}
          <div className="flex items-center space-x-3">
            <Link
              href="/report"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-sm shadow-emerald-500/20 transition-all active:scale-[0.98]"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Record Dispatch</span>
            </Link>

            {currentUser ? (
              <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-mono text-[10px] font-bold">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-zinc-200 text-[11px] font-semibold leading-none">
                    {currentUser.name}
                  </span>
                  <span className="text-zinc-500 font-mono text-[9px] uppercase">
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="text-zinc-500 hover:text-rose-400 p-1 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-mono transition"
              >
                <Shield className="w-3.5 h-3.5 text-zinc-400" />
                <span>Portal Login</span>
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
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
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
                    isActive
                      ? "bg-zinc-800 text-emerald-400 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </div>
                  {link.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
