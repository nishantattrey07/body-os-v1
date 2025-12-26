"use client";

import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { useState } from "react";

interface MacroData {
  protein: { current: number; target: number };
  carbs: { current: number; target: number };
  fats: { current: number; target: number };
  fiber: { current: number; target: number };
  calories: { current: number; target: number };
}

export function MacroGauge({ data }: { data: MacroData }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const macros = [
    { label: "Daily Protein", unit: "g", color: "var(--energy)", ...data.protein },
    { label: "Daily Carbs", unit: "g", color: "#3b82f6", ...data.carbs },
    { label: "Daily Fats", unit: "g", color: "#f59e0b", ...data.fats },
    { label: "Daily Fiber", unit: "g", color: "#10b981", ...data.fiber },
    { label: "Daily Calories", unit: "kcal", color: "#ef4444", ...data.calories },
  ];

  const swipeNext = () => setCurrentIndex((i) => (i + 1) % macros.length);
  const swipePrev = () => setCurrentIndex((i) => (i - 1 + macros.length) % macros.length);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      swipeNext();
    } else if (info.offset.x > swipeThreshold) {
      swipePrev();
    }
  };

  const current = macros[currentIndex];
  const percentage = Math.min(100, Math.max(0, (current.current / current.target) * 100));
  
  // Circle calculations
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine if over target (for color change)
  const isOver = current.current > current.target;

  return (
    <div className="relative flex h-72 w-72 flex-col items-center justify-center">
      {/* Background Circle */}
      <svg className="absolute h-full w-full rotate-[-90deg]" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#e5e5e5"
          strokeWidth="12"
          className="opacity-50"
        />
        {/* Progress Circle */}
        <AnimatePresence mode="wait">
          <motion.circle
            key={currentIndex}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={isOver ? "#ef4444" : current.color}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeLinecap="round"
          />
        </AnimatePresence>
      </svg>

      {/* Center Content - Swipeable */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="z-10 flex flex-col items-center cursor-grab active:cursor-grabbing"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center"
          >
            {/* Value Display */}
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-baseline">
                <span className="text-7xl font-bold text-foreground font-[var(--font-teko)]">
                  {Math.round(current.current)}
                </span>
                <span className="text-2xl font-medium text-zinc-500 font-[var(--font-teko)] ml-1">
                  {current.unit}
                </span>
              </div>
              <span className="text-xl text-zinc-400 font-[var(--font-teko)] -mt-1 opacity-60">
                / {current.target} {current.unit}
              </span>
            </div>

            {/* Label */}
            <span className="text-lg uppercase tracking-wider text-secondary font-[var(--font-teko)] mt-1">
              {current.label}
            </span>

            {/* Over Target Warning */}
            {isOver && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-2 px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full uppercase tracking-wide"
              >
                Over Target
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Decorative inner ring */}
      <div className="absolute inset-4 rounded-full border-2 border-zinc-100/50 pointer-events-none" />

      {/* Swipe Indicators */}
      <div className="absolute bottom-8 flex justify-center gap-2">
        {macros.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-2 w-2 rounded-full transition-all ${
              i === currentIndex ? 'bg-primary w-4' : 'bg-zinc-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
