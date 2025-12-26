"use client";

import { useToggleWarmup } from "@/lib/mutations/useToggleWarmup";
import { motion } from "framer-motion";
import { Check, Loader2, Timer, Unlock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TimerModal } from "./TimerModal";

interface WarmupGateProps {
  sessionId: string;
  warmupData: {
    checklist: Array<{
      id: string;
      name: string;
      description?: string;
      order: number;
    }>;
    progress: Array<{
      id: string;
      warmupChecklistId: string;
      completed: boolean;
    }>;
  };
  onUnlock: () => void;
}

/**
 * Parse duration from description text
 * Examples: "30 seconds", "30-60 seconds", "1 minute", "30s"
 * Returns target seconds or null if not time-based
 */
function parseDuration(description?: string): number | null {
  if (!description) return null;
  
  const text = description.toLowerCase();
  
  // Match patterns like "30 seconds", "30-60 seconds", "1 minute"
  const secondsMatch = text.match(/(\d+)(?:-(\d+))?\s*(?:second|sec|s\b)/);
  const minuteMatch = text.match(/(\d+)\s*minute/);
  
  if (secondsMatch) {
    // If range (e.g., 30-60), use the max value
    return secondsMatch[2] ? parseInt(secondsMatch[2]) : parseInt(secondsMatch[1]);
  }
  
  if (minuteMatch) {
    return parseInt(minuteMatch[1]) * 60;
  }
  
  return null;
}

export function WarmupGate({ sessionId, warmupData, onUnlock }: WarmupGateProps) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [unlocking, setUnlocking] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [timerTarget, setTimerTarget] = useState<{ id: string; name: string; seconds: number } | null>(null);
  const toggleWarmup = useToggleWarmup();

  // Initialize completed set from progress data
  useEffect(() => {
    const completedIds = new Set(
      warmupData.progress
        .filter((log) => log.completed)
        .map((log) => log.warmupChecklistId)
    );
    setCompleted(completedIds);
  }, [warmupData]);

  const handleToggle = (warmupId: string) => {
    const isCurrentlyCompleted = completed.has(warmupId);
    const newState = !isCurrentlyCompleted;

    // OPTIMISTIC: Update UI immediately
    setCompleted((prev) => {
      const newSet = new Set(prev);
      if (newState) {
        newSet.add(warmupId);
      } else {
        newSet.delete(warmupId);
      }
      return newSet;
    });

    // FIRE-AND-FORGET: Sync to server in background
    toggleWarmup.mutate(
      {
        sessionId,
        warmupChecklistId: warmupId,
        completed: newState,
      },
      {
        onError: (error) => {
          console.error("Failed to toggle warmup item:", error);

          // ROLLBACK on error
          setCompleted((prev) => {
            const newSet = new Set(prev);
            if (newState) {
              newSet.delete(warmupId);
            } else {
              newSet.add(warmupId);
            }
            return newSet;
          });

          toast.error("Failed to save. Please try again.");
        },
      }
    );
  };

  const handleStartTimer = (warmup: { id: string; name: string; description?: string }) => {
    const duration = parseDuration(warmup.description);
    if (duration) {
      setTimerTarget({ id: warmup.id, name: warmup.name, seconds: duration });
      setTimerOpen(true);
    }
  };

  const handleTimerComplete = (actualSeconds: number) => {
    if (timerTarget && !completed.has(timerTarget.id)) {
      // Auto-mark as completed (visual feedback via checkbox)
      handleToggle(timerTarget.id);
    }
    setTimerOpen(false);
    setTimerTarget(null);
  };

  const handleTimerCancel = () => {
    setTimerOpen(false);
    setTimerTarget(null);
  };

  const handleUnlock = () => {
    // Check locally - no need for server check!
    const allChecked = warmupData.checklist.every((w) => completed.has(w.id));

    if (!allChecked) {
      toast.warning("Complete all warmup items first!");
      return;
    }

    setUnlocking(true);

    // OPTIMISTIC: Transition immediately
    setTimeout(() => onUnlock(), 300);
  };

  const allChecked = warmupData.checklist.every((w) => completed.has(w.id));

  return (
    <>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-white shadow-md"
          >
            <Unlock size={16} />
            <span className="text-sm font-bold uppercase tracking-wider">
              Ready to Train
            </span>
          </motion.div>

          <h1 className="text-4xl font-bold uppercase tracking-tighter text-zinc-900 font-heading leading-tight">
            Pre-Flight
            <br />
            <span className="text-emerald-500">Checks</span>
          </h1>
          <p className="text-zinc-400 text-sm">
            Complete all items to unlock exercises
          </p>
        </div>

        {/* Checklist */}
        <div className="space-y-3">
          {warmupData.checklist.map((warmup, index) => {
            const duration = parseDuration(warmup.description);
            const isTimeBased = duration !== null;
            const isCompleted = completed.has(warmup.id);

            return (
              <motion.div
                key={warmup.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`
                  w-full p-4 rounded-2xl flex items-center justify-between 
                  border-l-4 transition-all duration-200 shadow-sm
                  ${
                    isCompleted
                      ? "bg-emerald-50 border-l-emerald-500"
                      : "bg-emerald-50/50 border-l-emerald-300"
                  }
                `}
              >
                {/* Left side: Name & Description */}
                <button
                  onClick={() => handleToggle(warmup.id)}
                  className="text-left flex-1 pr-4 hover:opacity-80 transition-opacity"
                >
                  <span
                    className={`
                    text-base font-bold font-heading
                    ${isCompleted ? "text-emerald-600" : "text-emerald-600"}
                  `}
                  >
                    {warmup.name}
                  </span>
                  {warmup.description && (
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      {warmup.description}
                    </p>
                  )}
                </button>

                {/* Right side: Timer button + Checkbox */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Timer button for time-based warmups */}
                  {isTimeBased && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartTimer(warmup);
                      }}
                      className={`
                        h-8 px-3 rounded-full flex items-center gap-1.5 text-xs font-bold
                        transition-all duration-200
                        ${
                          isCompleted
                            ? "bg-emerald-200 text-emerald-700"
                            : "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/25"
                        }
                      `}
                    >
                      <Timer size={14} />
                      {duration}s
                    </motion.button>
                  )}

                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggle(warmup.id)}
                    className={`
                      h-8 w-8 rounded-full flex items-center justify-center transition-all
                      ${
                        isCompleted
                          ? "bg-emerald-500 shadow-md"
                          : "bg-white border-2 border-emerald-300 hover:border-emerald-400"
                      }
                    `}
                  >
                    {isCompleted && (
                      <Check size={16} className="text-white" strokeWidth={3} />
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Start Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleUnlock}
          disabled={unlocking || !allChecked}
          whileTap={{ scale: allChecked ? 0.98 : 1 }}
          className={`
            w-full h-14 rounded-2xl font-bold text-lg uppercase tracking-wider 
            flex items-center justify-center gap-2 transition-all
            ${
              allChecked
                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
            }
          `}
        >
          {unlocking ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Starting...
            </>
          ) : (
            <>
              <Unlock size={18} />
              Start Workout
            </>
          )}
        </motion.button>
      </div>

      {/* Timer Modal */}
      {timerTarget && (
        <TimerModal
          isOpen={timerOpen}
          targetSeconds={timerTarget.seconds}
          exerciseName={timerTarget.name}
          onComplete={handleTimerComplete}
          onCancel={handleTimerCancel}
        />
      )}
    </>
  );
}
