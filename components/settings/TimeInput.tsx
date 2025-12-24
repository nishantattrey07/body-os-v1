"use client";

import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";

interface TimeInputProps {
  value: number;
  max: number;
  onChange: (val: number) => void;
}

/**
 * Digital clock input component
 * 
 * Features:
 * - Arrow keys to increment/decrement
 * - Auto-pad with zeros (05 instead of 5)
 * - Dark theme for digital clock aesthetic
 */
export function TimeInput({ value, max, onChange }: TimeInputProps) {
  const [localValue, setLocalValue] = useState(value.toString().padStart(2, '0'));

  useEffect(() => {
    setLocalValue(value.toString().padStart(2, '0'));
  }, [value]);

  const handleBlur = () => {
    let val = parseInt(localValue);
    if (isNaN(val) || val < 0) val = 0;
    if (val > max) val = max;
    onChange(val);
    setLocalValue(val.toString().padStart(2, '0'));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      onChange(value >= max ? 0 : value + 1);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      onChange(value <= 0 ? max : value - 1);
    }
  };

  return (
    <div className="relative group w-20">
      {/* Up Arrow (hover hint) */}
      <div className="absolute -top-3 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <ChevronLeft className="w-3 h-3 text-white/20 rotate-90" />
      </div>

      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full text-center text-4xl font-bold font-[var(--font-teko)] text-white bg-transparent border-none outline-none p-0 selection:bg-white/20"
      />

      {/* Down Arrow (hover hint) */}
      <div className="absolute -bottom-3 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <ChevronLeft className="w-3 h-3 text-white/20 -rotate-90" />
      </div>
    </div>
  );
}
