"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  Square,
  Play,
  RotateCcw,
  ArrowRight,
  Loader2,
  Volume2,
  AlertCircle,
  Sparkles,
  Languages,
  CheckCircle2,
  Pause,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/Toast";

interface VoiceRecorderProps {
  onTranscriptionComplete: (data: {
    transcript: string;
    language: string;
    confidence: number;
    provider: string;
    audioBlob?: Blob;
  }) => void;
}

export default function VoiceRecorder({ onTranscriptionComplete }: VoiceRecorderProps) {
  const { toast, success, error: toastError, info } = useToast();
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("te-IN");
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connTesting, setConnTesting] = useState<boolean>(false);
  const [connResult, setConnResult] = useState<{
    connected: boolean;
    latency_ms?: number;
    model?: string;
    request_id?: string;
    message: string;
  } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const handleTestConnection = async () => {
    setConnTesting(true);
    try {
      const res = await api.testGnaniConnection();
      setConnResult(res);
      if (res.connected) {
        success(`Connected to Gnani Voice AI (${res.model || "Indic Live"})!`);
      } else {
        toast(res.message, "warning");
      }
    } catch (err: any) {
      const msg = err.message || "Connection check failed";
      setConnResult({ connected: false, message: msg });
      toastError(msg);
    } finally {
      setConnTesting(false);
    }
  };

  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  const startRecording = async () => {
    setErrorMessage(null);
    setAudioBlob(null);
    setAudioUrl(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
        info("Audio recorded! Click 'Transcribe Voice' to proceed.");
      };

      mediaRecorder.start(200);
      setIsRecording(true);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage("Microphone permission was not allowed. You can select one of the test samples below to test immediately without a microphone.");
      } else {
        setErrorMessage("Could not connect to microphone. You can test using the preset audio samples below.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const discardRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (!audioElementRef.current || !audioUrl) return;
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSubmitRecording = async () => {
    if (!audioBlob) return;
    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      const result = await api.transcribeAudio(audioBlob, selectedLanguage);
      success("Speech transcribed successfully!");
      onTranscriptionComplete({
        transcript: result.transcript,
        language: result.language || selectedLanguage,
        confidence: result.confidence || 0.94,
        provider: result.provider || "gnani_ai",
        audioBlob,
      });
    } catch (err: any) {
      const msg = err.message || "Transcription failed. Please try again or use a sample.";
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleUseSample = async (sampleText: string, lang: string) => {
    setSelectedLanguage(lang);
    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      success(`Loaded ${lang === "te-IN" ? "Telugu" : "English"} sample! Transcribing...`);
      onTranscriptionComplete({
        transcript: sampleText,
        language: lang,
        confidence: 0.95,
        provider: "gnani_indic_sample",
      });
    } catch (err: any) {
      setErrorMessage("Could not load sample speech.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-zinc-900/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-zinc-800 shadow-2xl max-w-2xl mx-auto transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-zinc-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
            01
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Record Your Issue by Voice
            </h2>
            <p className="text-xs text-zinc-400">
              Speak in Telugu or English. We'll transcribe it and draft your ticket.
            </p>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center space-x-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
          <Languages className="w-3.5 h-3.5 text-zinc-400 ml-1.5" />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            disabled={isRecording || isTranscribing}
            className="bg-transparent text-zinc-200 border-none px-2 py-1 text-xs focus:outline-hidden cursor-pointer"
          >
            <option value="te-IN">తెలుగు (Telugu)</option>
            <option value="en-IN">English (Indian)</option>
            <option value="hi-IN">Hindi (हिन्दी)</option>
          </select>
        </div>
      </div>

      {/* Voice Recording Control Area */}
      <div className="my-8 flex flex-col items-center justify-center min-h-[220px]">
        {isRecording ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-30"></span>
              <button
                onClick={stopRecording}
                className="relative w-20 h-20 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center text-white shadow-xl shadow-rose-600/30 transition active:scale-95 cursor-pointer"
              >
                <Square className="w-7 h-7 fill-current" />
              </button>
            </div>

            {/* Recording Waves */}
            <div className="flex items-center space-x-1.5 h-8">
              {[40, 70, 95, 60, 85, 45, 90, 65, 30, 80, 50, 95, 70, 40].map(
                (h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}%`, animationDelay: `${i * 70}ms` }}
                    className="w-1.5 bg-rose-500 rounded-t-xs animate-wave"
                  />
                )
              )}
            </div>

            {/* Timer */}
            <div className="text-3xl font-mono font-bold text-white tracking-wider">
              {formatTime(recordingDuration)}
            </div>
            <p className="text-xs text-zinc-400">
              Listening in {selectedLanguage === "te-IN" ? "Telugu" : selectedLanguage === "hi-IN" ? "Hindi" : "Indian English"}...
            </p>
          </div>
        ) : audioUrl ? (
          <div className="flex flex-col items-center w-full max-w-md p-6 rounded-2xl bg-zinc-950 border border-zinc-800">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 text-emerald-400 flex items-center justify-center mb-3 shadow-inner">
              <Volume2 className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-zinc-200">Voice Recording Ready</span>
            <span className="text-xs text-zinc-400 mt-0.5">
              Duration: {formatTime(recordingDuration)}
            </span>

            <audio
              ref={audioElementRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            {/* Record Button */}
            <button
              onClick={startRecording}
              className="group relative w-24 h-24 rounded-full bg-zinc-900 border-2 border-zinc-700 hover:border-emerald-500/80 flex items-center justify-center text-zinc-100 hover:text-emerald-400 shadow-xl transition-all active:scale-95"
            >
              <div className="absolute inset-2 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center group-hover:border-emerald-500/30">
                <Mic className="w-8 h-8 text-zinc-300 group-hover:text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
            </button>
            <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider mt-5">
              Click to Speak
            </span>
            <span className="text-[11px] text-zinc-400 mt-1">
              Tap the microphone to describe the issue in your own words
            </span>
          </div>
        )}
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="mb-6 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3 pt-5 border-t border-zinc-800">
        {isRecording ? (
          <button
            onClick={stopRecording}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-md transition active:scale-[0.98]"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop Recording</span>
          </button>
        ) : audioUrl ? (
          <>
            <button
              onClick={discardRecording}
              disabled={isTranscribing}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-xs transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Record Again</span>
            </button>

            <button
              onClick={togglePlayback}
              disabled={isTranscribing}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 text-xs transition"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Listen</span>
                </>
              )}
            </button>

            <button
              onClick={handleSubmitRecording}
              disabled={isTranscribing}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-[0.98] disabled:opacity-50"
            >
              {isTranscribing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Transcribing with AI...</span>
                </>
              ) : (
                <>
                  <span>Transcribe Voice</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </>
        ) : null}
      </div>

      {/* Preset Test Samples for Fast Testing */}
      {!isRecording && !audioUrl && (
        <div className="mt-8 pt-5 border-t border-zinc-800/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-300 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Or Choose a Quick Sample Issue (No Microphone Needed):</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() =>
                handleUseSample(
                  "Classroom two lo projector switch on avvatledu, HDMI cable loose ga undi screen blue ga vastundi.",
                  "te-IN"
                )
              }
              disabled={isTranscribing}
              className="text-left p-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 hover:border-emerald-500/40 transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 group-hover:text-emerald-400 transition">
                  Telugu Projector Issue (te-IN)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  HARDWARE
                </span>
              </div>
              <span className="text-zinc-400 text-xs line-clamp-1 mt-1.5 block italic">
                "Classroom two lo projector switch on avvatledu..."
              </span>
            </button>

            <button
              onClick={() =>
                handleUseSample(
                  "The computer lab 3 internet connection has not been working since morning, students cannot submit their lab assignments.",
                  "en-IN"
                )
              }
              disabled={isTranscribing}
              className="text-left p-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 hover:border-emerald-500/40 transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 group-hover:text-emerald-400 transition">
                  Lab Network Outage (en-IN)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  NETWORK
                </span>
              </div>
              <span className="text-zinc-400 text-xs line-clamp-1 mt-1.5 block italic">
                "The computer lab 3 internet connection has not been working..."
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
