"use client";

import { useLogWater } from "@/lib/mutations/useLogWater";
import { useDailyLog } from "@/lib/queries/useDailyLog";
import { useUserSettings } from "@/lib/queries/useUserSettings";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export function WaterTracker() {
  // React Query hooks - NEW architecture
  const { data: dailyLog } = useDailyLog();
  const { data: settings } = useUserSettings();
  const logWaterMutation = useLogWater();

  // Derived values with defaults
  const waterTotal = dailyLog?.waterTotal ?? 0;
  const waterTarget = settings?.waterTarget ?? 4000;

  const PER_TAP = 250; // 250ml per glass

  const handleTap = () => {
    // Optimistic update - instant UI feedback
    logWaterMutation.mutate(PER_TAP);
  };

  const progress = Math.min((waterTotal / waterTarget) * 100, 100);
  const glasses = Math.floor(waterTotal / PER_TAP);

  return (
    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-cyan-500/20 relative overflow-hidden group">
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-all duration-700" />

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <p className="text-xs opacity-80 uppercase tracking-widest font-semibold font-[var(--font-inter)] mb-1">
            Water Intake
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-5xl font-bold font-[var(--font-teko)] tracking-tight leading-none">
              {(waterTotal / 1000).toFixed(1)}
              <span className="text-3xl opacity-60 ml-1 font-[var(--font-inter)] font-medium">L</span>
            </p>
          </div>
          <p className="text-sm opacity-70 mt-1 font-medium">{glasses} glasses</p>
        </div>
        
        <div className="text-right">
          <p className="text-xs opacity-80 uppercase tracking-wider font-medium mb-1">Target</p>
          <p className="text-2xl font-bold font-[var(--font-teko)] tracking-wide">{(waterTarget / 1000).toFixed(1)}L</p>
        </div>
      </div>

      {/* Wave Progress Bar */}
      <div className="relative bg-black/20 rounded-full h-3 overflow-hidden mb-6 backdrop-blur-sm">
        <motion.div 
          className="bg-white h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
      </div>

      {/* Tap Button */}
      <motion.button
        onClick={handleTap}
        whileTap={{ scale: 0.95 }}
        className="w-full bg-white text-blue-600 rounded-2xl py-4 font-bold text-lg flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors shadow-sm font-[var(--font-teko)] tracking-wide uppercase"
      >
        <Plus className="w-5 h-5" />
        Add {PER_TAP}ml
      </motion.button>

      {/* Achievement */}
      {progress >= 100 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center bg-white/20 rounded-xl py-2 backdrop-blur-md"
        >
          <p className="text-sm font-bold tracking-wide">🎉 Daily goal achieved!</p>
        </motion.div>
      )}
    </div>
  );
}
