"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  KeyRound,
  Mail,
  User,
  AlertCircle,
  ArrowRight,
  Loader2,
  Sparkles,
  Lock,
} from "lucide-react";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
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
      } else {
        await api.login(email, password);
      }
      router.push("/tickets");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const autofillAdmin = () => {
    setIsRegister(false);
    setEmail("admin@voiceops.internal");
    setPassword("admin123");
    setError(null);
  };

  const autofillReporter = () => {
    setIsRegister(false);
    setEmail("ravi@student.college.edu");
    setPassword("ravi123");
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="studio-panel-elevated p-8 rounded-3xl border border-zinc-800 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-mono font-bold text-zinc-100 uppercase tracking-wider">
            {isRegister ? "New Station Identity" : "Operations Portal Access"}
          </h1>
          <p className="text-xs text-zinc-400 font-sans">
            {isRegister
              ? "Create authenticated reporter or technician credential"
              : "Sign in with administrator or campus credentials"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition font-bold ${
              !isRegister
                ? "bg-zinc-800 text-emerald-400 border border-zinc-700 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
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
            className={`flex-1 py-1.5 rounded-lg transition font-bold ${
              isRegister
                ? "bg-zinc-800 text-emerald-400 border border-zinc-700 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Register
          </button>
        </div>

        {/* Challenge Reviewer Quick Autofill Matrix */}
        {!isRegister && (
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase">
              <span className="flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Reviewer Fast Credentials:</span>
              </span>
              <span>1-Click Test</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={autofillAdmin}
                className="text-left p-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[11px] font-mono transition group"
              >
                <span className="text-zinc-300 font-bold block group-hover:text-emerald-400">
                  Operations Admin
                </span>
                <span className="text-zinc-400 text-[10px] block">admin@voiceops</span>
              </button>

              <button
                type="button"
                onClick={autofillReporter}
                className="text-left p-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[11px] font-mono transition group"
              >
                <span className="text-zinc-300 font-bold block group-hover:text-emerald-400">
                  Campus Reporter
                </span>
                <span className="text-zinc-400 text-[10px] block">ravi@student</span>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          {isRegister && (
            <div>
              <label className="block text-zinc-400 uppercase text-[10px] mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Reddy"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-zinc-100 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-zinc-400 uppercase text-[10px] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@college.edu"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-zinc-100 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 uppercase text-[10px] mb-1">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-zinc-100 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-zinc-400 uppercase text-[10px] mb-1">
                Station Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-200 focus:outline-hidden focus:border-emerald-500"
              >
                <option value="reporter">Reporter (Campus User / Student)</option>
                <option value="technician">Field Operations Technician</option>
                <option value="admin">Operations Administrator</option>
              </select>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-1.5 pt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>{isRegister ? "Create Account" : "Access Station"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
