"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const MAX_CHARS = 300;
const MIN_LOADING_MS = 5000;

const LOADING_STEPS = [
  "Analyzing your text...",
  "Selecting voice parameters...",
  "Synthesizing speech...",
  "Applying voice style...",
  "Almost ready...",
];

const VOICES = [
  { value: "alloy", label: "Alloy", desc: "Neutral & balanced" },
  { value: "echo", label: "Echo", desc: "Warm & conversational" },
  { value: "fable", label: "Fable", desc: "Expressive & dynamic" },
  { value: "onyx", label: "Onyx", desc: "Deep & authoritative" },
  { value: "nova", label: "Nova", desc: "Friendly & upbeat" },
  { value: "shimmer", label: "Shimmer", desc: "Clear & gentle" },
] as const;

type VoiceValue = (typeof VOICES)[number]["value"];

const SPEED_OPTIONS = [
  { value: 0.75, label: "0.75×" },
  { value: 1.0, label: "1×" },
  { value: 1.25, label: "1.25×" },
  { value: 1.5, label: "1.5×" },
];

const EXAMPLE_TEXTS = [
  "Welcome to RealtimeVoice. Experience the power of GPT Realtime 2 — the most intelligent speech model ever built.",
  "Hi! I'm your AI voice agent. I can help you book appointments, answer questions, or guide you through any process — all by voice.",
  "GPT Realtime 2 delivers GPT-5-class reasoning in every live conversation. Ask me anything.",
];

