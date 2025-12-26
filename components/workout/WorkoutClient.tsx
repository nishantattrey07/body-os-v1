"use client";

import { useSupersetFlow } from "@/hooks/useSupersetFlow";
import { useCreateSession } from "@/lib/mutations/useCreateSession";
import { sessionManager } from "@/lib/offline";
import type { SessionExercise } from "@/types/workout";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Dumbbell, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null);
  const [totalPauseSeconds, setTotalPauseSeconds] = useState(0);
  const [totalSetsCompleted, setTotalSetsCompleted] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  
  // Pagination state
  const [routines, setRoutines] = useState(initialRoutines);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const createSession = useCreateSession();

  // Check for active/paused session on mount
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const response = await fetch("/api/workout-session");
        const data = await response.json();
        
        // Show resume modal for any IN_PROGRESS session
        // The abandon API will delete if warmup not completed
        if (data.session && data.session.status === "IN_PROGRESS") {
          setActiveSession(data.session);
          setShowResumeModal(true);
        }
      } catch (error) {
        console.error("Error checking active session:", error);
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

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCursor(null); // Reset pagination when search changes
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reload routines when search or filter changes
  useEffect(() => {
    if (stage === "select") {
      loadRoutines(true);
    }
  }, [debouncedSearch, filter]);

  // Load routines with pagination
  const loadRoutines = async (resetList = false) => {
    if (resetList) {
      setLoading(true);
      setCursor(null);
    }

    try {
      const params = new URLSearchParams({
        includeSystem: filter !== "user" ? "true" : "false",
        includeUser: filter !== "system" ? "true" : "false",
        limit: "20",
      });

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (!resetList && cursor) params.set("cursor", cursor);

      const response = await fetch(`/api/routines?${params}`);
      if (!response.ok) throw new Error("Failed to load routines");

      const { items, nextCursor, hasMore: more } = await response.json();

      if (resetList) {
        setRoutines(items);
      } else {
        setRoutines((prev) => [...prev, ...items]);
      }

      setCursor(nextCursor);
      setHasMore(more);
      setLoading(false);
      setLoadingMore(false);
    } catch (error) {
      console.error("[WorkoutClient] Failed to load routines:", error);
      setLoading(false);
      setLoadingMore(false);
      toast.error("Failed to load routines");
    }
  };

  const loadMoreRoutines = async () => {
    if (!hasMore || loadingMore || !cursor) return;
    setLoadingMore(true);
    await loadRoutines(false);
  };

  // Intersection Observer for infinite scroll
  const observerRef = useRef<IntersectionObserver | undefined>(undefined);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreRoutines();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [loadingMore, hasMore, cursor]
  );

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

  const handleBack = async () => {
    if (stage === "select") {
      router.back();
    } else if (stage === "warmup") {
      // IMMEDIATELY clear any active session state to prevent stale ResumeModal
      setActiveSession(null);
      setShowResumeModal(false);
      
      // Delete incomplete warmup session
      if (sessionData?.session?.id) {
        try {
          const response = await fetch(`/api/workout/delete`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: sessionData.session.id }),
          });
          
          if (!response.ok) {
            throw new Error("Failed to delete session");
          }
          
          const result = await response.json();
        } catch (error) {
          console.error("Failed to delete warmup session:", error);
          toast.error("Failed to delete session");
          return; // Don't proceed if delete failed
        }
      }
      
      // Clear state AFTER successful deletion
      sessionManager.clearActiveSession();
      setSessionData(null);
      setStage("select");
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

    setPauseStartTime(new Date());  // ← Track pause start
    setShowExitConfirm(false);
    setStage("select");
    setSessionData(null);
    // Pause feedback via UI navigation to dashboard
    sessionManager.clearActiveSession();
  };

  const handleExitAbandon = async () => {
    if (!sessionData?.session?.id) return;

    try {
      const response = await fetch("/api/workout/abandon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionData.session.id }),
      });

      if (!response.ok) throw new Error("Failed to abandon session");

      setShowExitConfirm(false);
      // Abandon feedback via UI navigation
      sessionManager.clearActiveSession();
      router.push("/");
    } catch (error) {
      console.error("[WorkoutClient] Failed to abandon session:", error);
      toast.error("Failed to abandon workout");
    }

  };
  const handleResumeWorkout = () => {
    if (!activeSession) return;
    setShowResumeModal(false);
    
    // Calculate pause duration if paused
    if (pauseStartTime) {
      const pauseDuration = Math.floor(
        (Date.now() - pauseStartTime.getTime()) / 1000
      );
      setTotalPauseSeconds((prev) => prev + pauseDuration);
      setPauseStartTime(null);
    }
    
    const exercises = activeSession.SessionExercise || [];
    const incompleteIndex = exercises.findIndex((e: any) => !e.completedAt && !e.skipped);
    
    // Set sessionData with proper structure
    setSessionData({
      session: activeSession,
      warmupData: null // Already completed if resuming
    });
    
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
      // Mark session as ABANDONED (preserves data)
      await fetch("/api/workout/abandon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSession.id }),
      });
      setShowResumeModal(false);
      setActiveSession(null);
      sessionManager.clearActiveSession();
      // Discard feedback via UI navigation
    } catch (error) {
      console.error("Failed to abandon workout:", error);
      toast.error("Failed to discard workout");
    }
  };

  const handleStartFresh = async () => {
    if (!activeSession?.id) return;

    try {
      // 1. Abandon current session (marks as ABANDONED)
      const response = await fetch("/api/workout/abandon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSession.id }),
      });

      if (!response.ok) throw new Error("Failed to abandon session");

      // 2. Extract routine from active session
      const routineToRestart = activeSession.WorkoutRoutine;

      if (!routineToRestart) {
        // Fallback: if no routine, just discard
        console.warn("[WorkoutClient] No routine found in session, discarding");
        setShowResumeModal(false);
        setActiveSession(null);
        sessionManager.clearActiveSession();
        toast.info("Workout discarded");
        return;
      }

      // 3. Select the routine (triggers PreWorkoutModal)
      setSelectedRoutine(routineToRestart);

      // 4. Clean up state
      setShowResumeModal(false);
      setActiveSession(null);
      sessionManager.clearActiveSession();

      // Restart feedback via session reset

      // PreWorkoutModal will open automatically because selectedRoutine !== null
    } catch (error) {
      console.error("[WorkoutClient] Failed to start fresh:", error);
      toast.error("Failed to restart workout");
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

  // Get exercises array for superset hook
  const exercises: SessionExercise[] = sessionData?.session?.SessionExercise || [];

  // Use the superset flow hook - encapsulates all superset logic
  const { supersetContext } = useSupersetFlow(
    exercises,
    currentExerciseIndex,
    setCurrentExerciseIndex
  );

  const handlePostWorkoutSubmit = async (data: PostWorkoutData) => {
    if (!sessionData?.session?.id) return;

    // Calculate timing metrics
    const totalDuration = workoutStartTime
      ? Math.floor((Date.now() - workoutStartTime.getTime()) / 1000)
      : 0;
    const activeDuration = totalDuration - totalPauseSeconds;

    try {
      const response = await fetch("/api/workout/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionData.session.id,
          ...data,
          totalDuration,       // ← Total time including pauses
          activeDuration,      // ← Active training time
          pauseDuration: totalPauseSeconds,  // ← Time spent paused
        }),
      });

      if (!response.ok) throw new Error("Failed to complete session");

      // Completion feedback via modal
      sessionManager.clearActiveSession();
      
      // Navigate immediately - component will unmount, no need to clear state
      router.push("/");
      
      // State clearing not needed - component unmounts on navigation
      // setWorkoutStartTime(null);
      // setTotalPauseSeconds(0);
      // setPauseStartTime(null);
    } catch (error) {
      console.error("[WorkoutClient] Failed to complete session:", error);
      toast.error("Failed to save workout completion");
    }
  };

  const getHeaderTitle = () => {
    if (stage === "select") return "Select Routine";
    if (stage === "warmup") return "Warmup";
    if (stage === "exercise") {
      // Show routine name instead of exercise name
      return sessionData?.session?.WorkoutRoutine?.name || "Workout";
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
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-full p-6 rounded-3xl bg-white border border-zinc-100 animate-pulse"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-zinc-100" />
                      <div className="flex-1">
                        <div className="h-6 w-32 bg-zinc-200 rounded mb-2" />
                        <div className="h-4 w-48 bg-zinc-100 rounded mb-1" />
                        <div className="h-3 w-20 bg-zinc-100 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : routines.length === 0 ? (
              <div className="text-center py-12">
                <Dumbbell size={48} className="mx-auto text-zinc-300 mb-4" />
                <p className="text-zinc-500 mb-4">
                  {search ? "No routines match your search" : "No routines available"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {routines.map((routine: any, index: number) => (
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
                {/* Load More Trigger */}
                {hasMore && (
                  <div ref={loadMoreRef} className="py-8 text-center">
                    {loadingMore && (
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.1}s` }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
                  {/* Exercise Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-zinc-500">Exercise Progress</span>
                      <span className="text-sm font-medium text-zinc-700">
                        {currentExerciseIndex + 1} / {exercises.length}
                      </span>
                    </div>
                    <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 transition-all duration-300"
                        style={{ 
                          width: `${((currentExerciseIndex + 1) / exercises.length) * 100}%` 
                        }}
                      />
                    </div>
                  </div>

                  <ExerciseLogger
                    exercise={{
                      ...currentExercise.Exercise,
                      defaultSets: currentExercise.targetSets,
                      defaultReps: currentExercise.targetReps,
                      defaultDuration: currentExercise.targetDuration,
                      defaultRestSeconds: currentExercise.restSeconds,
                      targetWeight: currentExercise.targetWeight,
                      targetDistance: currentExercise.targetDistance,
                      targetDistanceUnit: currentExercise.targetDistanceUnit,
                    }}
                    sessionExerciseId={currentExercise.id}
                    onComplete={handleExerciseComplete}
                    supersetContext={supersetContext}
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
            onStartFresh={handleStartFresh}
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
          />
        )}
      </AnimatePresence>
    </div>
  );
}
