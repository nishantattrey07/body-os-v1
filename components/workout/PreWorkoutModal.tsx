"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Activity, Brain, Coffee, Utensils, X, Zap } from "lucide-react";
import { useState } from "react";

interface PreWorkoutModalProps {
  routineName: string;
  onStart: (data: PreWorkoutData) => void;
  onCancel: () => void;
}

export interface PreWorkoutData {
  preWorkoutEnergy: number;
  stressLevel: number;
  soreness: number;
  fastedWorkout: boolean;
  caffeineIntake?: number;
}

export function PreWorkoutModal({ routineName, onStart, onCancel }: PreWorkoutModalProps) {
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(2);
  const [soreness, setSoreness] = useState(2);
  const [fasted, setFasted] = useState(false);
  const [caffeine, setCaffeine] = useState(0);

  const handleSubmit = () => {
    onStart({
      preWorkoutEnergy: energy,
      stressLevel: stress,
      soreness,
      fastedWorkout: fasted,
      caffeineIntake: caffeine || undefined,
    });
  };

  // Color system matching your app's palette
  const getRatingColor = (type: 'energy' | 'stress' | 'soreness', value: number) => {
    if (type === 'energy') {
      // Energy: Low = bad (red), High = good (green)
      const colors = {
        1: "bg-red-500 text-white",
        2: "bg-orange-400 text-white",
        3: "bg-amber-400 text-zinc-900",
        4: "bg-lime-400 text-zinc-900",
        5: "bg-green-500 text-white",
      };
      return colors[value as keyof typeof colors];
    }
    // Stress & Soreness: Low = good (teal), High = bad (red)
    const colors = {
      1: "bg-teal-500 text-white",
      2: "bg-teal-400 text-white",
      3: "bg-amber-400 text-zinc-900",
      4: "bg-orange-400 text-white",
      5: "bg-red-500 text-white",
    };
    return colors[value as keyof typeof colors];
  };

  const getTextColor = (type: 'energy' | 'stress' | 'soreness', value: number) => {
    if (type === 'energy') {
      if (value <= 2) return 'text-red-500';
      if (value === 3) return 'text-amber-500';
      return 'text-green-500';
    }
    if (value <= 2) return 'text-teal-500';
    if (value === 3) return 'text-amber-500';
    return 'text-red-500';
  };

  const RatingScale = ({ 
    value, 
    onChange, 
    icon: Icon, 
    label,
    type,
    id
  }: { 
    value: number; 
    onChange: (v: number) => void; 
    icon: any; 
    label: string;
    type: 'energy' | 'stress' | 'soreness';
    id: string;
  }) => {
    const activeColor = getRatingColor(type, value);
    const textColor = getTextColor(type, value);

    return (
      <div className="bg-white rounded-3xl border border-zinc-200 p-5 shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-xl", `${activeColor.split(' ')[0]}/10`)}>
              <Icon size={20} className={textColor} strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold uppercase tracking-wide text-zinc-700">
              {label}
            </span>
          </div>
          <span className={cn("text-lg font-black", textColor)}>
            {value}/5
          </span>
        </div>

        {/* Rating Buttons */}
        <div className="flex bg-zinc-50 p-1.5 rounded-2xl gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={cn(
                "flex-1 h-12 rounded-xl font-bold text-base transition-all duration-200 relative flex items-center justify-center",
                value === n 
                  ? (activeColor.includes('text-white') ? "text-white" : "text-zinc-900")
                  : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
              )}
            >
              {value === n && (
                <motion.div
                  {...(id === 'energy' ? { layoutId: `rating-${id}` } : {})}
                  className={cn("absolute inset-0 rounded-xl shadow-md", activeColor.split(' ')[0])}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                />
              )}
              <span className="relative z-10">{n}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-gradient-to-b from-orange-100 to-white rounded-[2rem] w-full max-w-md shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-5 right-5 z-20 h-10 w-10 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        {/* Header */}
        <div className="pt-10 pb-4 px-6 text-center">
          <h2 className="text-4xl font-bold uppercase tracking-tight font-heading text-zinc-900">
            Check In
          </h2>
          <div className="h-1 w-20 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full mx-auto mt-3" />
          <p className="text-zinc-400 font-medium text-sm tracking-wide mt-3 uppercase">
            {routineName}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 no-scrollbar">
          <RatingScale
            id="energy"
            type="energy"
            value={energy}
            onChange={setEnergy}
            icon={Zap}
            label="Energy"
          />

          <RatingScale
            id="stress"
            type="stress"
            value={stress}
            onChange={setStress}
            icon={Brain}
            label="Stress"
          />

          <RatingScale
            id="soreness"
            type="soreness"
            value={soreness}
            onChange={setSoreness}
            icon={Activity}
            label="Soreness"
          />

          {/* Context Row */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* Fasted Toggle */}
            <button
              onClick={() => setFasted(!fasted)}
              className={cn(
                "bg-white rounded-2xl border p-4 text-left transition-all h-28 flex flex-col justify-between",
                fasted 
                  ? "border-amber-300 bg-amber-50/50" 
                  : "border-zinc-100 hover:border-zinc-200"
              )}
            >
              <div className="flex items-center justify-between">
                <div className={cn(
                  "p-2 rounded-xl",
                  fasted ? "bg-amber-100 text-amber-600" : "bg-zinc-100 text-zinc-400"
                )}>
                  <Utensils size={18} strokeWidth={2.5} />
                </div>
                <div className={cn(
                  "h-5 w-5 rounded-full border-2 transition-all",
                  fasted ? "bg-amber-500 border-amber-500" : "border-zinc-300"
                )} />
              </div>
              <div>
                <p className={cn(
                  "font-bold text-sm uppercase tracking-wide",
                  fasted ? "text-amber-700" : "text-zinc-500"
                )}>
                  Fasted
                </p>
                <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                  {fasted ? "Empty stomach" : "Had food"}
                </p>
              </div>
            </button>

            {/* Caffeine Input */}
            <div className="bg-white rounded-2xl border border-zinc-100 p-4 h-28 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-zinc-100 text-zinc-400">
                  <Coffee size={18} strokeWidth={2.5} />
                </div>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={caffeine || ""}
                  onChange={(e) => setCaffeine(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-16 text-right font-black text-2xl text-zinc-800 placeholder-zinc-300 focus:outline-none bg-transparent"
                />
              </div>
              <div>
                <p className="font-bold text-sm uppercase tracking-wide text-zinc-500">
                  Caffeine
                </p>
                <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                  Milligrams
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 bg-white">
          <button
            onClick={handleSubmit}
            className="w-full py-5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xl font-bold uppercase tracking-wide rounded-2xl shadow-lg shadow-orange-500/25 transition-all active:scale-[0.98]"
          >
            Start Workout
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
