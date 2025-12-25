"use client";

import { useSaveRoutineExercises } from "@/lib/mutations/useSaveRoutineExercises";
import { useExercises, useRoutine } from "@/lib/queries/useRoutine";
import { DistanceUnit } from "@/lib/utils/distance";
import { motion, Reorder } from "framer-motion";
import { ArrowLeft, GripVertical, Link2, Link2Off, Plus, Save, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Exercise {
  id: string;
  name: string;
  category: string;
  trackingType: string;
  defaultSets: number;
  defaultReps: number | null;
  defaultDuration: number | null;
  tracksDistance?: boolean;
  defaultDistance?: number | null;
  defaultDistanceUnit?: string;
}

interface RoutineExercise {
  id: string;
  exerciseId: string;
  sets: number;
  reps: number | null;
  duration: number | null;
  weight: number | null;
  distance: number | null;  // Stored in meters in DB
  distanceUnit?: DistanceUnit; // Display unit (UI only, not saved to DB)
  restSeconds: number;
  supersetId?: string | null;  // Exercises with same ID are grouped
  Exercise: Exercise;
}

interface RoutineBuilderClientProps {
  routineId: string;
  initialRoutine: any;
  initialExercises: Exercise[];
}

/**
 * RoutineBuilderClient - Draft mode routine builder
 * 
 * ALL changes stored in local state until "Save" is clicked.
 * Single API call saves everything atomically.
 */
export function RoutineBuilderClient({
  routineId,
  initialRoutine,
  initialExercises,
}: RoutineBuilderClientProps) {
  const router = useRouter();

  // React Query
  const { data: routine } = useRoutine(routineId, initialRoutine);
  const { data: exercisesData } = useExercises(initialExercises);
  const exercises = exercisesData?.exercises || initialExercises || [];
  const saveMutation = useSaveRoutineExercises();

  // Draft state (local only until save)
  const [localExercises, setLocalExercises] = useState<RoutineExercise[]>(
    initialRoutine?.RoutineExercise || []
  );
  const [isDirty, setIsDirty] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync when routine data updates (after save)
  useEffect(() => {
    if (routine?.RoutineExercise) {
      setLocalExercises(routine.RoutineExercise);
      setIsDirty(false);
    }
  }, [routine]);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleSave = () => {
    if (!isDirty) return;

    const exerciseConfigs = localExercises.map((ex) => ({
      exerciseId: ex.Exercise.id,
      sets: ex.sets,
      reps: ex.reps,
      duration: ex.duration,
      weight: ex.weight,
      // Distance is already in meters, send with 'm' unit
      distance: ex.distance,
      distanceUnit: 'm',
      restSeconds: ex.restSeconds,
      supersetId: ex.supersetId || null,
    }));

    console.log(" 🔥 SAVING ROUTINE EXERCISES:", exerciseConfigs);
    saveMutation.mutate({ routineId, exercises: exerciseConfigs });
  };

  const handleReorder = (newOrder: RoutineExercise[]) => {
    setLocalExercises(newOrder);
    setIsDirty(true);
  };

  const handleAddExercise = (exercise: Exercise) => {
    const tempId = `temp-${Date.now()}`;
    
    const newExercise: RoutineExercise = {
      id: tempId,
      exerciseId: exercise.id,
      sets: exercise.defaultSets,
      reps: exercise.trackingType === "seconds" ? null : (exercise.defaultReps || 10),
      duration: exercise.trackingType === "seconds" ? (exercise.defaultDuration || 60) : null,
      weight: null,
      // defaultDistance is already in meters from DB
      distance: exercise.tracksDistance ? (exercise.defaultDistance || null) : null,
      restSeconds: 90,
      supersetId: null,
      Exercise: exercise,
    };

    setLocalExercises([...localExercises, newExercise]);
    setIsDirty(true);
    setShowExercisePicker(false);
    setSearchQuery("");
  };

  const handleRemoveExercise = (id: string) => {
    // Also unlink from any superset
    const exerciseToRemove = localExercises.find((ex) => ex.id === id);
    if (exerciseToRemove?.supersetId) {
      // Count how many exercises share this supersetId
      const sharedCount = localExercises.filter((ex) => ex.supersetId === exerciseToRemove.supersetId).length;
      // If only 2 left (including this one), clear supersetId from the other
      if (sharedCount === 2) {
        setLocalExercises((prev) =>
          prev
            .filter((ex) => ex.id !== id)
            .map((ex) =>
              ex.supersetId === exerciseToRemove.supersetId ? { ...ex, supersetId: null } : ex
            )
        );
        setIsDirty(true);
        return;
      }
    }
    setLocalExercises(localExercises.filter((ex) => ex.id !== id));
    setIsDirty(true);
  };

  // Toggle superset link between current exercise and next one
  const handleToggleSuperset = (currentIdx: number) => {
    const current = localExercises[currentIdx];
    const next = localExercises[currentIdx + 1];
    if (!next) return;

    // Check if already linked
    const isLinked = current.supersetId && current.supersetId === next.supersetId;

    if (isLinked) {
      // Unlink: remove supersetId from both if only 2 in group
      const groupCount = localExercises.filter((ex) => ex.supersetId === current.supersetId).length;
      if (groupCount === 2) {
        // Clear supersetId from both
        setLocalExercises((prev) =>
          prev.map((ex) =>
            ex.supersetId === current.supersetId ? { ...ex, supersetId: null } : ex
          )
        );
      } else {
        // Just unlink next from group
        setLocalExercises((prev) =>
          prev.map((ex, idx) => (idx === currentIdx + 1 ? { ...ex, supersetId: null } : ex))
        );
      }
    } else {
      // Link: assign same supersetId to current and next
      const newSupersetId = current.supersetId || `superset-${Date.now()}`;
      setLocalExercises((prev) =>
        prev.map((ex, idx) => {
          if (idx === currentIdx || idx === currentIdx + 1) {
            return { ...ex, supersetId: newSupersetId };
          }
          return ex;
        })
      );
    }
    setIsDirty(true);
  };

  const handleUpdateConfig = (
    id: string,
    field: "sets" | "reps" | "duration" | "weight" | "distance" | "restSeconds",
    value: number | null
  ) => {
    setLocalExercises((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, [field]: value } : ex))
    );
    setIsDirty(true);
  };

  const filteredExercises = exercises.filter(
    (ex: Exercise) =>
      !searchQuery ||
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50/30 to-white pb-20">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-zinc-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (isDirty && !confirm("You have unsaved changes. Leave anyway?")) return;
              router.back();
            }}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold font-[var(--font-teko)] uppercase">
            {routine?.name || "Edit Routine"}
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={!isDirty || saveMutation.isPending}
          className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all ${
            isDirty
              ? "bg-green-500 hover:bg-green-600 text-white shadow-md hover:scale-105"
              : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
          }`}
        >
          <Save size={18} />
          {saveMutation.isPending ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="h-[74px]" />

      {/* Exercise List */}
      <div className="px-6 py-6 space-y-3">
        {localExercises.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500 mb-4">No exercises added yet</p>
            <button
              onClick={() => setShowExercisePicker(true)}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600"
            >
              Add First Exercise
            </button>
          </div>
        ) : (
          <Reorder.Group axis="y" values={localExercises} onReorder={handleReorder}>
            {localExercises.map((re, idx) => {
              const isInSuperset = !!re.supersetId;
              const nextEx = localExercises[idx + 1];
              const isLinkedToNext = re.supersetId && nextEx?.supersetId === re.supersetId;
              
              return (
                <div key={re.id}>
                  <Reorder.Item
                    value={re}
                    className={`bg-white rounded-2xl border-2 p-4 shadow-sm touch-none ${
                      isInSuperset 
                        ? 'border-l-4 border-l-blue-500 border-zinc-100' 
                        : 'border-zinc-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Drag Handle */}
                      <div className="flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing">
                        <GripVertical size={20} className="text-zinc-300" />
                        <span className={`text-sm font-bold ${isInSuperset ? 'text-blue-500' : 'text-zinc-400'}`}>
                          {idx + 1}
                        </span>
                      </div>

                      {/* Exercise Info */}
                      <div className="flex-1">
                        <h3 className="font-bold text-zinc-900 mb-3">
                          {re.Exercise.name}
                          {isInSuperset && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                              Superset
                            </span>
                          )}
                        </h3>

                        {/* Configuration Grid - always 4 cols: SETS, SEC/REPS, WT, REST */}
                        <div className="grid gap-2 grid-cols-4">
                          {/* Sets */}
                          <div>
                            <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold block mb-1">
                              Sets
                            </label>
                            <input
                              type="number"
                              value={re.sets}
                              onChange={(e) =>
                                handleUpdateConfig(re.id, "sets", parseInt(e.target.value) || 1)
                              }
                              min="1"
                              className="w-full px-3 py-2 rounded-lg border-2 border-zinc-200 focus:border-orange-500 outline-none font-bold text-center"
                            />
                          </div>

                          {/* Reps or Duration */}
                          <div>
                            <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold block mb-1">
                              {re.Exercise.trackingType === "seconds" ? "Sec" : "Reps"}
                            </label>
                            <input
                              type="number"
                              value={
                                re.Exercise.trackingType === "seconds"
                                  ? re.duration ?? 60
                                  : re.reps ?? 10
                              }
                              onChange={(e) => {
                                const field = re.Exercise.trackingType === "seconds" ? "duration" : "reps";
                                handleUpdateConfig(re.id, field, parseInt(e.target.value) || 1);
                              }}
                              min="1"
                              className="w-full px-3 py-2 rounded-lg border-2 border-zinc-200 focus:border-orange-500 outline-none font-bold text-center"
                            />
                          </div>

                          {/* Weight */}
                          <div>
                            <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold block mb-1">
                              Weight
                            </label>
                            <input
                              type="number"
                              value={re.weight ?? ""}
                              placeholder="kg"
                              onChange={(e) => {
                                const val = e.target.value ? parseFloat(e.target.value) : null;
                                handleUpdateConfig(re.id, "weight", val);
                              }}
                              min="0"
                              step="0.5"
                              className="w-full px-3 py-2 rounded-lg border-2 border-zinc-200 focus:border-orange-500 outline-none font-bold text-center"
                            />
                          </div>

                          {/* Rest */}
                          <div>
                            <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold block mb-1">
                              Rest
                            </label>
                            <input
                              type="number"
                              value={re.restSeconds}
                              onChange={(e) =>
                                handleUpdateConfig(re.id, "restSeconds", parseInt(e.target.value) || 0)
                              }
                              min="0"
                              step="5"
                              className="w-full px-3 py-2 rounded-lg border-2 border-zinc-200 focus:border-orange-500 outline-none font-bold text-center"
                            />
                          </div>
                        </div>

                        {/* Distance Row - only show if exercise tracks distance */}
                        {re.Exercise.tracksDistance && (
                          <div className="mt-3 pt-3 border-t border-zinc-100">
                            <label className="text-xs text-blue-600 uppercase tracking-wide font-bold block mb-2">
                              Distance
                            </label>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 relative">
                                <input
                                  type="number"
                                  value={re.distance ?? ""}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const val = e.target.value ? parseFloat(e.target.value) : null;
                                    handleUpdateConfig(re.id, "distance", val);
                                  }}
                                  min="0"
                                  step="1"
                                  className="w-full px-3 py-2 pr-8 rounded-lg border-2 border-blue-200 focus:border-blue-500 outline-none font-bold text-center"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-blue-400 pointer-events-none">
                                  m
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleRemoveExercise(re.id)}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </Reorder.Item>
                  
                  {/* Link Button between exercises */}
                  {idx < localExercises.length - 1 && (
                    <div className="flex justify-center -my-1 relative z-10">
                      <button
                        onClick={() => handleToggleSuperset(idx)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                          isLinkedToNext
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                        }`}
                      >
                        {isLinkedToNext ? (
                          <>
                            <Link2Off size={14} />
                            Unlink
                          </>
                        ) : (
                          <>
                            <Link2 size={14} />
                            Link as Superset
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </Reorder.Group>
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowExercisePicker(true)}
          className="w-14 h-14 bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-orange-600 hover:scale-105 transition-all"
        >
          <Plus size={28} />
        </button>
      </div>

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="w-full bg-white rounded-t-3xl max-h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-zinc-100 p-6 space-y-4 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-[var(--font-teko)] uppercase">
                  Add Exercise
                </h2>
                <button
                  onClick={() => {
                    setShowExercisePicker(false);
                    setSearchQuery("");
                  }}
                  className="text-zinc-500 hover:text-zinc-700"
                >
                  Cancel
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search exercises..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-orange-500 outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Exercise List */}
            <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-2">
              {filteredExercises.map((exercise: Exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => handleAddExercise(exercise)}
                  className="w-full text-left p-4 bg-zinc-50 hover:bg-orange-50 rounded-xl transition-colors"
                >
                  <div className="font-semibold text-zinc-900">{exercise.name}</div>
                  <div className="text-sm text-zinc-500">
                    {exercise.category} • {exercise.defaultSets}×
                    {exercise.trackingType === "seconds"
                      ? `${exercise.defaultDuration || 60}s`
                      : exercise.defaultReps || 10}
                  </div>
                </button>
              ))}

              {filteredExercises.length === 0 && (
                <div className="text-center py-8 text-zinc-500">
                  No exercises found for &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
