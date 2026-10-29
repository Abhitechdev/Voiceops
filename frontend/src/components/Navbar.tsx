"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, Activity, LayoutDashboard, ListFilter, Shield, User as UserIcon, LogOut } from "lucide-react";
import { api, User } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [mockMode, setMockMode] = useState<boolean>(true);

  useEffect(() => {
    // Check user in localStorage
    setCurrentUser(api.getCurrentUser());

    // Check backend health
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
    { name: "Report Issue", href: "/report", icon: Mic },
    { name: "Tickets", href: "/tickets", icon: ListFilter },
    { name: "Admin Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-200/80 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Mic className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  VoiceOps
                </span>
                <span className="text-[10px] tracking-wide text-indigo-600 font-semibold uppercase -mt-1">
                  Gnani AI STT Platform
                </span>
              </div>
            </Link>

            {/* Backend Health Badge */}
            <div className="hidden md:flex items-center space-x-1.5 pl-3 border-l border-slate-200">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendHealthy === true
                    ? "bg-emerald-500 animate-pulse"
                    : backendHealthy === false
                    ? "bg-rose-500"
                    : "bg-amber-400"
                }`}
              />
              <span className="text-xs text-slate-500 font-medium">
                {backendHealthy === true
                  ? mockMode ? "Mock STT Ready" : "Gnani Live API"
                  : backendHealthy === false
                  ? "API Offline"
                  : "Connecting..."}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-50 text-brand-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action / User session */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200">
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  <span className="font-medium text-slate-700">{currentUser.name.split(" ")[0]}</span>
                  <span className="text-[11px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-brand-100 text-brand-700">
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-1.5 text-sm font-semibold text-slate-700 hover:text-brand-600 bg-white hover:bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200 shadow-sm transition-all"
              >
                <Shield className="w-4 h-4 text-slate-400" />
                <span>Admin Login</span>
              </Link>
            )}

            <Link
              href="/report"
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 shadow-sm shadow-brand-500/25 transition-all hover:shadow"
            >
              <Mic className="w-4 h-4 animate-pulse" />
              <span>Report Voice</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
