"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, Square, Timer, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface TimerModalProps {
  isOpen: boolean;
  targetSeconds: number;
  exerciseName: string;
  onComplete: (actualSeconds: number) => void;
  onCancel: () => void;
}

type TimerState = "setup" | "countdown" | "running" | "paused" | "complete";

export function TimerModal({
  isOpen,
  targetSeconds,
  exerciseName,
  onComplete,
  onCancel,
}: TimerModalProps) {
  const [state, setState] = useState<TimerState>("setup");
  const [selectedDelay, setSelectedDelay] = useState<number>(5);
  const [delayRemaining, setDelayRemaining] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setState("setup");
      setElapsedSeconds(0);
      setDelayRemaining(0);
    }
  }, [isOpen]);

  // Countdown delay timer
  useEffect(() => {
    if (state !== "countdown" || delayRemaining <= 0) return;

    const timer = setInterval(() => {
      setDelayRemaining((prev) => {
        if (prev <= 1) {
          setState("running");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state, delayRemaining]);

  // Main stopwatch (counts UP)
  useEffect(() => {
    if (state !== "running") return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [state]);

  const handleStart = useCallback(() => {
    if (selectedDelay > 0) {
      setDelayRemaining(selectedDelay);
      setState("countdown");
    } else {
      setState("running");
    }
  }, [selectedDelay]);

  const handlePauseResume = () => {
    setState((prev) => (prev === "running" ? "paused" : "running"));
  };

  const handleStop = () => {
    setState("complete");
  };

  const handleComplete = () => {
    onComplete(elapsedSeconds);
  };

  // Progress for visual feedback (based on target)
  const progress = Math.min(elapsedSeconds / targetSeconds, 1);
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference * (1 - progress);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-gradient-to-br from-zinc-900/95 via-zinc-900/98 to-black flex items-center justify-center"
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X size={24} className="text-white" />
        </button>

        <div className="flex flex-col items-center px-6 max-w-md w-full">
          {/* Exercise Name */}
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-white mb-2 text-center font-heading uppercase tracking-wide"
          >
            {exerciseName}
          </motion.h2>
          <p className="text-zinc-500 text-sm mb-8">Target: {targetSeconds}s</p>

          {/* Setup State - Delay Selection */}
          {state === "setup" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center w-full"
            >
              <p className="text-zinc-400 text-sm uppercase tracking-widest mb-3">
                Preparation Time
              </p>

              {/* Slider for delay */}
              <div className="w-full mb-6 px-4">
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={selectedDelay}
                  onChange={(e) => setSelectedDelay(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-xs text-zinc-500 mt-2">
                  <span>1s</span>
                  <span className="text-xl font-bold text-white">{selectedDelay}s</span>
                  <span>30s</span>
                </div>
              </div>

              {/* Timer preview */}
              <div className="relative mb-8">
                <svg width="240" height="240" className="transform -rotate-90">
                  <circle
                    cx="120"
                    cy="120"
                    r="100"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Timer size={32} className="text-zinc-500 mb-2" />
                  <span className="text-6xl font-bold text-white font-heading tabular-nums">
                    0
                  </span>
                  <span className="text-zinc-500 text-sm uppercase tracking-widest mt-1">
                    Stopwatch
                  </span>
                </div>
              </div>

              <button
                onClick={handleStart}
                className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-xl shadow-lg shadow-green-500/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-3"
              >
                <Play size={24} fill="white" />
                Start Timer
              </button>
            </motion.div>
          )}

          {/* Countdown Delay State */}
          {state === "countdown" && (
            <motion.div
              key="countdown"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center"
            >
              <p className="text-zinc-400 text-sm uppercase tracking-widest mb-8">
                Get Ready
              </p>
              <motion.div
                key={delayRemaining}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-9xl font-bold text-white font-heading"
              >
                {delayRemaining}
              </motion.div>
            </motion.div>
          )}

          {/* Running/Paused State */}
          {(state === "running" || state === "paused") && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center w-full"
            >
              {/* Progress Ring */}
              <div className="relative mb-8">
                <svg width="280" height="280" className="transform -rotate-90">
                  <circle
                    cx="140"
                    cy="140"
                    r="120"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="12"
                  />
                  <motion.circle
                    cx="140"
                    cy="140"
                    r="120"
                    fill="none"
                    stroke={
                      elapsedSeconds >= targetSeconds
                        ? "url(#successGradient)"
                        : "url(#gradient)"
                    }
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 0.3, ease: "linear" }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                    <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span
                    key={elapsedSeconds}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    className={`text-7xl font-bold font-heading tabular-nums ${
                      elapsedSeconds >= targetSeconds ? "text-green-400" : "text-white"
                    }`}
                  >
                    {formatTime(elapsedSeconds)}
                  </motion.span>
                  <span className="text-zinc-400 text-sm uppercase tracking-widest mt-2">
                    {state === "paused" ? "Paused" : elapsedSeconds >= targetSeconds ? "Target Reached!" : "Recording"}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-4 w-full">
                <button
                  onClick={handlePauseResume}
                  className={`flex-1 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                    state === "paused"
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {state === "paused" ? <Play size={24} /> : <Pause size={24} />}
                  {state === "paused" ? "Resume" : "Pause"}
                </button>
                <button
                  onClick={handleStop}
                  className="flex-1 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                >
                  <Square size={20} fill="white" />
                  Stop
                </button>
              </div>
            </motion.div>
          )}

          {/* Complete State */}
          {state === "complete" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center w-full"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className={`w-28 h-28 rounded-full flex items-center justify-center mb-6 shadow-lg ${
                  elapsedSeconds >= targetSeconds
                    ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/30"
                    : "bg-gradient-to-br from-orange-500 to-red-500 shadow-orange-500/30"
                }`}
              >
                <span className="text-4xl">
                  {elapsedSeconds >= targetSeconds ? "🎉" : "💪"}
                </span>
              </motion.div>

              <p className="text-zinc-400 text-sm uppercase tracking-widest mb-2">
                {elapsedSeconds >= targetSeconds ? "Target Achieved!" : "Good Effort!"}
              </p>
              <span className="text-5xl font-bold text-white font-heading mb-2">
                {formatTime(elapsedSeconds)}
              </span>
              <p className="text-zinc-500 text-sm mb-8">
                Target was {targetSeconds}s
              </p>

              <button
                onClick={handleComplete}
                className="w-full py-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold text-xl shadow-lg shadow-blue-500/30"
              >
                Log {elapsedSeconds}s →
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
