"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface ExitConfirmationModalProps {
  onContinue: () => void;
  onPause: () => void;
}

export function ExitConfirmationModal({
  onContinue,
  onPause,
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
        className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden p-8 text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center mb-2 shadow-inner">
            <AlertTriangle className="text-orange-500" size={32} />
          </div>
        </div>

        <h2 className="text-4xl font-bold uppercase tracking-tighter font-heading text-zinc-800 mb-3">
          Pause Session?
        </h2>

        <p className="text-zinc-500 font-medium leading-relaxed mb-8 px-2 font-sans">
          Your progress is automatically saved. You can resume this workout exactly where you left off later.
        </p>

        <div className="space-y-3">
          <motion.button
            onClick={onContinue}
            whileTap={{ scale: 0.98 }}
            className="w-full text-xl py-5 shadow-lg shadow-zinc-200 bg-zinc-800 hover:bg-zinc-900 text-white border-none font-bold uppercase tracking-tight rounded-2xl transition-colors"
          >
            KEEP TRAINING
          </motion.button>

          <button
            onClick={onPause}
            className="w-full py-4 text-zinc-400 font-bold uppercase tracking-wider text-sm hover:text-red-500 transition-colors font-heading cursor-pointer"
          >
            Exit to Menu
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
