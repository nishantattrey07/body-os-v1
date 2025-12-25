"use client";

import { useSaveRoutineExercises } from "@/lib/mutations/useSaveRoutineExercises";
import { useExercises, useRoutine } from "@/lib/queries/useRoutine";
import { motion, Reorder } from "framer-motion";
import { ArrowLeft, GripVertical, Plus, Save, Search, Trash2 } from "lucide-react";
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
}

interface RoutineExercise {
  id: string;
  exerciseId: string;
  sets: number;
  reps: number | null;
  duration: number | null;
  restSeconds: number;
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
  const { data: exercises = initialExercises } = useExercises(initialExercises);
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
      restSeconds: ex.restSeconds,
    }));

    console.log(" 🔥 SAVING ROUTINE EXERCISES:", exerciseConfigs);
    saveMutation.mutate({ routineId, exercises: exerciseConfigs });
  };

  const handleReorder = (newOrder: RoutineExercise[]) => {
    setLocalExercises(newOrder);
    setIsDirty(true);
  };

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise: RoutineExercise = {
      id: `temp-${Date.now()}`,
      exerciseId: exercise.id,
      sets: exercise.defaultSets,
      reps: exercise.trackingType === "seconds" ? null : (exercise.defaultReps || 10),
      duration: exercise.trackingType === "seconds" ? (exercise.defaultDuration || 60) : null,
      restSeconds: 90,
      Exercise: exercise,
    };

    setLocalExercises([...localExercises, newExercise]);
    setIsDirty(true);
    setShowExercisePicker(false);
    setSearchQuery("");
  };

  const handleRemoveExercise = (id: string) => {
    setLocalExercises(localExercises.filter((ex) => ex.id !== id));
    setIsDirty(true);
  };

  const handleUpdateConfig = (
    id: string,
    field: "sets" | "reps" | "duration" | "restSeconds",
    value: number
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
            {localExercises.map((re, idx) => (
              <Reorder.Item
                key={re.id}
                value={re}
                className="bg-white rounded-2xl border-2 border-zinc-100 p-4 shadow-sm mb-3 touch-none"
              >
                <div className="flex items-start gap-3">
                  {/* Drag Handle */}
                  <div className="flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing">
                    <GripVertical size={20} className="text-zinc-300" />
                    <span className="text-sm font-bold text-zinc-400">{idx + 1}</span>
                  </div>

                  {/* Exercise Info */}
                  <div className="flex-1">
                    <h3 className="font-bold text-zinc-900 mb-3">{re.Exercise.name}</h3>

                    {/* Configuration Grid */}
                    <div className="grid grid-cols-3 gap-2">
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
                          {re.Exercise.trackingType === "seconds" ? "Seconds" : "Reps"}
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

                      {/* Rest */}
                      <div>
                        <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold block mb-1">
                          Rest (s)
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
            ))}
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
