"use client";

import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface RoutineExercise {
  id: string;
  order: number;
  sets: number;
  reps: number | null;
  duration: number | null;
  restSeconds: number;
  Exercise: {
    id: string;
    name: string;
    category: string;
    trackingType: string;
  };
}

interface RoutineCardProps {
  routine: {
    id: string;
    name: string;
    description?: string | null;
    isSystem: boolean;
    RoutineExercise: RoutineExercise[];
  };
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * RoutineCard - Display individual routine with expand/collapse functionality
 * 
 * Features:
 * - Header with name, system badge, description
 * - Exercise count
 * - Expandable exercise list with details
 * - Edit/Delete buttons (user routines only)
 * - Smooth expand/collapse animation
 */
export function RoutineCard({ routine, onEdit, onDelete }: RoutineCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const exerciseCount = routine.RoutineExercise?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border-2 border-zinc-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-lg font-bold font-[var(--font-teko)] uppercase tracking-tight text-foreground">
                {routine.name}
              </h3>
              {routine.isSystem && (
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                  System
                </span>
              )}
            </div>
            {routine.description && (
              <p className="text-sm text-zinc-600 line-clamp-2">{routine.description}</p>
            )}
          </div>
        </div>

        {/* Exercise Count + View Button */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500 font-semibold">
            {exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
          >
            {isExpanded ? (
              <>
                Hide <ChevronUp size={16} />
              </>
            ) : (
              <>
                View <ChevronDown size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Exercise List */}
      {isExpanded && exerciseCount > 0 && (
        <div className="border-t border-zinc-100 bg-zinc-50/50 p-4 space-y-2">
          {routine.RoutineExercise.map((re, idx) => (
            <div key={re.id} className="flex items-center gap-3 text-sm">
              <span className="text-zinc-400 font-bold w-6">{idx + 1}.</span>
              <div className="flex-1">
                <span className="font-semibold text-zinc-900">{re.Exercise.name}</span>
                <span className="text-zinc-500 ml-2">
                  {re.Exercise.trackingType === "seconds"
                    ? `${re.duration ?? 60}s × ${re.sets}`
                    : `${re.sets}×${re.reps ?? 10}`
                  } • {re.restSeconds}s rest
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions (User Routines Only) */}
      {!routine.isSystem && (
        <div className="flex gap-2 p-4 border-t border-zinc-100">
          <Link
            href={`/routines/${routine.id}/build`}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 text-blue-700 rounded-xl font-semibold text-sm hover:bg-blue-100 transition-colors"
          >
            <Edit2 size={14} />
            Edit
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-red-50 text-red-700 rounded-xl font-semibold text-sm hover:bg-red-100 transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </motion.div>
  );
}
