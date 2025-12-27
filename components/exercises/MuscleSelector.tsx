"use client";

import { MuscleGroup } from "@/lib/queries/useMuscleGroups";
import { useMemo } from "react";

interface MuscleSelectorProps {
  muscles: MuscleGroup[];
  selected: string[];
  onChange: (ids: string[]) => void;
  groupByRegion?: boolean;
}

/**
 * MuscleSelector - Multi-select for muscle groups
 * Groups by major region for easy browsing
 */
export function MuscleSelector({ muscles, selected, onChange, groupByRegion = true }: MuscleSelectorProps) {
  // Group muscles by region
  const groupedMuscles = useMemo(() => {
    if (!groupByRegion) {
      return { All: muscles };
    }

    return muscles.reduce((acc, muscle) => {
      const region = muscle.majorRegion;
      if (!acc[region]) {
        acc[region] = [];
      }
      acc[region].push(muscle);
      return acc;
    }, {} as Record<string, MuscleGroup[]>);
  }, [muscles, groupByRegion]);

  const toggleMuscle = (muscleId: string) => {
    if (selected.includes(muscleId)) {
      onChange(selected.filter(id => id !== muscleId));
    } else {
      onChange([...selected, muscleId]);
    }
  };

  return (
    <div className="space-y-4 max-h-64 overflow-y-auto">
      {Object.entries(groupedMuscles).map(([region, regionMuscles]) => (
        <div key={region}>
          {/* Region Header */}
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
            {region}
          </h4>

          {/* Muscle Chips */}
          <div className="flex flex-wrap gap-2">
            {regionMuscles.map((muscle) => (
              <button
                key={muscle.id}
                type="button"
                onClick={() => toggleMuscle(muscle.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold text-sm transition-all ${
                  selected.includes(muscle.id)
                    ? "bg-orange-500 text-white shadow-md"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {muscle.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
