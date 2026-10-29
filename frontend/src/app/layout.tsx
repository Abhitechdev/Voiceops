import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ConsentNotice from "@/components/ConsentNotice";

export const metadata: Metadata = {
  title: "VoiceOps — High-Precision Operational Voice Dispatch & Issue Tracking",
  description:
    "Engineering-grade voice dispatch system converting spoken Telugu and Indian English field reports into structured, triaged operational tickets via Gnani AI speech intelligence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
        <ConsentNotice />
        <Navbar />
        <main className="flex-1 w-full deck-grid">{children}</main>
        <footer className="border-t border-zinc-900 bg-zinc-950/80 backdrop-blur-md py-6 text-xs text-zinc-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="font-mono font-semibold text-zinc-300 tracking-wider">VOICEOPS_OS</span>
              <span className="text-zinc-700">|</span>
              <span className="text-zinc-400">Gnani AI Indian Voice Intelligence Challenge 2026</span>
            </div>
            <div className="flex items-center space-x-4 font-mono text-[11px] text-zinc-500">
              <span className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Telugu (te-IN) & English (en-IN)</span>
              </span>
              <span>•</span>
              <span>Deterministic Triage Pipeline</span>
              <span>•</span>
              <span>SLA Target Engine</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
