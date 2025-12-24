"use client";

import { TargetCard } from "@/components/settings/TargetCard";
import { TimeInput } from "@/components/settings/TimeInput";
import { useUpdateSettings } from "@/lib/mutations/useUpdateSettings";
import { useUserSettings } from "@/lib/queries/useUserSettings";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Droplets, Flame, LogOut, Utensils } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SettingsClientProps {
  initialSettings: any;
}

/**
 * SettingsClient - Main settings component
 * 
 * NEW ARCHITECTURE:
 * - React Query with server hydration (instant load)
 * - Local state for form (dirty detection)
 * - No blur backgrounds (clean premium design)
 */
export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const router = useRouter();
  const { data: settings } = useUserSettings(initialSettings);
  const updateSettings = useUpdateSettings();

  // Local form state
  const [targets, setTargets] = useState(initialSettings);
  const [initialTargets, setInitialTargets] = useState(initialSettings);

  const isDirty = JSON.stringify(targets) !== JSON.stringify(initialTargets);

  const handleSave = async () => {
    if (!isDirty) return;
    
    updateSettings.mutate(targets, {
      onSuccess: () => {
        setInitialTargets(targets);
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-zinc-50 to-blue-50/20 pb-12">
      {/* Header - Sticky */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100 mb-8">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-3 rounded-full bg-white hover:bg-zinc-50 border border-zinc-100 shadow-sm transition-all active:scale-95 group"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-600 group-hover:text-zinc-900 transition-colors" />
          </button>

          <div className="flex flex-col">
            <h1 className="text-4xl font-bold uppercase tracking-tighter text-zinc-900 font-[var(--font-teko)] leading-none">
              SYSTEM SETTINGS
            </h1>
            <AnimatePresence>
              {isDirty && (
                <motion.span
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs font-bold text-orange-500 uppercase tracking-widest mt-1"
                >
                  Unsaved Changes
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-10">
          {/* Section: Nutritional Targets */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px bg-zinc-200 flex-1" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                Nutritional Configuration
              </h2>
              <div className="h-px bg-zinc-200 flex-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TargetCard
                label="Daily Protein"
                unit="g"
                value={targets.proteinTarget}
                onChange={(v) => setTargets({ ...targets, proteinTarget: v })}
                icon={Utensils}
                theme="green"
              />
              <TargetCard
                label="Daily Calories"
                unit="kcal"
                value={targets.caloriesTarget}
                onChange={(v) => setTargets({ ...targets, caloriesTarget: v })}
                icon={Flame}
                theme="red"
              />
              <TargetCard
                label="Daily Carbs"
                unit="g"
                value={targets.carbsTarget}
                onChange={(v) => setTargets({ ...targets, carbsTarget: v })}
                icon={Utensils}
                theme="blue"
              />
              <TargetCard
                label="Daily Fats"
                unit="g"
                value={targets.fatsTarget}
                onChange={(v) => setTargets({ ...targets, fatsTarget: v })}
                icon={Utensils}
                theme="amber"
              />
              <TargetCard
                label="Water Intake"
                unit="ml"
                value={targets.waterTarget}
                onChange={(v) => setTargets({ ...targets, waterTarget: v })}
                icon={Droplets}
                theme="cyan"
                className="md:col-span-2"
              />
            </div>
          </section>

          {/* Section: System Timing */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px bg-zinc-200 flex-1" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                System Timing
              </h2>
              <div className="h-px bg-zinc-200 flex-1" />
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-zinc-200/50 border border-zinc-100">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="max-w-md">
                  <h3 className="text-2xl font-bold font-[var(--font-teko)] uppercase text-zinc-900 mb-2">
                    Day Reset Protocol
                  </h3>
                  <p className="text-zinc-500 leading-relaxed text-sm">
                    This defines when your "day" officially ends. Logs before this time are attributed to the previous calendar day.
                  </p>

                  <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-purple-600 bg-purple-50 px-3 py-2 rounded-lg w-fit">
                    <Check className="w-3 h-3" />
                    <span>Recommended: 05:30 AM</span>
                  </div>
                </div>

                {/* Digital Clock Widget */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 bg-zinc-900 p-4 rounded-2xl shadow-lg border border-zinc-800">
                    <TimeInput
                      value={targets.dayCutoffHour}
                      max={23}
                      onChange={(v) => setTargets({ ...targets, dayCutoffHour: v })}
                    />
                    <div className="flex flex-col gap-2 opacity-50">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-75" />
                    </div>
                    <TimeInput
                      value={targets.dayCutoffMinute}
                      max={59}
                      onChange={(v) => setTargets({ ...targets, dayCutoffMinute: v })}
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    24-Hour Format
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-sm border border-zinc-100 sticky top-32">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isDirty ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
              {isDirty ? 'Unsaved Changes' : 'Active Session'}
            </h2>

            {/* Save Button */}
            <motion.button
              whileHover={{ scale: isDirty ? 1.02 : 1 }}
              whileTap={{ scale: isDirty ? 0.98 : 1 }}
              onClick={handleSave}
              disabled={!isDirty || updateSettings.isPending}
              className={`w-full mb-3 py-4 rounded-xl font-bold uppercase tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 overflow-hidden relative
                ${(isDirty && !updateSettings.isPending)
                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-500/20 hover:shadow-green-500/30 cursor-pointer"
                  : "bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none"}`}
            >
              <div className="relative flex items-center justify-center w-full h-6">
                <AnimatePresence mode="popLayout">
                  {!updateSettings.isPending ? (
                    <motion.div
                      key="text"
                      className="flex items-center gap-[1px]"
                      exit={{ opacity: 0 }}
                    >
                      {"SAVE CONFIGURATION".split("").map((char, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 1, x: 0 }}
                          exit={{
                            opacity: 0,
                            x: 20,
                            transition: { duration: 0.1, delay: i * 0.03 }
                          }}
                          className="inline-block"
                        >
                          {char === " " ? "\u00A0" : char}
                        </motion.span>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ x: -50, opacity: 0 }}
                      animate={{
                        x: 0,
                        opacity: 1,
                        transition: { delay: 0.4, type: "spring", stiffness: 200, damping: 20 }
                      }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Check className="w-8 h-8 stroke-[3]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>

            {/* Logout Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full py-4 px-6 rounded-xl bg-red-50 text-red-600 font-bold uppercase tracking-wide flex items-center justify-center gap-2 hover:bg-red-100 transition-colors font-[var(--font-teko)]"
            >
              <LogOut className="w-4 h-4" />
              System Logout
            </motion.button>

            {/* Version Footer */}
            <div className="mt-8 pt-6 border-t border-zinc-100/50 text-center">
              <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-[0.2em]">
                Body OS v1.0.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
