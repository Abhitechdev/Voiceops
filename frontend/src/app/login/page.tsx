"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, KeyRound, Mail, User, AlertCircle, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState<boolean>(false);

  // Form states
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
      <div className="glass-panel p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center mx-auto shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {isRegister ? "Create VoiceOps Account" : "Staff & Reporter Portal"}
          </h1>
          <p className="text-xs text-slate-500">
            {isRegister
              ? "Register to track and submit complaints under your name"
              : "Sign in with administrator or reporter credentials"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition ${
              !isRegister ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
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
            className={`flex-1 py-1.5 rounded-lg transition ${
              isRegister ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
            }`}
          >
            Register
          </button>
        </div>

        {/* One-Click Evaluation Demo Fillers */}
        {!isRegister && (
          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs space-y-2">
            <span className="text-[11px] font-bold text-indigo-900 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Instant Evaluation Demo Credentials:</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={autofillAdmin}
                className="p-2 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg text-left transition"
              >
                <span className="font-bold text-indigo-700 block text-[11px]">IT Admin</span>
                <span className="text-[10px] text-slate-500">admin@voiceops.internal</span>
              </button>
              <button
                type="button"
                onClick={autofillReporter}
                className="p-2 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg text-left transition"
              >
                <span className="font-bold text-indigo-700 block text-[11px]">Student Reporter</span>
                <span className="text-[10px] text-slate-500">ravi@student.college.edu</span>
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@college.edu"
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              >
                <option value="reporter">Student / Faculty Reporter</option>
                <option value="admin">Operations / IT Administrator</option>
              </select>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-brand-500/25 transition disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-1.5">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </span>
            ) : isRegister ? (
              "Complete Registration"
            ) : (
              "Sign In to VoiceOps"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
