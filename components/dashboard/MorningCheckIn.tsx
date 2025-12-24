"use client";

import { useUpdateDailyLog } from "@/lib/mutations/useUpdateDailyLog";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Moon, Scale, Sparkles } from "lucide-react";
import { useState } from "react";

interface MorningCheckInProps {
  onComplete: () => void;
  onBack?: () => void;
}

export function MorningCheckIn({ onComplete, onBack }: MorningCheckInProps) {
  const [weight, setWeight] = useState<string>("");
  const [sleep, setSleep] = useState<string>("");
  
  const updateDailyLog = useUpdateDailyLog();

  const handleSubmit = async () => {
    if (weight && sleep) {
      updateDailyLog.mutate(
        {
          weight: parseFloat(weight),
          sleepHours: parseFloat(sleep),
        },
        {
          onSuccess: () => {
            onComplete();
          },
        }
      );
    }
  };

  const isValid = weight && sleep;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#faf8f5] p-6"
    >
      <div className="flex flex-col items-center justify-center w-full h-full relative">
        {/* Back Button */}
        {onBack && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onBack}
            className="fixed top-6 left-6 p-3 rounded-2xl bg-white hover:bg-zinc-50 transition-all shadow-lg border border-zinc-200 z-50"
          >
            <ArrowLeft size={20} className="text-zinc-600" />
          </motion.button>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-xs relative"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 mb-4"
            >
              <Sparkles size={16} className="text-orange-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Morning Calibration
              </span>
            </motion.div>

            <h1 className="text-4xl font-bold uppercase tracking-tight text-zinc-900 font-[var(--font-teko)]">
              Initialize
            </h1>
            <p className="text-zinc-400 text-sm mt-2">
              Let&apos;s set your baseline for today
            </p>
          </div>

          {/* Input Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-6 shadow-xl shadow-orange-100/50 border border-orange-50 space-y-5"
          >
            {/* Weight Input */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2">
                <Scale size={14} className="text-orange-400" />
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Weight (kg)
                </label>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="84.0"
                  className="w-full rounded-2xl border-2 border-zinc-100 bg-zinc-50/50 p-5 text-center text-3xl font-bold text-zinc-800 placeholder-zinc-300 focus:border-zinc-100 focus:ring-0 focus:bg-white font-[var(--font-teko)] outline-none transition-all"
                />
              </div>
            </div>

            {/* Sleep Input */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-2">
                <Moon size={14} className="text-blue-400" />
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Sleep (hrs)
                </label>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  inputMode="decimal"
                  value={sleep}
                  onChange={(e) => setSleep(e.target.value)}
                  placeholder="7.0"
                  className="w-full rounded-2xl border-2 border-zinc-100 bg-zinc-50/50 p-5 text-center text-3xl font-bold text-zinc-800 placeholder-zinc-300 focus:border-zinc-100 focus:ring-0 focus:bg-white font-[var(--font-teko)] outline-none transition-all"
                />
              </div>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={handleSubmit}
            disabled={!isValid || updateDailyLog.isPending}
            whileTap={{ scale: 0.98 }}
            className={`
              w-full h-16 mt-6 rounded-2xl font-bold text-base uppercase tracking-wider
              flex items-center justify-center gap-2 transition-all font-[var(--font-teko)]
              ${
                isValid && !updateDailyLog.isPending
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40"
                  : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
              }
            `}
          >
            {updateDailyLog.isPending ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Initializing...
              </>
            ) : (
              <>Start Day</>
            )}
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
