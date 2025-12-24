"use client";

import { motion } from "framer-motion";
import { ArrowRight, Clock, Pause, Trash2 } from "lucide-react";

interface ResumeModalProps {
  session: {
    id: string;
    routine?: { name: string } | null;
    startedAt: Date | string;
    SessionExercise: Array<{
      completedAt: Date | null;
      skipped: boolean;
      Exercise: { name: string };
    }>;
  };
  onResume: () => void;
  onAbandon: () => void;
}

export function ResumeModal({ session, onResume, onAbandon }: ResumeModalProps) {
  const completedCount = session.SessionExercise.filter(
    (e) => e.completedAt || e.skipped
  ).length;
  const totalCount = session.SessionExercise.length;
  const currentExercise = session.SessionExercise.find(
    (e) => !e.completedAt && !e.skipped
  );
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const startedAt = new Date(session.startedAt);
  const now = new Date();
  const diffMs = now.getTime() - startedAt.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  let timeAgo = "";
  if (diffHours > 0) {
    timeAgo = `${diffHours}h ${diffMins % 60}m ago`;
  } else if (diffMins > 0) {
    timeAgo = `${diffMins} min ago`;
  } else {
    timeAgo = "Just now";
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 pb-5 text-center border-b border-zinc-100">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center justify-center w-14 h-14 bg-amber-50 rounded-2xl mb-4"
          >
            <Pause size={24} className="text-amber-500" fill="currentColor" />
          </motion.div>

          <h2 className="text-xl font-bold text-zinc-900 mb-1">
            Workout Paused
          </h2>
          <p className="text-sm text-zinc-400 flex items-center justify-center gap-1.5">
            <Clock size={13} />
            Started {timeAgo}
          </p>
        </div>

        {/* Workout Details */}
        <div className="p-5 space-y-4">
          {/* Routine */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
              Routine
            </p>
            <p className="text-lg font-semibold text-zinc-900">
              {session.routine?.name || "Custom Workout"}
            </p>
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Progress
              </p>
              <p className="text-sm font-semibold text-zinc-900">
                {completedCount} of {totalCount}
              </p>
            </div>
            <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className="h-full bg-gradient-to-r from-orange-400 to-orange-500"
              />
            </div>
          </div>

          {/* Current Exercise */}
          {currentExercise && (
            <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
              <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide mb-0.5">
                Up Next
              </p>
              <p className="text-sm font-bold text-orange-900">
                {currentExercise.Exercise.name}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-3 space-y-3">
          <button
            onClick={onResume}
            className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-green-500/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
          >
            Resume Workout
            <ArrowRight size={20} />
          </button>

          <button
            onClick={onAbandon}
            className="w-full py-3 text-red-500 font-semibold uppercase tracking-wider text-sm hover:text-red-600 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            Abandon & Start Fresh
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