export default function VoicePlayground() {
  const [text, setText] = useState(EXAMPLE_TEXTS[0]);
  const [voice, setVoice] = useState<VoiceValue>("nova");
  const [speed, setSpeed] = useState(1.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isGenerating) {
      setLoadingStep(0);
      setLoadingProgress(0);
      const startTime = Date.now();
      loadingTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(95, (elapsed / MIN_LOADING_MS) * 100);
        setLoadingProgress(progress);
        setLoadingStep(Math.min(LOADING_STEPS.length - 1, Math.floor((elapsed / MIN_LOADING_MS) * LOADING_STEPS.length)));
      }, 80);
    } else {
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      setLoadingProgress(100);
    }
    return () => {
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
    };
  }, [isGenerating]);

  const handleGenerate = async () => {
    if (!text.trim()) return;

    setIsGenerating(true);
    setAudioUrl(null);
    setIsPlaying(false);

    try {
      const [res] = await Promise.all([
        fetch("/api/demo/gen-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim(), voice, speed }),
        }),
        new Promise((r) => setTimeout(r, MIN_LOADING_MS)),
      ]);

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json?.message ?? "Failed to generate audio");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      setTimeout(() => {
        audioRef.current?.play();
        setIsPlaying(true);
      }, 100);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate audio. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleExampleClick = (exText: string) => {
    setText(exText);
    setAudioUrl(null);
    setIsPlaying(false);
  };

  return (
    <section id="demo" className="py-16 md:py-24 bg-muted/30">
      <div className="container">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-10 text-center">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary mb-4">
              LIVE DEMO
            </span>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Try GPT Realtime 2 Voice — Free
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Type any text and hear it spoken by an AI voice powered by GPT Realtime 2. No sign-up required.
            </p>
          </div>

          {/* Main card */}
          <div className="rounded-2xl border bg-card shadow-sm p-6 md:p-8">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Left: input */}
              <div className="flex flex-col gap-6">
                {/* Text input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Your Text</label>
                    <span className="text-xs text-muted-foreground">
                      {text.length}/{MAX_CHARS}
                    </span>
                  </div>
                  <Textarea
                    placeholder="Type anything you want the AI to say..."
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
                    className="min-h-[140px] resize-none text-base"
                    disabled={isGenerating}
                  />
                </div>

                {/* Examples */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Quick examples
                  </label>
                  <div className="flex flex-col gap-1.5">
                    {EXAMPLE_TEXTS.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => handleExampleClick(ex)}
                        className="text-left text-xs text-muted-foreground hover:text-foreground truncate px-2 py-1 rounded hover:bg-muted transition-colors"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voice selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Voice</label>
                  <div className="grid grid-cols-3 gap-2">
                    {VOICES.map((v) => (
                      <button
                        key={v.value}
                        onClick={() => setVoice(v.value)}
                        disabled={isGenerating}
                        className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition-colors ${
                          voice === v.value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <span className="text-sm font-semibold">{v.label}</span>
                        <span className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                          {v.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Speed selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Speed</label>
                  <div className="flex gap-2">
                    {SPEED_OPTIONS.map((s) => (
                      <Button
                        key={s.value}
                        type="button"
                        variant={speed === s.value ? "default" : "outline"}
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => setSpeed(s.value)}
                        disabled={isGenerating}
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Generate button */}
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={isGenerating || !text.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Icon name="RiLoader4Line" className="mr-2 size-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Icon name="RiVoiceprintLine" className="mr-2 size-5" />
                      Generate Voice
                    </>
                  )}
                </Button>
              </div>

              {/* Right: audio player / loading / idle */}
              <div className="flex flex-col items-center justify-center min-h-[360px]">
                {isGenerating ? (
                  /* ── Loading state ── */
                  <div className="w-full flex flex-col items-center gap-6 px-4">
                    {/* Animated bars */}
                    <div className="flex items-end gap-1 h-20">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-2 rounded-full bg-primary"
                          style={{
                            animation: `voiceBar ${0.7 + (i % 5) * 0.12}s ease-in-out infinite alternate`,
                            animationDelay: `${i * 0.07}s`,
                            height: `${24 + Math.sin(i * 0.9) * 18}px`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Step label */}
                    <p className="text-sm font-medium text-primary animate-pulse">
                      {LOADING_STEPS[loadingStep]}
                    </p>

                    {/* Progress bar */}
                    <div className="w-full max-w-xs">
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-100"
                          style={{ width: `${loadingProgress}%` }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                        <span>Generating</span>
                        <span>{Math.round(loadingProgress)}%</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Powered by OpenAI TTS · GPT Realtime 2
                    </p>
                  </div>
                ) : audioUrl ? (
                  /* ── Audio ready ── */
                  <div className="w-full flex flex-col items-center gap-6">
                    <div className="flex items-end gap-1 h-16">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 rounded-full bg-primary"
                          style={{
                            height: `${20 + Math.sin(i * 0.8) * 18 + Math.cos(i * 1.2) * 12}px`,
                            opacity: isPlaying ? 1 : 0.35,
                            animation: isPlaying
                              ? `voiceBar ${0.7 + (i % 5) * 0.12}s ease-in-out infinite alternate`
                              : "none",
                            animationDelay: `${i * 0.06}s`,
                          }}
                        />
                      ))}
                    </div>

                    <button
                      onClick={handlePlayPause}
                      className="flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-95"
                    >
                      <Icon
                        name={isPlaying ? "RiPauseFill" : "RiPlayFill"}
                        className="size-8"
                      />
                    </button>

                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onEnded={() => setIsPlaying(false)}
                      onPause={() => setIsPlaying(false)}
                      onPlay={() => setIsPlaying(true)}
                      className="hidden"
                    />

                    <p className="text-sm text-muted-foreground">
                      {isPlaying ? "Playing..." : "Click to replay"}
                    </p>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="mt-2"
                    >
                      <Icon name="RiRefreshLine" className="mr-1.5 size-4" />
                      Try Another Voice
                    </Button>
                  </div>
                ) : (
                  /* ── Idle state ── */
                  <div className="flex flex-col items-center gap-4 px-6 text-center">
                    <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
                      <Icon name="RiMicLine" className="size-10 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Ready to Speak</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Enter your text, choose a voice, and hit Generate.
                      </p>
                    </div>
                    <div className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Icon name="RiCheckLine" className="size-4 text-green-500 shrink-0" />
                        <span>Powered by GPT Realtime 2 (OpenAI TTS)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="RiCheckLine" className="size-4 text-green-500 shrink-0" />
                        <span>6 distinct AI voices</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="RiCheckLine" className="size-4 text-green-500 shrink-0" />
                        <span>No sign-up required for demo</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
