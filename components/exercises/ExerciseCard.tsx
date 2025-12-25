"use client";

import { motion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  category: string;
  trackingType: string;
  defaultSets: number;
  defaultReps: number | null;
  defaultDuration: number | null;
  description: string | null;
  isSystem: boolean;
}

interface ExerciseCardProps {
  exercise: Exercise;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * ExerciseCard - Display card for exercises with edit/delete actions
 */
export function ExerciseCard({ exercise, onEdit, onDelete }: ExerciseCardProps) {
  const isTimeBased = exercise.trackingType === "seconds";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border-2 border-zinc-100 p-4 relative"
    >
      {/* Exercise Name with System Badge INLINE */}
      <div className="mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-lg font-bold font-heading text-zinc-900">
            {exercise.name}
          </h3>
          {exercise.isSystem && (
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
              System
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-500 uppercase tracking-wider font-semibold">
          {exercise.category}
        </p>
      </div>

      {/* Sets & Reps/Seconds */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1 text-sm">
          <span className="font-bold text-zinc-900">{exercise.defaultSets}</span>
          <span className="text-zinc-500">sets</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <span className="font-bold text-zinc-900">
            {isTimeBased ? (exercise.defaultDuration || 60) : (exercise.defaultReps || 10)}
          </span>
          <span className="text-zinc-500">{isTimeBased ? "sec" : "reps"}</span>
        </div>
      </div>

      {/* Action Buttons (only for user exercises) */}
      {!exercise.isSystem && (
        <div className="flex gap-2 pt-2 border-t border-zinc-100">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 text-blue-700 rounded-xl font-semibold text-sm hover:bg-blue-100 transition-colors"
          >
            <Pencil size={14} />
            Edit
          </button>
          <button
            onClick={onDelete}
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
