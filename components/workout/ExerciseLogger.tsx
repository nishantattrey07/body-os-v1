"use client";

import { BlockerPicker } from "@/components/blockers/BlockerPicker";
import { useLogSet } from "@/lib/mutations/useLogSet";
import { DistanceUnit, fromMeters, toMeters, UNIT_INCREMENTS, UNIT_LABELS } from "@/lib/utils/distance";
import { getPreferredDistanceUnit, setPreferredDistanceUnit } from "@/lib/utils/preferences";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  CheckCircle,
  Loader2,
  Minus,
  Plus,
  Timer,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { TimerModal } from "./TimerModal";

interface ExerciseLoggerProps {
  exercise: any;
  sessionExerciseId?: string;
  onComplete: (setsCount: number) => void;
  onSetComplete?: (setNumber: number, isLastSet: boolean) => void;  // Called after EVERY set
  onAfterRest?: () => void;  // Called after rest timer for superset loop-back
  nextExerciseName?: string;  // For superset 'Up Next' indicator
  isInSuperset?: boolean;     // Shows superset badge
  isSupersetTransition?: boolean;  // If true, skip rest timer and call onSetComplete
  isLastOfSuperset?: boolean;  // If true, after rest timer, call onAfterRest for loop-back
}

export function ExerciseLogger({
  exercise,
  sessionExerciseId,
  onComplete,
  onSetComplete,
  onAfterRest,
  nextExerciseName,
  isInSuperset = false,
  isSupersetTransition = false,
  isLastOfSuperset = false,
}: ExerciseLoggerProps) {
  // Determine if this is a time-based exercise (seconds) or reps-based
  const isTimeBased = exercise.trackingType === "seconds";
  const [value, setValue] = useState(
    isTimeBased
      ? exercise.defaultDuration || 60
      : exercise.defaultReps || 10
  );
  // Use targetWeight from SessionExercise (set in routine builder), fallback to 0
  const [weight, setWeight] = useState(exercise.targetWeight || 0);
  // Distance tracking (optional, if exercise.tracksDistance)
  const tracksDistance = exercise.tracksDistance || false;
  // Store distance in DISPLAY UNIT (convert to meters only on save)
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(() => getPreferredDistanceUnit());
  const [distance, setDistance] = useState(() => {
    const targetMeters = exercise.targetDistance || 0;
    return fromMeters(targetMeters, getPreferredDistanceUnit());
  });
  const [rpe, setRPE] = useState(7);
  const [painLevel, setPainLevel] = useState(0);
  const [selectedBlockerId, setSelectedBlockerId] = useState<string | null>(
    null
  );
  const [logging, setLogging] = useState(false);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [restTimerMax, setRestTimerMax] = useState<number>(0);
  const [restStartTime, setRestStartTime] = useState<Date | null>(null);
  const [currentSet, setCurrentSet] = useState(1);
  const [showTimer, setShowTimer] = useState(false);
  const [completedSets, setCompletedSets] = useState<any[]>([]);
  const [loadingSets, setLoadingSets] = useState(true);
  const totalSets = exercise.defaultSets || 3;

  // Use ref for synchronous lock to prevent race conditions
  const isLoggingRef = useRef(false);

  const logSetMutation = useLogSet();

  // Fetch existing sets on mount/exercise change
  useEffect(() => {
    if (sessionExerciseId) {
      setLoadingSets(true);
      fetch(`/api/workout/exercise/sets?sessionExerciseId=${sessionExerciseId}`)
        .then(res => res.json())
        .then(data => {
          setCompletedSets(data.sets || []);
          setCurrentSet(data.count + 1);
          setLoadingSets(false);
        })
        .catch(error => {
          console.error("[ExerciseLogger] Failed to fetch sets:", error);
          setLoadingSets(false);
        });
    }
  }, [sessionExerciseId]);

  // Reset state when exercise changes
  useEffect(() => {
    setValue(isTimeBased ? (exercise.defaultDuration || 60) : (exercise.defaultReps || 10));
    setWeight(exercise.targetWeight || 0);
    // Convert from meters to current display unit
    const targetMeters = exercise.targetDistance || 0;
    setDistance(fromMeters(targetMeters, distanceUnit));
    setRPE(7);
    setPainLevel(0);
    setSelectedBlockerId(null);
    setRestTimer(null);
    setRestTimerMax(0);
    setRestStartTime(null);
    isLoggingRef.current = false;
  }, [exercise.id, isTimeBased, distanceUnit]);

  const handleLogSet = async () => {
    
    // Guard clause
    if (!sessionExerciseId) {
      console.warn("[ExerciseLogger] No sessionExerciseId, skipping log");
      return;
    }

    // Synchronous lock check - prevents duplicates instantly
    if (isLoggingRef.current) {
      console.log("[ExerciseLogger] Duplicate click blocked");
      return;
    }
    isLoggingRef.current = true;

    // Check if this set already exists (additional safety layer)
    if (completedSets.some(s => s.setNumber === currentSet)) {
      toast.error("Set already logged");
      isLoggingRef.current = false;
      return;
    }

    // Calculate actual rest taken
    let actualRestTaken: number | undefined;
    if (restStartTime) {
      actualRestTaken = Math.floor(
        (Date.now() - restStartTime.getTime()) / 1000
      );
      setRestStartTime(null);
    }

    const previousSet = currentSet;
    const isLastSet = currentSet >= totalSets;

    // CRASH-PROOF: Save to localStorage FIRST
    const setData = {
      sessionExerciseId,  // Now guaranteed to be string
      setNumber: previousSet,
      targetReps: isTimeBased ? undefined : exercise.defaultReps || 10,
      actualReps: isTimeBased ? undefined : value,
      targetDuration: isTimeBased ? exercise.defaultDuration || 60 : undefined,
      actualSeconds: isTimeBased ? value : undefined,
      targetWeight: exercise.targetWeight || undefined,
      actualWeight: weight,  // Local state 'weight' maps to DB 'actualWeight'
      weightUnit: "kg",
      targetDistance: tracksDistance ? (exercise.targetDistance || undefined) : undefined,
      // Convert display value to meters for storage
      actualDistance: tracksDistance && distance ? toMeters(distance, distanceUnit) : undefined,
      distanceUnit: "m", // Always store as meters
      rpe,
      painLevel,
      restTaken: actualRestTaken,
      aggravatedBlockerId: selectedBlockerId || undefined,
    };

    // Save to localStorage with unique ID
    const pendingSets = JSON.parse(
      localStorage.getItem("pendingSets") || "[]"
    );
    const pendingSetId = `${sessionExerciseId}-${previousSet}-${Date.now()}`;
    pendingSets.push({ id: pendingSetId, ...setData, timestamp: Date.now() });
    localStorage.setItem("pendingSets", JSON.stringify(pendingSets));

    // ✅ DATA IS SAFE - NOW MOVE ON IMMEDIATELY
    // Unlock and update UI BEFORE server call
    isLoggingRef.current = false;

    // OPTIMISTIC UPDATE: Update UI immediately
    if (!isLastSet) {
      // Check if this is a superset transition (should move to next exercise)
      if (isSupersetTransition && onSetComplete) {
        // Let parent handle navigation - don't show rest timer
        onSetComplete(previousSet, false);
        // Don't increment set here - we'll come back to this exercise later
      } else if (isLastOfSuperset && onAfterRest) {
        // Last exercise of superset - FIRST track this set, then show rest timer
        // This is critical! Without this, C's sets aren't tracked and allSupersetDone fails
        if (onSetComplete) {
          onSetComplete(previousSet, false);
        }
        
        // Now show rest timer, then call onAfterRest to loop back
        const restTime =
          exercise.defaultRestSeconds !== undefined ? exercise.defaultRestSeconds : 60;
        if (restTime > 0) {
          setRestTimerMax(restTime);
          setRestTimer(restTime);
          setRestStartTime(new Date());
          const timer = setInterval(() => {
            setRestTimer((prev) => {
              if (prev === null || prev <= 1) {
                clearInterval(timer);
                // Defer to next tick to avoid setState-in-render error
                setTimeout(() => onAfterRest(), 0);
                return null;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          // No rest needed, defer and loop back
          setTimeout(() => onAfterRest(), 0);
        }
      } else {
        // Normal flow - continue with sets of this exercise
        setCurrentSet((prev) => prev + 1);

        const restTime =
          exercise.defaultRestSeconds !== undefined ? exercise.defaultRestSeconds : 60;
        if (restTime > 0) {
          setRestTimerMax(restTime);
          setRestTimer(restTime);
          setRestStartTime(new Date());  // Track rest start for next set
          const timer = setInterval(() => {
            setRestTimer((prev) => {
              if (prev === null || prev <= 1) {
                clearInterval(timer);
                return null;
              }
              return prev - 1;
            });
          }, 1000);
        }
      }
    } else {
      // For last set, mark exercise as completed
      if (sessionExerciseId) {
        fetch("/api/workout/exercise/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionExerciseId }),
        }).then(() => {
          // Notify of set completion for superset logic, THEN complete the exercise
          if (onSetComplete) {
            onSetComplete(previousSet, true);
          }
          onComplete(totalSets);
        }).catch((error) => {
          console.error("[ExerciseLogger] Failed to mark exercise complete:", error);
          if (onSetComplete) {
            onSetComplete(previousSet, true);
          }
          onComplete(totalSets);
        });
      } else {
        if (onSetComplete) {
          onSetComplete(previousSet, true);
        }
        onComplete(totalSets);
      }
    }

    toast.success(`Set ${previousSet} logged!`);

    // BACKGROUND SYNC: Fire and forget
    logSetMutation.mutate(setData, {
      onSuccess: () => {
        // Remove from pending sets after successful sync
        const updated = JSON.parse(localStorage.getItem("pendingSets") || "[]")
          .filter((s: any) => s.id !== pendingSetId);
        localStorage.setItem("pendingSets", JSON.stringify(updated));
      },
      onError: (error) => {
        console.error("[ExerciseLogger] ❌ Sync failed, will retry:", error);
        // Data stays in localStorage for retry by sync queue
      },
    });
  };

  const handleSkipRest = () => {
    setRestTimer(null);
    setRestStartTime(null);
  };

  const handleButtonClick = () => {
    // Always log directly with current value
    // "USE STOPWATCH TIMER" button is separate if user wants to use timer
    handleLogSet();
  };

  const handleTimerComplete = (actualSeconds: number) => {
    setValue(actualSeconds);
    setShowTimer(false);
    handleLogSet();
  };

  const restProgress = restTimerMax > 0 ? ((restTimerMax - (restTimer || 0)) / restTimerMax) * 100 : 0;
  const showHighPainWarning = painLevel > 3; // Show at level 4+


  return (
    <div className="space-y-4 pb-6">
      {/* Superset 'Up Next' Indicator */}
      {nextExerciseName && isInSuperset && (
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
            🔗 Paired with: {nextExerciseName}
          </span>
        </div>
      )}

      {/* Exercise Header - Compact */}
      <div className="text-center">
        <h2 className="text-3xl font-bold font-heading uppercase tracking-tight text-foreground">
          {exercise.name}
          {isInSuperset && (
            <span className="ml-2 text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium normal-case tracking-normal">
              Superset
            </span>
          )}
        </h2>
        
        {/* Set Progress - compact without card */}
        <div className="flex flex-wrap justify-center gap-3 mt-4 mb-3">
          {Array.from({ length: totalSets }, (_, i) => {
            const setNum = i + 1;
            const isCompleted = setNum < currentSet;
            const isCurrent = setNum === currentSet;

            return (
              <motion.div
                key={setNum}
                className="flex flex-col items-center gap-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <motion.div
                  animate={{
                    backgroundColor: isCompleted
                      ? "#10b981"
                      : isCurrent
                      ? "#f97316"
                      : "#e5e7eb",
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className={`
                    h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm
                    ${
                      isCompleted
                        ? "text-white"
                        : isCurrent
                        ? "text-white ring-4 ring-orange-200"
                        : "text-zinc-400"
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check size={18} strokeWidth={3} />
                  ) : (
                    <span className="font-heading">{setNum}</span>
                  )}
                </motion.div>
                <span
                  className={`text-[10px] font-medium uppercase tracking-wide ${
                    isCurrent
                      ? "text-orange-600"
                      : isCompleted
                      ? "text-green-600"
                      : "text-zinc-400"
                  }`}
                >
                  {isCompleted ? "Done" : isCurrent ? "Now" : `Set ${setNum}`}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Target Badge - centered */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 rounded-full">
          <span className="text-xs font-medium text-zinc-500">Target:</span>
          <span className="text-xs font-bold text-zinc-700">
            {isTimeBased ? exercise.defaultDuration : exercise.defaultReps}{" "}
            {isTimeBased ? "sec" : "reps"}
          </span>
        </div>
      </div>

      {/* Counter - Premium Card */}
      <div className="bg-white rounded-3xl p-6 shadow-lg shadow-zinc-900/5 border border-zinc-100/80">
        <p className="text-center text-zinc-400 text-xs uppercase tracking-widest font-medium mb-4">
          Actual {isTimeBased ? "Seconds" : "Reps"}
        </p>
        <div className="flex items-center justify-center gap-8">
          <motion.button
            onClick={() => setValue(Math.max(1, value - 1))}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            className="h-14 w-14 rounded-full bg-gradient-to-br from-red-400 to-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30"
          >
            <Minus size={22} strokeWidth={3} />
          </motion.button>

          <motion.div
            key={value}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="text-6xl font-bold font-heading text-foreground tabular-nums min-w-[100px] text-center"
          >
            {value}
          </motion.div>

          <motion.button
            onClick={() => setValue(value + 1)}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            className="h-14 w-14 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white flex items-center justify-center shadow-lg shadow-green-500/30"
          >
            <Plus size={22} strokeWidth={3} />
          </motion.button>
        </div>
        
        {/* Quick adjust buttons - contextual for reps vs seconds */}
        <div className="flex justify-center gap-2 mt-4">
          {(isTimeBased ? [-30, -10, +10, +30] : [-5, -2, +2, +5]).map(delta => (
            <button
              key={delta}
              onClick={() => setValue(Math.max(1, value + delta))}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                delta < 0 
                  ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                  : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              {delta > 0 ? '+' : ''}{delta}{isTimeBased ? 's' : ''}
            </button>
          ))}
        </div>

        {/* Start Timer button for time-based exercises */}
        {isTimeBased && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowTimer(true)}
            className="mt-4 w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
          >
            <Timer size={18} />
            Use Stopwatch Timer
          </motion.button>
        )}
      </div>

      {/* Weight Input (if applicable) */}
      {!isTimeBased && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold text-zinc-700 uppercase tracking-wide">
                Weight
              </p>
              {exercise.targetWeight && exercise.targetWeight > 0 && (
                <p className="text-xs text-zinc-400">Target: {exercise.targetWeight} kg</p>
              )}
            </div>
            <span className="text-lg font-bold text-orange-600">{weight} kg</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setWeight(Math.max(0, weight - 5))}
              className="flex-1 h-10 rounded-xl bg-zinc-200 hover:bg-zinc-300 font-bold text-zinc-700 transition-colors"
            >
              -5
            </button>
            <button
              onClick={() => setWeight(Math.max(0, weight - 2.5))}
              className="flex-1 h-10 rounded-xl bg-zinc-100 hover:bg-zinc-200 font-bold text-zinc-700 transition-colors"
            >
              -2.5
            </button>
            <button
              onClick={() => setWeight(weight + 2.5)}
              className="flex-1 h-10 rounded-xl bg-orange-100 hover:bg-orange-200 font-bold text-orange-700 transition-colors"
            >
              +2.5
            </button>
            <button
              onClick={() => setWeight(weight + 5)}
              className="flex-1 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 font-bold text-white transition-colors"
            >
              +5
            </button>
          </div>
        </div>
      )}

      {/* Distance Input (if exercise tracks distance) */}
      {tracksDistance && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                Distance
              </p>
              {exercise.targetDistance && exercise.targetDistance > 0 && (
                <p className="text-xs text-blue-400">
                  Target: {fromMeters(exercise.targetDistance, distanceUnit).toFixed(distanceUnit === 'm' ? 0 : 1)} {UNIT_LABELS[distanceUnit]}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-blue-50 rounded-lg border-2 border-blue-200 min-w-[80px] text-right">
                <span className="text-lg font-bold text-blue-600 tabular-nums">
                  {distanceUnit === 'm' ? distance.toFixed(0) : distance.toFixed(1)}
                </span>
              </div>
              {/* Unit toggle buttons instead of native select */}
              <div className="flex rounded-lg border-2 border-blue-200 overflow-hidden">
                {(['m', 'km', 'miles'] as const).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => {
                      if (unit === distanceUnit) return;
                      const meters = toMeters(distance, distanceUnit);
                      const newValue = fromMeters(meters, unit);
                      setDistance(newValue);
                      setDistanceUnit(unit);
                      setPreferredDistanceUnit(unit);
                    }}
                    className={`px-2 py-1 text-xs font-bold transition-colors ${
                      distanceUnit === unit
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {UNIT_LABELS[unit]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDistance(Math.max(0, distance - UNIT_INCREMENTS[distanceUnit].large))}
              className="flex-1 h-10 rounded-xl bg-zinc-200 hover:bg-zinc-300 font-bold text-zinc-700 transition-colors"
            >
              -{UNIT_INCREMENTS[distanceUnit].large}
            </button>
            <button
              onClick={() => setDistance(Math.max(0, distance - UNIT_INCREMENTS[distanceUnit].small))}
              className="flex-1 h-10 rounded-xl bg-zinc-100 hover:bg-zinc-200 font-bold text-zinc-700 transition-colors"
            >
              -{UNIT_INCREMENTS[distanceUnit].small}
            </button>
            <button
              onClick={() => setDistance(distance + UNIT_INCREMENTS[distanceUnit].small)}
              className="flex-1 h-10 rounded-xl bg-blue-100 hover:bg-blue-200 font-bold text-blue-700 transition-colors"
            >
              +{UNIT_INCREMENTS[distanceUnit].small}
            </button>
            <button
              onClick={() => setDistance(distance + UNIT_INCREMENTS[distanceUnit].large)}
              className="flex-1 h-10 rounded-xl bg-blue-500 hover:bg-blue-600 font-bold text-white transition-colors"
            >
              +{UNIT_INCREMENTS[distanceUnit].large}
            </button>
          </div>
        </div>
      )}

      {/* RPE Scale - Dynamic colors based on optimal training zones */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-zinc-700 uppercase tracking-wide">
            RPE (Effort)
          </p>
          <span className={`text-lg font-bold ${
            rpe <= 4 ? 'text-amber-500' :      // Too easy
            rpe <= 6 ? 'text-lime-500' :       // Moderate/beginner
            rpe <= 8 ? 'text-green-600' :      // Optimal zone
            rpe === 9 ? 'text-orange-500' :    // Very hard
            'text-red-500'                      // Max/failure
          }`}>{rpe}/10</span>
        </div>
        
        <input
          type="range"
          min="1"
          max="10"
          value={rpe}
          onChange={(e) => setRPE(parseInt(e.target.value))}
          className={`w-full h-2 mt-3 rounded-full appearance-none cursor-pointer transition-all
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md
            ${
              rpe <= 4 
                ? 'bg-gradient-to-r from-amber-100 to-amber-300 [&::-webkit-slider-thumb]:bg-amber-500'
                : rpe <= 6
                  ? 'bg-gradient-to-r from-amber-200 via-lime-200 to-lime-300 [&::-webkit-slider-thumb]:bg-lime-500'
                  : rpe <= 8
                    ? 'bg-gradient-to-r from-lime-200 via-green-300 to-green-400 [&::-webkit-slider-thumb]:bg-green-600'
                    : rpe === 9
                      ? 'bg-gradient-to-r from-green-200 via-orange-200 to-orange-400 [&::-webkit-slider-thumb]:bg-orange-500'
                      : 'bg-gradient-to-r from-orange-200 via-red-300 to-red-400 [&::-webkit-slider-thumb]:bg-red-500'
            }
          `}
        />
      </div>

      {/* Pain Level */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500" />
            <p className="text-xs font-bold text-zinc-700 uppercase tracking-wide">
              Pain Level
            </p>
          </div>
          <span
            className={`text-lg font-bold ${
              painLevel === 0
                ? "text-green-600"
                : painLevel <= 3
                ? "text-amber-500"
                : "text-red-500"
            }`}
          >
            {painLevel}/10
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="10"
          value={painLevel}
          onChange={(e) => setPainLevel(parseInt(e.target.value))}
          className={`w-full h-2 mt-3 rounded-full appearance-none cursor-pointer transition-all
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md
            ${
              painLevel === 0
                ? "bg-gradient-to-r from-green-200 to-green-300 [&::-webkit-slider-thumb]:bg-green-500"
                : painLevel <= 3
                ? "bg-gradient-to-r from-green-200 via-amber-200 to-amber-300 [&::-webkit-slider-thumb]:bg-amber-500"
                : "bg-gradient-to-r from-amber-200 via-orange-300 to-red-400 [&::-webkit-slider-thumb]:bg-red-500"
            }
          `}
        />

        {/* High Pain Warning */}
        <AnimatePresence>
          {showHighPainWarning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-3"
            >
              <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                <p className="text-xs text-red-600 font-medium">
                  ⚠️ High pain detected. Consider reducing weight or stopping.
                </p>
              </div>
              
              {/* BlockerPicker for linking to body issues */}
              <BlockerPicker
                selectedBlockerId={selectedBlockerId}
                onSelect={setSelectedBlockerId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Button */}
      <AnimatePresence mode="wait">
        {restTimer !== null ? (
          <motion.div
            key="rest"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {/* Rest Timer with Progress */}
            <div className="relative bg-gradient-to-br from-zinc-100 to-zinc-200 rounded-2xl p-6 overflow-hidden">
              {/* Progress bar background */}
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: `${restProgress}%` }}
                className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-blue-500/30"
              />

              <div className="relative flex items-center justify-center gap-4">
                <Timer size={24} className="text-blue-600" />
                <div className="text-center">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide">
                    Rest Period
                  </p>
                  <p className="text-4xl font-bold font-heading text-zinc-800 tabular-nums">
                    {restTimer}s
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSkipRest}
              className="w-full h-12 rounded-xl bg-zinc-800 text-white font-bold text-sm uppercase tracking-wider hover:bg-zinc-700 transition-colors"
            >
              Skip Rest →
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="complete"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={handleButtonClick}
            disabled={logging}
            whileTap={{ scale: 0.98 }}
            className={`
              w-full h-16 rounded-2xl font-bold text-base uppercase tracking-wider 
              flex items-center justify-center gap-2 transition-all
              ${
                logging
                  ? "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                  : currentSet >= totalSets
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
              }
            `}
          >
            {logging ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Saving...
              </>
            ) : currentSet >= totalSets ? (
              <>
                <CheckCircle size={20} />
                Complete Exercise
              </>
            ) : isSupersetTransition && currentSet < totalSets ? (
              <>
                <Check size={20} strokeWidth={3} />
                Log & Next Exercise →
              </>
            ) : isLastOfSuperset && currentSet < totalSets ? (
              <>
                <Check size={20} strokeWidth={3} />
                Log & Rest ☕
              </>
            ) : (
              <>
                <Check size={20} strokeWidth={3} />
                Log Set {currentSet} →
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Timer Modal for time-based exercises */}
      <TimerModal
        isOpen={showTimer}
        targetSeconds={value}
        exerciseName={exercise.name}
        onComplete={handleTimerComplete}
        onCancel={() => setShowTimer(false)}
      />
    </div>
  );
}
