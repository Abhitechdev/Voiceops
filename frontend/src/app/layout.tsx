import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ConsentNotice from "@/components/ConsentNotice";

export const metadata: Metadata = {
  title: "VoiceOps — Voice-Based Issue Reporting & Management",
  description:
    "AI-powered voice-first operational workflow system converting spoken complaints into structured, trackable service tickets using Gnani AI speech recognition.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <ConsentNotice />
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200/80 bg-white/70 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-slate-700">VoiceOps</span> — Gnani AI Great Indian AI Internship Challenge 2026
            </div>
            <div className="flex items-center space-x-4 text-slate-400">
              <span>Telugu & English Speech Recognition</span>
              <span>•</span>
              <span>Test-Driven Operational Workflow</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
