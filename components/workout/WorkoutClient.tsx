"use client";

import { useCreateSession } from "@/lib/mutations/useCreateSession";
import { sessionManager } from "@/lib/offline";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Dumbbell, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExerciseLogger } from "./ExerciseLogger";
import { ExitConfirmationModal } from "./ExitConfirmationModal";
import { PostWorkoutData, PostWorkoutModal } from "./PostWorkoutModal";
import { PreWorkoutData, PreWorkoutModal } from "./PreWorkoutModal";
import { ResumeModal } from "./ResumeModal";
import { WarmupGate } from "./WarmupGate";


interface WorkoutClientProps {
  initialRoutines: any[];
}

type WorkoutStage = "select" | "warmup" | "exercise" | "post-workout";
type FilterType = "all" | "system" | "user";

export function WorkoutClient({ initialRoutines }: WorkoutClientProps) {
  const router = useRouter();
  const [stage, setStage] = useState<WorkoutStage>("select");
  const [selectedRoutine, setSelectedRoutine] = useState<any>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [totalSetsCompleted, setTotalSetsCompleted] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const createSession = useCreateSession();

  // Check for active/paused session on mount
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const response = await fetch("/api/workout-session");
        if (!response.ok) return;
        
        const data = await response.json();
        if (data.session && data.session.status === "IN_PROGRESS") {
          setActiveSession(data.session);
          setShowResumeModal(true);
        }
      } catch (error) {
        console.error("[WorkoutClient] Failed to check active session:", error);
      }
    };

    checkActiveSession();
  }, []);

  // Track scroll position for gradient
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 120);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Filter routines
  const filteredRoutines = initialRoutines.filter((routine) => {
    const matchesSearch =
      !search ||
      routine.name.toLowerCase().includes(search.toLowerCase()) ||
      routine.description?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "system" && routine.isSystem) ||
      (filter === "user" && !routine.isSystem);

    return matchesSearch && matchesFilter;
  });

  const handleSelectRoutine = (routine: any) => {
    setSelectedRoutine(routine);
  };

  const handleStartWorkout = (data: PreWorkoutData) => {
    if (!selectedRoutine) return;

    createSession.mutate(
      {
        routineId: selectedRoutine.id,
        routineName: selectedRoutine.name,
        ...data,
      },
      {
        onSuccess: (result: any) => {
          console.log("[WorkoutClient] Session created:", result);
          setSessionData(result);
          setStage("warmup");
          setSelectedRoutine(null);
        },
      }
    );
  };

  const handleCancelPreWorkout = () => {
    setSelectedRoutine(null);
  };

  const handleWarmupComplete = () => {
    sessionManager.startExercises();
    setStage("exercise");
    setWorkoutStartTime(new Date()); // Start tracking workout duration
  };

  const handleBack = () => {
    if (stage === "select") {
      router.back();
    } else if (stage === "warmup") {
      setStage("select");
      setSessionData(null);
    } else if (stage === "exercise") {
      // Show exit confirmation modal
      setShowExitConfirm(true);
    }
  };

  const handleExitContinue = () => {
    setShowExitConfirm(false);
  };

  const handleExitPause = async () => {
    if (!sessionData?.session?.id) return;

    setShowExitConfirm(false);
    toast.success("Workout paused - you can resume later");
    sessionManager.clearActiveSession();
    router.push("/");
  };

  const handleExitAbandon = async () => {
    if (!sessionData?.session?.id) return;

    try {
      const response = await fetch("/api/workout/abandon", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionData.session.id }),
      });

      if (!response.ok) throw new Error("Failed to abandon session");

      setShowExitConfirm(false);
      toast.success("Workout abandoned");
      sessionManager.clearActiveSession();
      router.push("/");
    } catch (error) {
      console.error("[WorkoutClient] Failed to abandon session:", error);
      toast.error("Failed to abandon workout");
    }

  };
  const handleResumeWorkout = () => {
    if (!activeSession) return;
    setSessionData(activeSession);
    setShowResumeModal(false);
    const exercises = activeSession.SessionExercise || [];
    const incompleteIndex = exercises.findIndex((e: any) => !e.completedAt && !e.skipped);
    if (incompleteIndex >= 0) {
      setCurrentExerciseIndex(incompleteIndex);
      setStage("exercise");
      setWorkoutStartTime(new Date(activeSession.startedAt));
    } else {
      setStage("post-workout");
    }
  };

  const handleAbandonResume = async () => {
    if (!activeSession?.id) return;
    try {
      const response = await fetch("/api/workout/abandon", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSession.id }),
      });
      if (!response.ok) throw new Error("Failed to abandon");
      setShowResumeModal(false);
      setActiveSession(null);
      sessionManager.clearActiveSession();
      toast.success("Workout abandoned");
    } catch (error) {
      console.error("[WorkoutClient] Failed to abandon:", error);
      toast.error("Failed to abandon workout");
    }
  };

  const handleExerciseComplete = (setsCount: number) => {
    setTotalSetsCompleted(prev => prev + setsCount);
    const exercises = sessionData?.session?.SessionExercise || [];
    if (currentExerciseIndex < exercises.length - 1) {
      // Move to next exercise
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      // All exercises complete - show post-workout modal
      setStage("post-workout");
    }
  };

  const handlePostWorkoutSubmit = async (data: PostWorkoutData) => {
    if (!sessionData?.session?.id) return;

    // Calculate duration in minutes
    const duration = workoutStartTime
      ? Math.floor((Date.now() - workoutStartTime.getTime()) / 1000 / 60)
      : 0;

    try {
      const response = await fetch("/api/workout/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionData.session.id,
          ...data,
        }),
      });

      if (!response.ok) throw new Error("Failed to complete session");

      toast.success("Workout completed!");
      sessionManager.clearActiveSession();
      router.push("/");
    } catch (error) {
      console.error("[WorkoutClient] Failed to complete session:", error);
      toast.error("Failed to save workout completion");
    }
  };

  const getHeaderTitle = () => {
    if (stage === "select") return "Select Routine";
    if (stage === "warmup") return "Warmup";
    if (stage === "exercise") {
      const exercises = sessionData?.session?.SessionExercise || [];
      const currentExercise = exercises[currentExerciseIndex];
      return currentExercise?.Exercise?.name || "Workout";
    }
    return "Workout";
  };

  const filterLabels: Record<FilterType, string> = {
    all: "All",
    system: "System",
    user: "My Routines",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50/30 to-white pb-20 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-200/30 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-amber-200/20 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-r from-orange-50/90 to-white/90 backdrop-blur-md border-b border-orange-100/50 px-6 py-4 flex items-center gap-4">
        <button
          onClick={handleBack}
          className="p-2.5 rounded-2xl bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all shadow-sm border border-white/50"
        >
          <ArrowLeft className="text-zinc-600" />
        </button>
        <h1 className="text-2xl font-bold uppercase tracking-tighter text-foreground font-heading truncate">
          {getHeaderTitle()}
        </h1>
      </div>

      {/* Select Stage Content */}
      {stage === "select" && (
        <>
          {/* Fixed Search + Filters */}
          <div className="fixed top-[72px] left-0 right-0 z-20 bg-gradient-to-b from-orange-50/95 to-orange-50/80 backdrop-blur-sm">
            {/* Floating Search Bar */}
            <div className="px-6 pt-2 pb-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-orange-100/30 p-4 mx-2 flex items-center gap-3">
                <Search size={22} className="text-zinc-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search routines..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none focus:outline-none text-base placeholder:text-zinc-400"
                />
                <AnimatePresence>
                  {search && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      onClick={() => setSearch("")}
                      className="p-1 hover:bg-zinc-100 rounded-full"
                    >
                      <X size={18} className="text-zinc-400" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-6 py-3 flex gap-2 overflow-x-auto no-scrollbar">
              {(["all", "system", "user"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    filter === f
                      ? "bg-orange-500 text-white shadow-sm transform scale-105"
                      : "bg-white text-zinc-600 border border-zinc-200 hover:border-orange-200"
                  }`}
                >
                  {filterLabels[f]}
                </button>
              ))}
            </div>

            {/* Management Links */}
            <div className="flex gap-4 px-6 py-2">
              <Link
                href="/routines"
                className="flex-1 py-3 px-4 bg-orange-100 text-orange-700 rounded-2xl font-bold text-sm hover:bg-orange-200 transition-colors flex items-center justify-center gap-2"
              >
                <Dumbbell size={18} />
                Manage Routines
              </Link>
              <Link
                href="/exercises"
                className="flex-1 py-3 px-4 bg-zinc-100 text-zinc-700 rounded-2xl font-bold text-sm hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
              >
                <Dumbbell size={18} />
                Exercise Library
              </Link>
            </div>

            {/* Orange gradient - only visible when scrolled */}
            <div
              className={`absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-orange-200/40 to-transparent pointer-events-none transform translate-y-full transition-opacity duration-300 ${
                isScrolled ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>

          {/* Spacer for fixed elements */}
          <div className="h-72" />

          {/* Routines List */}
          <div className="px-6 pt-4">
            {filteredRoutines.length === 0 ? (
              <div className="text-center py-12">
                <Dumbbell size={48} className="mx-auto text-zinc-300 mb-4" />
                <p className="text-zinc-500 mb-4">
                  {search ? "No routines match your search" : "No routines available"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRoutines.map((routine, index) => (
                  <motion.button
                    key={routine.id}
                    onClick={() => handleSelectRoutine(routine)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-6 rounded-3xl bg-white/70 backdrop-blur-sm border border-white/60 hover:shadow-lg shadow-md shadow-orange-100/20 transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Dumbbell className="text-orange-600" size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xl font-bold font-heading text-foreground">
                            {routine.name}
                          </h3>
                          {routine.isSystem && (
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                              System
                            </span>
                          )}
                        </div>
                        {routine.description && (
                          <p className="text-sm text-zinc-500 mt-1 truncate">
                            {routine.description}
                          </p>
                        )}
                        <p className="text-xs text-zinc-400 mt-2">
                          {routine.RoutineExercise?.length || 0} exercises
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Warmup Stage */}
      {stage === "warmup" && (
        <>
          <div className="h-20" />
          <div className="px-6 pt-4">
            {!sessionData?.warmupData ? (
              <div className="text-center py-12">
                <p className="text-zinc-500">Loading warmup data...</p>
              </div>
            ) : (
              <WarmupGate
                sessionId={sessionData.session.id}
                warmupData={sessionData.warmupData}
                onUnlock={handleWarmupComplete}
              />
            )}
          </div>
        </>
      )}

      {/* Exercise Stage */}
      {stage === "exercise" && sessionData?.session?.SessionExercise && (
        <>
          <div className="h-20" />
          <div className="px-6 pt-4">
            {(() => {
              const exercises = sessionData.session.SessionExercise;
              const currentExercise = exercises[currentExerciseIndex];
              
              if (!currentExercise) {
                return (
                  <div className="text-center py-12">
                    <p className="text-zinc-500">No exercises found</p>
                  </div>
                );
              }

              return (
                <>
                  {/* Exercise Counter */}
                  <div className="text-center mb-4">
                    <p className="text-sm text-zinc-500 uppercase tracking-wide">
                      Exercise {currentExerciseIndex + 1} of {exercises.length}
                    </p>
                  </div>

                  <ExerciseLogger
                    exercise={currentExercise.Exercise}
                    sessionExerciseId={currentExercise.id}
                    onComplete={handleExerciseComplete}
                  />
                </>
              );
            })()}
          </div>
        </>
      )}

      {/* Pre-Workout Modal */}
      <AnimatePresence>
        {selectedRoutine && (
          <PreWorkoutModal
            routineName={selectedRoutine.name}
            onStart={handleStartWorkout}
            onCancel={handleCancelPreWorkout}
          />
        )}
      </AnimatePresence>

      {/* Post-Workout Modal */}
      <AnimatePresence>
        {stage === "post-workout" && (
          <PostWorkoutModal
            routineName={sessionData?.session?.routine?.name || "Workout"}
            duration={
              workoutStartTime
                ? Math.floor((Date.now() - workoutStartTime.getTime()) / 1000 / 60)
                : 0
            }
            setsCompleted={totalSetsCompleted}
            onComplete={handlePostWorkoutSubmit}
          />
        )}
      </AnimatePresence>


      {/* Resume Modal */}
      <AnimatePresence>
        {showResumeModal && activeSession && (
          <ResumeModal
            session={activeSession}
            onResume={handleResumeWorkout}
            onAbandon={handleAbandonResume}
          />
        )}
      </AnimatePresence>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <ExitConfirmationModal
            onContinue={handleExitContinue}
            onPause={handleExitPause}
            onAbandon={handleExitAbandon}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
