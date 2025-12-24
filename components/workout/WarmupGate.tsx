"use client";

import { useToggleWarmup } from "@/lib/mutations/useToggleWarmup";
import { motion } from "framer-motion";
import { Check, Loader2, Unlock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

export function WarmupGate({ sessionId, warmupData, onUnlock }: WarmupGateProps) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [unlocking, setUnlocking] = useState(false);
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

    // TODO: Mark complete in background (fire-and-forget)
  };

  const allChecked = warmupData.checklist.every((w) => completed.has(w.id));

  return (
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
        {warmupData.checklist.map((warmup, index) => (
          <motion.button
            key={warmup.id}
            onClick={() => handleToggle(warmup.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            whileTap={{ scale: 0.98 }}
            className={`
              w-full p-4 rounded-2xl flex items-center justify-between 
              border-l-4 transition-all duration-200 shadow-sm
              ${
                completed.has(warmup.id)
                  ? "bg-emerald-50 border-l-emerald-500"
                  : "bg-emerald-50/50 border-l-emerald-300 hover:bg-emerald-50"
              }
            `}
          >
            <div className="text-left flex-1 pr-4">
              <span
                className={`
                text-base font-bold font-heading
                ${completed.has(warmup.id) ? "text-emerald-600" : "text-emerald-600"}
              `}
              >
                {warmup.name}
              </span>
              {warmup.description && (
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  {warmup.description}
                </p>
              )}
            </div>

            <div
              className={`
              h-8 w-8 rounded-full flex items-center justify-center transition-all flex-shrink-0
              ${
                completed.has(warmup.id)
                  ? "bg-emerald-500 shadow-md"
                  : "bg-white border-2 border-emerald-300"
              }
            `}
            >
              {completed.has(warmup.id) && (
                <Check size={16} className="text-white" strokeWidth={3} />
              )}
            </div>
          </motion.button>
        ))}
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
  );
}
