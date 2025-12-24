"use client";

import { ActionCard } from "@/components/dashboard/ActionCard";
import { MacroGauge } from "@/components/dashboard/MacroGauge";
import { MorningCheckIn } from "@/components/dashboard/MorningCheckIn";
import { StatusIndicator } from "@/components/dashboard/StatusIndicator";
import { WaterTracker } from "@/components/dashboard/WaterTracker";
import { useDailyLog } from "@/lib/queries/useDailyLog";
import { useUserSettings } from "@/lib/queries/useUserSettings";
import { AnimatePresence, motion } from "framer-motion";
import { Dumbbell, Settings, TrendingUp, Utensils } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface DashboardClientProps {
  initialDailyLog: any;
  initialSettings: any;
}

/**
 * DashboardClient - Client Component
 * 
 * NEW ARCHITECTURE:
 * - React Query ONLY (no Zustand)
 * - Server-side initialData for instant hydration
 * - localStorage persistence via React Query
 * - Simplified animations (no heavy blur)
 */
export function DashboardClient({ initialDailyLog, initialSettings }: DashboardClientProps) {
  // React Query hooks - hydrate with server data
  const { data: dailyLog, isLoading: logLoading } = useDailyLog(initialDailyLog);
  const { data: settings, isLoading: settingsLoading } = useUserSettings(initialSettings);

  // Morning check-in modal state
  const [showCheckIn, setShowCheckIn] = useState(false);

  // Check if user needs to check in (no weight or sleep)
  const needsCheckIn = useMemo(() => {
    if (!dailyLog) return false;
    return !dailyLog.weight || !dailyLog.sleepHours;
  }, [dailyLog]);

  // Show modal on mount if needed
  useEffect(() => {
    if (needsCheckIn && !logLoading) {
      setShowCheckIn(true);
    }
  }, [needsCheckIn, logLoading]);

  // Loading state - only on first load without cached data
  if ((logLoading && !initialDailyLog) || (settingsLoading && !initialSettings)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50/30 to-white flex items-center justify-center">
        <div className="text-zinc-400 font-[var(--font-inter)]">Loading...</div>
      </div>
    );
  }

  // Calculate smart status - Time-aware thresholds
  const proteinProgress = dailyLog ? (dailyLog.proteinTotal / (settings?.proteinTarget ?? 140)) * 100 : 0;
  const waterProgress = dailyLog ? (dailyLog.waterTotal / (settings?.waterTarget ?? 4000)) * 100 : 0;
  
  // Calculate expected progress based on time of day
  const now = new Date();
  const currentHour = now.getHours();
  const minutesPastHour = now.getMinutes();
  
  // Calculate hours elapsed since 6 AM
  const startHour = 6;
  const endHour = 22;
  const totalActiveHours = endHour - startHour;
  
  let hoursElapsed = 0;
  if (currentHour >= startHour && currentHour < endHour) {
    hoursElapsed = (currentHour - startHour) + (minutesPastHour / 60);
  } else if (currentHour >= endHour) {
    hoursElapsed = totalActiveHours;
  }
  
  const expectedProgress = (hoursElapsed / totalActiveHours) * 100;
  const minAcceptableProgress = Math.max(0, expectedProgress - 20);
  const beastModeThreshold = expectedProgress + 20;
  
  // Calculate smart status
  const calculateSmartStatus = () => {
    const proteinBehind = proteinProgress < minAcceptableProgress;
    const waterBehind = waterProgress < minAcceptableProgress;
    const proteinAhead = proteinProgress > beastModeThreshold;
    const waterAhead = waterProgress > beastModeThreshold;
    
    const isMorning = currentHour >= 6 && currentHour < 12;
    const isAfternoon = currentHour >= 12 && currentHour < 18;
    const isEvening = currentHour >= 18 && currentHour < 22;
    
    if (proteinBehind && waterBehind) {
      let label = "Fuel Up";
      if (isAfternoon) label = "Catch Up";
      if (isEvening) label = "Last Call";
      return { status: "critical" as const, label };
    }
    
    if (proteinBehind) {
      let label = "Eat Now";
      if (isAfternoon) label = "Eat Food";
      if (isEvening) label = "Last Meal";
      return { status: "fuel" as const, label };
    }
    
    if (waterBehind) {
      let label = "Hydrate";
      if (isAfternoon) label = "Drink Water";
      if (isEvening) label = "Finish H2O";
      return { status: "hydrate" as const, label };
    }
    
    if (proteinAhead || waterAhead) {
      return { status: "beast-mode" as const, label: "Beast Mode" };
    }
    
    return { status: "on-track" as const, label: "On Track" };
  };
  
  const smartStatus = calculateSmartStatus();
  const systemMode = (dailyLog?.sleepHours || 0) < 6 ? "saver" : "optimized";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12 max-w-md mx-auto relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50/30 to-white">
      
      {/* Simplified Background Elements - No heavy blur */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-200/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-amber-200/20 to-transparent rounded-full translate-y-1/2 -translate-x-1/3" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 flex flex-col items-center w-full h-full relative z-10"
      >
        {/* Settings Button - Fixed Top Right */}
        <Link href="/settings">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 15 }}
            whileTap={{ scale: 0.95 }}
            className="absolute top-4 right-0 p-3 rounded-2xl bg-white/60 backdrop-blur-md hover:bg-white/80 transition-all z-20 shadow-lg shadow-orange-100/50 border border-white/50"
          >
            <Settings size={20} className="text-zinc-600" />
          </motion.div>
        </Link>

        {/* Header */}
        <div className="w-full flex flex-col z-10 mb-6 mt-4">
          {/* Title Row */}
          <div className="flex items-center justify-between w-full pr-14">
            <div>
              <h1 className="text-5xl font-bold uppercase tracking-tighter text-zinc-900 font-[var(--font-teko)] whitespace-nowrap">
                Body OS
              </h1>
              <div className="h-1 w-16 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full mt-1" />
            </div>
          </div>
          
          {/* Recalibrate Button + Status Row */}
          <div className="flex items-center justify-between mt-4">
            <motion.button
              onClick={() => setShowCheckIn(true)}
              whileHover={{ x: 5 }}
              className="text-xs text-orange-500/70 font-semibold tracking-widest uppercase hover:text-orange-600 transition-colors flex items-center gap-1.5"
            >
              <span className="text-base">↻</span>
              Recalibrate
            </motion.button>
            
            <StatusIndicator 
              status={smartStatus.status} 
              label={smartStatus.label}
            />
          </div>
        </div>

        {/* Core Vitals */}
        <div className="flex-1 flex flex-col items-center justify-center w-full z-10">
          {/* Macro Gauge with subtle orange glow */}
          <div className="relative">
            {/* Subtle orange radial gradient background */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-80 h-80 rounded-full bg-gradient-radial from-orange-100/40 via-orange-50/20 to-transparent" />
            </div>
            
            {/* Gauge on top */}
            <div className="relative z-10">
              <MacroGauge 
                data={{
                  protein: { 
                    current: dailyLog?.proteinTotal || 0, 
                    target: settings?.proteinTarget ?? 140
                  },
                  carbs: { 
                    current: dailyLog?.carbsTotal || 0, 
                    target: settings?.carbsTarget ?? 200
                  },
                  fats: { 
                    current: dailyLog?.fatsTotal || 0, 
                    target: settings?.fatsTarget ?? 60
                  },
                  calories: { 
                    current: dailyLog?.caloriesTotal || 0, 
                    target: settings?.caloriesTarget ?? 2000
                  },
                }}
              />
            </div>
          </div>
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mt-8 w-full px-4">
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className={`rounded-3xl p-6 flex flex-col items-start backdrop-blur-md border transition-all ${
                systemMode === 'saver' 
                  ? 'bg-red-50/80 border-red-200/50 shadow-lg shadow-red-100/30' 
                  : 'bg-white/70 border-white/50 shadow-lg shadow-orange-100/30'
              }`}
            >
              <span className={`${systemMode === 'saver' ? 'text-red-500' : 'text-orange-500/70'} font-bold text-xs uppercase tracking-widest mb-2`}>Weight</span>
              <span className={`text-4xl font-bold font-[var(--font-teko)] ${systemMode === 'saver' ? 'text-red-600' : 'text-zinc-900'}`}>
                {dailyLog?.weight || 0}<span className="text-lg text-zinc-400/60 ml-1">kg</span>
              </span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className={`rounded-3xl p-6 flex flex-col items-start backdrop-blur-md border transition-all ${
                systemMode === 'saver' 
                  ? 'bg-red-50/80 border-red-200/50 shadow-lg shadow-red-100/30' 
                  : 'bg-white/70 border-white/50 shadow-lg shadow-orange-100/30'
              }`}
            >
              <span className={`${systemMode === 'saver' ? 'text-red-500' : 'text-orange-500/70'} font-bold text-xs uppercase tracking-widest mb-2`}>Sleep</span>
              <span className={`text-4xl font-bold font-[var(--font-teko)] ${systemMode === 'saver' ? 'text-red-600' : 'text-zinc-900'}`}>
                {dailyLog?.sleepHours || 0}<span className="text-lg text-zinc-400/60 ml-1">h</span>
              </span>
            </motion.div>
          </div>

          {systemMode === "saver" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 w-full mx-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 p-4 flex items-center gap-3 shadow-lg shadow-red-200/50"
            >
              <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
              <p className="text-white font-bold text-sm uppercase tracking-wide">Recovery Mode Active</p>
            </motion.div>
          )}

          {/* Water Tracker */}
          <div className="w-full px-4 mt-6">
            <WaterTracker />
          </div>
        </div>

        {/* Action Grid */}
        <div className="w-full z-10 mt-8 mb-8 grid grid-cols-2 gap-4 px-4">
          <ActionCard
            label="Log Food"
            sublabel="Track Nutrition"
            icon={Utensils}
            color="text-orange-500"
            bgColor="bg-gradient-to-br from-white/80 to-orange-50/50"
            href="/nutrition"
            className="h-40 backdrop-blur-sm border-orange-100/50"
          />
          
          <ActionCard
            label="Workout"
            sublabel="Start Session"
            icon={Dumbbell}
            color="text-zinc-800"
            bgColor="bg-gradient-to-br from-white/80 to-zinc-50/50"
            href="/workout"
            className="h-40 backdrop-blur-sm border-zinc-100/50"
          />

          <ActionCard
            label="Progress"
            sublabel="View Stats & Trends"
            icon={TrendingUp}
            color="text-blue-500"
            href="/progress"
            className="col-span-2 h-24 backdrop-blur-sm"
            variant="wide"
            bgColor="bg-gradient-to-r from-blue-50/70 to-cyan-50/50"
          />
        </div>
      </motion.div>

      {/* Morning Check-In Modal */}
      <AnimatePresence>
        {showCheckIn && (
          <MorningCheckIn
            onComplete={() => setShowCheckIn(false)}
            onBack={() => setShowCheckIn(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
