import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ConsentNotice from "@/components/ConsentNotice";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "VoiceOps — Campus Voice Support & Issue Helpdesk",
  description:
    "Report campus maintenance and facility issues instantly using your voice in Telugu or English. Powered by Gnani AI Speech Intelligence and Supabase.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
        <ToastProvider>
          <ConsentNotice />
          <Navbar />
          <main className="flex-1 w-full deck-grid">{children}</main>
          <footer className="border-t border-zinc-900 bg-zinc-950/80 backdrop-blur-md py-6 text-xs text-zinc-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <span className="font-semibold text-zinc-200">VoiceOps Campus Helpdesk</span>
                <span className="text-zinc-700">|</span>
                <span className="text-zinc-400">Powered by Gnani.ai Voice Intelligence</span>
              </div>
              <div className="flex items-center space-x-4 text-[12px] text-zinc-400">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Telugu (te-IN) & English (en-IN)</span>
                </span>
                <span>•</span>
                <span>Live on Supabase Cloud</span>
                <span>•</span>
                <span>Quick SLA Tracking</span>
              </div>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
