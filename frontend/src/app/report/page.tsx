"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mic,
  Edit3,
  CheckCircle2,
  Ticket as TicketIcon,
  ArrowRight,
  RotateCcw,
  FileText,
  MapPin,
  Clock,
} from "lucide-react";
import VoiceRecorder from "@/components/VoiceRecorder";
import TranscriptEditor from "@/components/TranscriptEditor";
import IssueReviewForm from "@/components/IssueReviewForm";
import { IssueExtractionResult, Ticket } from "@/lib/api";

type WizardStep = "record" | "review" | "confirm" | "success";

export default function ReportPage() {
  const [step, setStep] = useState<WizardStep>("record");

  const [originalTranscript, setOriginalTranscript] = useState<string>("");
  const [reviewedTranscript, setReviewedTranscript] = useState<string>("");
  const [language, setLanguage] = useState<string>("te-IN");
  const [provider, setProvider] = useState<string>("gnani_ai");
  const [confidence, setConfidence] = useState<number>(0.94);
  const [extraction, setExtraction] = useState<IssueExtractionResult | null>(null);
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);

  const handleTranscriptionComplete = (data: {
    transcript: string;
    language: string;
    confidence: number;
    provider: string;
  }) => {
    setOriginalTranscript(data.transcript);
    setReviewedTranscript(data.transcript);
    setLanguage(data.language);
    setConfidence(data.confidence);
    setProvider(data.provider);
    setStep("review");
  };

  const handleExtractionComplete = (data: {
    originalTranscript: string;
    reviewedTranscript: string;
    extraction: IssueExtractionResult;
  }) => {
    setOriginalTranscript(data.originalTranscript);
    setReviewedTranscript(data.reviewedTranscript);
    setExtraction(data.extraction);
    setStep("confirm");
  };

  const handleTicketCreated = (ticket: Ticket) => {
    setCreatedTicket(ticket);
    setStep("success");
  };

  const handleReset = () => {
    setOriginalTranscript("");
    setReviewedTranscript("");
    setExtraction(null);
    setCreatedTicket(null);
    setStep("record");
  };

  const stepsList = [
    { id: "record", stepNum: "1", label: "Speak Issue", icon: Mic },
    { id: "review", stepNum: "2", label: "Review Speech", icon: Edit3 },
    { id: "confirm", stepNum: "3", label: "Confirm Ticket", icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Friendly Stepper */}
      {step !== "success" && (
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between bg-zinc-900/80 backdrop-blur-xl p-2 rounded-2xl border border-zinc-800 shadow-md">
            {stepsList.map((s, idx) => {
              const Icon = s.icon;
              const isCurrent = step === s.id;
              const isPast =
                (step === "review" && idx === 0) ||
                (step === "confirm" && idx <= 1);

              return (
                <React.Fragment key={s.id}>
                  <div
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl transition-all ${
                      isCurrent
                        ? "bg-zinc-800 text-emerald-400 font-bold border border-zinc-700 shadow-sm"
                        : isPast
                        ? "text-emerald-400 bg-emerald-950/20 font-medium"
                        : "text-zinc-500 font-medium"
                    }`}
                  >
                    <span className="text-[11px] opacity-80">{s.stepNum}.</span>
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-xs">{s.label}</span>
                  </div>
                  {idx < stepsList.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 rounded-full transition-all ${
                        isPast ? "bg-emerald-500/40" : "bg-zinc-800"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Step Views */}
      {step === "record" && (
        <VoiceRecorder onTranscriptionComplete={handleTranscriptionComplete} />
      )}

      {step === "review" && (
        <TranscriptEditor
          originalTranscript={originalTranscript}
          language={language}
          provider={provider}
          confidence={confidence}
          onReset={handleReset}
          onExtractionComplete={handleExtractionComplete}
        />
      )}

      {step === "confirm" && extraction && (
        <IssueReviewForm
          originalTranscript={originalTranscript}
          reviewedTranscript={reviewedTranscript}
          initialExtraction={extraction}
          onBack={() => setStep("review")}
          onTicketCreated={handleTicketCreated}
        />
      )}

      {/* Step 4: Submission Success View */}
      {step === "success" && createdTicket && (
        <div className="bg-zinc-900/90 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-zinc-800 shadow-2xl max-w-xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1 rounded-full">
              SAVED IN SUPABASE CLOUD
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight pt-2">
              Ticket #{createdTicket.ticket_number}
            </h2>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Your voice issue has been registered and routed to the campus maintenance team.
            </p>
          </div>

          {/* Ticket Summary Card */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <span className="text-zinc-500">ISSUE:</span>
              <span className="text-zinc-100 font-semibold truncate max-w-[280px]">
                {createdTicket.title}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-zinc-500 block text-[11px]">CATEGORY:</span>
                <span className="text-zinc-200">{createdTicket.category}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">LOCATION:</span>
                <span className="text-emerald-400 font-semibold truncate block">
                  {createdTicket.location || "Pending"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-zinc-900">
              <div>
                <span className="text-zinc-500 block text-[11px]">PRIORITY:</span>
                <span className="text-amber-400 font-semibold">{createdTicket.priority}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">INITIAL STATUS:</span>
                <span className="text-sky-400 font-semibold">{createdTicket.status}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={`/tickets/${createdTicket.ticket_number}`}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 transition active:scale-[0.98]"
            >
              <FileText className="w-4 h-4" />
              <span>View Ticket Details</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={handleReset}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-xs transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Report Another Issue</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
