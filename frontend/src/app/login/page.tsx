"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Mail,
  User,
  ArrowRight,
  Loader2,
  Sparkles,
  Lock,
  GraduationCap,
  Wrench,
  ShieldAlert,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast, success, error: toastError } = useToast();
  const [isRegister, setIsRegister] = useState<boolean>(false);

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [role, setRole] = useState<string>("reporter");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        await api.register({ name, email, password, role });
        success(`Account created for ${name || email}! Welcome to VoiceOps.`);
      } else {
        const loggedUser = await api.login(email, password);
        success(`Welcome back, ${loggedUser.name}!`, {
          label: "View Tickets",
          onClick: () => router.push("/tickets"),
        });
      }
      setTimeout(() => {
        router.push("/tickets");
      }, 500);
    } catch (err: any) {
      const msg = err.message || "Authentication failed";
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string, demoRoleLabel: string) => {
    setIsRegister(false);
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setLoading(true);

    try {
      const user = await api.login(demoEmail, demoPass);
      success(`Signed in as ${demoRoleLabel}!`, {
        label: "Open Tickets",
        onClick: () => router.push("/tickets"),
      });
      setTimeout(() => {
        router.push("/tickets");
      }, 400);
    } catch (err: any) {
      // If login fails (e.g. user not created yet in DB), auto-fill so they can test easily
      toast(`Loaded ${demoRoleLabel} credentials. Click Sign In to continue.`, "info");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="bg-zinc-900/80 backdrop-blur-xl p-7 sm:p-9 rounded-3xl border border-zinc-800 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            {isRegister ? "Create Campus Account" : "Sign In to VoiceOps"}
          </h1>
          <p className="text-xs text-zinc-400">
            {isRegister
              ? "Register to submit voice tickets and track repairs across campus"
              : "Access your campus support tickets and maintenance updates"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl transition font-semibold ${
              !isRegister
                ? "bg-zinc-800 text-emerald-400 border border-zinc-700 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl transition font-semibold ${
              isRegister
                ? "bg-zinc-800 text-emerald-400 border border-zinc-700 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Register
          </button>
        </div>

        {/* 1-Click Fast Demo Logins */}
        {!isRegister && (
          <div className="p-3.5 bg-zinc-950/70 rounded-2xl border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center space-x-1.5 font-medium text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>1-Click Quick Demo Sign In:</span>
              </span>
              <span className="text-[10px] text-zinc-500">Instant Access</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin("ravi@student.college.edu", "ravi123", "Student (Ravi)")
                }
                className="text-left p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-emerald-500/40 text-xs transition group"
              >
                <div className="flex items-center space-x-1.5 text-zinc-200 font-semibold group-hover:text-emerald-400">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Student</span>
                </div>
                <span className="text-zinc-500 text-[10px] block mt-0.5 truncate">
                  ravi@student.college.edu
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickLogin("admin@voiceops.internal", "admin123", "Campus Admin")
                }
                className="text-left p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-emerald-500/40 text-xs transition group"
              >
                <div className="flex items-center space-x-1.5 text-zinc-200 font-semibold group-hover:text-emerald-400">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin</span>
                </div>
                <span className="text-zinc-500 text-[10px] block mt-0.5 truncate">
                  admin@voiceops.internal
                </span>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <div>
              <label className="block text-zinc-300 font-medium mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Reddy"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-hidden focus:border-emerald-500 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-zinc-300 font-medium mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-hidden focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 font-medium mb-1.5">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-hidden focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-zinc-300 font-medium mb-1.5">
                I am a...
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-200 focus:outline-hidden focus:border-emerald-500 transition"
              >
                <option value="reporter">Student / Campus Resident</option>
                <option value="technician">Maintenance Technician</option>
                <option value="admin">Campus Administrator</option>
              </select>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm shadow-md shadow-emerald-500/20 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>{isRegister ? "Create Campus Account" : "Sign In to Helpdesk"}</span>
                <ArrowRight className="w-4 h-4 text-zinc-950" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-[11px] text-zinc-500">
          Need assistance? Speak with your department coordinator or campus IT helpdesk.
        </div>
      </div>
    </div>
  );
}
