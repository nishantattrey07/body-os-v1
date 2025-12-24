"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const THEMES = {
  green: { bg: "bg-green-50", text: "text-green-600", iconBg: "bg-green-100" },
  red: { bg: "bg-red-50", text: "text-red-600", iconBg: "bg-red-100" },
  blue: { bg: "bg-blue-50", text: "text-blue-600", iconBg: "bg-blue-100" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", iconBg: "bg-amber-100" },
  cyan: { bg: "bg-cyan-50", text: "text-cyan-600", iconBg: "bg-cyan-100" },
};

interface TargetCardProps {
  label: string;
  unit: string;
  value: number;
  onChange: (value: number) => void;
  icon: LucideIcon;
  theme?: keyof typeof THEMES;
  className?: string;
}

/**
 * Target card component for nutritional settings
 * 
 * Features:
 * - Click to edit (inline input)
 * - Themed colors (icon, text)
 * - Clean focus state (no colored borders)
 * - Enter to save, Escape to cancel
 */
export function TargetCard({
  label,
  unit,
  value,
  onChange,
  icon: Icon,
  theme = "green",
  className,
}: TargetCardProps) {
  const t = THEMES[theme];
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    const num = parseFloat(localValue) || 0;
    onChange(num);
    setLocalValue(num.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    }
    if (e.key === "Escape") {
      setLocalValue(value.toString());
      setIsEditing(false);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`group bg-white rounded-3xl p-6 shadow-sm hover:shadow-md border border-zinc-100 transition-all duration-300 relative overflow-hidden ${className}`}
    >
      {/* Field Label & Icon */}
      <div className="flex items-start justify-between mb-4 relative z-10 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${t.iconBg}`}>
            <Icon className={`w-4 h-4 ${t.text}`} />
          </div>
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            {label}
          </label>
        </div>
      </div>

      {/* Value Control */}
      <div className="flex items-center justify-between relative z-10">
        <div
          className="flex items-baseline gap-1 w-full cursor-text hover:opacity-80 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            if (!isEditing) setIsEditing(true);
          }}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className={`w-full text-4xl font-bold font-[var(--font-teko)] ${t.text} tracking-tight bg-transparent border-none outline-none p-0 m-0 ring-0 focus:outline-none focus:ring-0 focus:border-none focus:shadow-none`}
            />
          ) : (
            <span className={`text-4xl font-bold font-[var(--font-teko)] ${t.text} tracking-tight`}>
              {value}
            </span>
          )}
          <span className="text-sm font-bold text-zinc-300 lowercase shrink-0">{unit}</span>
        </div>
      </div>
    </motion.div>
  );
}
