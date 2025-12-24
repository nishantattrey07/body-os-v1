"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Pause, X } from "lucide-react";

interface ExitConfirmationModalProps {
  onContinue: () => void;
  onPause: () => void;
  onAbandon: () => void;
}

export function ExitConfirmationModal({
  onContinue,
  onPause,
  onAbandon,
}: ExitConfirmationModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 text-center border-b border-zinc-100">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center shadow-inner">
              <AlertTriangle className="text-orange-500" size={28} />
            </div>
          </div>

          <h2 className="text-3xl font-bold uppercase tracking-tight font-heading text-zinc-800 mb-2">
            Exit Workout?
          </h2>

          <p className="text-zinc-500 font-medium leading-relaxed px-2">
            Your progress is saved. Choose how to proceed.
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 space-y-3">
          {/* Continue */}
          <button
            onClick={onContinue}
            className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-green-500/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} />
            Continue Workout
          </button>

          {/* Pause & Save */}
          <button
            onClick={onPause}
            className="w-full py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-2xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Pause size={18} />
            Pause & Save
          </button>

          {/* Abandon */}
          <button
            onClick={onAbandon}
            className="w-full py-3 text-red-500 font-semibold uppercase tracking-wider text-sm hover:text-red-600 transition-colors flex items-center justify-center gap-2"
          >
            <X size={16} />
            Abandon Workout
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
