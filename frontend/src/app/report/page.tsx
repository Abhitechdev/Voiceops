"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mic, Edit3, CheckCircle2, Ticket as TicketIcon, ArrowRight, RotateCcw, ShieldCheck } from "lucide-react";
import VoiceRecorder from "@/components/VoiceRecorder";
import TranscriptEditor from "@/components/TranscriptEditor";
import IssueReviewForm from "@/components/IssueReviewForm";
import { IssueExtractionResult, Ticket } from "@/lib/api";

type WizardStep = "record" | "review" | "confirm" | "success";

export default function ReportPage() {
  const [step, setStep] = useState<WizardStep>("record");

  // State collected along the pipeline
  const [originalTranscript, setOriginalTranscript] = useState<string>("");
  const [reviewedTranscript, setReviewedTranscript] = useState<string>("");
  const [language, setLanguage] = useState<string>("te-IN");
  const [provider, setProvider] = useState<string>("mock_gnani_adapter");
  const [confidence, setConfidence] = useState<number>(0.92);
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
    { id: "record", label: "1. Record Speech", icon: Mic },
    { id: "review", label: "2. Review Transcript", icon: Edit3 },
    { id: "confirm", label: "3. Confirm Issue", icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Wizard Progress Stepper */}
      {step !== "success" && (
        <div className="flex items-center justify-center space-x-2 sm:space-x-4 max-w-lg mx-auto">
          {stepsList.map((s, idx) => {
            const Icon = s.icon;
            const isCurrent = step === s.id;
            const isPast =
              (step === "review" && idx === 0) ||
              (step === "confirm" && idx <= 1);

            return (
              <div key={s.id} className="flex items-center">
                <div
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    isCurrent
                      ? "bg-brand-600 text-white shadow-sm shadow-brand-500/30"
                      : isPast
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {idx < stepsList.length - 1 && (
                  <div className="w-4 sm:w-8 h-0.5 bg-slate-200 mx-1 sm:mx-2" />
                )}
              </div>
            );
          })}
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
        <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl max-w-xl mx-auto text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Complaint Logged Successfully
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-3">
              Ticket #{createdTicket.ticket_number}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Your voice report has been converted into a structured service ticket and assigned to campus operations.
            </p>
          </div>

          {/* Ticket Details Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Title:</span>
              <span className="font-semibold text-slate-800 text-right">{createdTicket.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Category:</span>
              <span className="font-semibold text-slate-800">{createdTicket.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Location:</span>
              <span className="font-semibold text-slate-800">{createdTicket.location || "Not specified"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Priority:</span>
              <span className="font-bold text-slate-800">{createdTicket.priority}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Initial Status:</span>
              <span className="font-semibold text-brand-600">{createdTicket.status}</span>
            </div>
          </div>

          {/* Next Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={`/tickets/${createdTicket.ticket_number}`}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-500/25 transition"
            >
              <TicketIcon className="w-4 h-4" />
              <span>Track Ticket Details</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={handleReset}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-5 py-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-medium text-sm transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Submit Another Report</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
