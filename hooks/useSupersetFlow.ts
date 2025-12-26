"use client";

import type { SessionExercise, SupersetCompletedSets, SupersetContext } from "@/types/workout";
import { useCallback, useState } from "react";

/**
 * useSupersetFlow - Encapsulates all superset state and logic
 * 
 * Replaces the inline helper functions and state in WorkoutClient:
 * - completedSets tracking
 * - findSupersetStart()
 * - getSupersetExercises()
 * - findNextIncompleteInSuperset()
 * - isInSuperset, isSupersetTransition, isLastOfSuperset calculations
 */
export function useSupersetFlow(
    exercises: SessionExercise[],
    currentIndex: number,
    onNavigate: (index: number) => void
) {
    const [completedSets, setCompletedSets] = useState<SupersetCompletedSets>({});

    const currentExercise = exercises[currentIndex];
    const nextExercise = exercises[currentIndex + 1];

    // ─────────────────────────────────────────────────────────────────────────────
    // Helper Functions
    // ─────────────────────────────────────────────────────────────────────────────

    /** Get all exercises in a superset group */
    const getSupersetExercises = useCallback(
        (supersetId: string): SessionExercise[] => {
            return exercises.filter((ex) => ex.supersetId === supersetId);
        },
        [exercises]
    );

    /** Find the starting index of the current superset */
    const findSupersetStart = useCallback(
        (endIndex: number): number => {
            const supersetId = exercises[endIndex]?.supersetId;
            if (!supersetId) return endIndex;

            for (let i = endIndex - 1; i >= 0; i--) {
                if (exercises[i].supersetId !== supersetId) return i + 1;
            }
            return 0;
        },
        [exercises]
    );

    /** Find the first incomplete exercise in superset (for mismatch set counts) */
    const findNextIncompleteInSuperset = useCallback(
        (fromIndex: number): number => {
            const supersetId = exercises[fromIndex]?.supersetId;
            if (!supersetId) return fromIndex + 1;

            // Find superset start
            let startIdx = fromIndex;
            while (startIdx > 0 && exercises[startIdx - 1].supersetId === supersetId) {
                startIdx--;
            }

            // Scan forward to find first that still needs sets
            let checkIdx = startIdx;
            while (checkIdx < exercises.length && exercises[checkIdx].supersetId === supersetId) {
                const ex = exercises[checkIdx];
                const completed = completedSets[ex.id] || 0;
                if (completed < ex.targetSets) {
                    return checkIdx;
                }
                checkIdx++;
            }

            // All done - return next exercise after superset
            return checkIdx;
        },
        [exercises, completedSets]
    );

    // ─────────────────────────────────────────────────────────────────────────────
    // Calculations
    // ─────────────────────────────────────────────────────────────────────────────

    const isInSuperset = !!currentExercise?.supersetId;

    const isLinkedToNext =
        currentExercise?.supersetId &&
        nextExercise?.supersetId === currentExercise.supersetId;

    // Check if entire superset group is finished
    const supersetExercises = isInSuperset
        ? getSupersetExercises(currentExercise.supersetId!)
        : [];

    const allSupersetDone = supersetExercises.every((ex) => {
        const completed = completedSets[ex.id] || 0;
        return completed >= ex.targetSets;
    });

    // Calculate next exercise name (for A/B) or loop-back name (for C)
    let nextExerciseName: string | undefined;
    if (isLinkedToNext) {
        nextExerciseName = nextExercise.Exercise.name;
    } else if (isInSuperset && !allSupersetDone) {
        const nextIncompleteIdx = findNextIncompleteInSuperset(currentIndex);
        if (nextIncompleteIdx !== currentIndex) {
            nextExerciseName = exercises[nextIncompleteIdx]?.Exercise?.name;
        }
    }

    // Is this the LAST exercise in the superset chain?
    // Only true if not all done - prevents loop-back when genuinely finished
    const isLastOfSuperset = isInSuperset && !isLinkedToNext && !allSupersetDone;
    const isSupersetTransition = !!isLinkedToNext;

    // ─────────────────────────────────────────────────────────────────────────────
    // Callbacks
    // ─────────────────────────────────────────────────────────────────────────────

    /** Track set completion for an exercise */
    const trackSetComplete = useCallback(
        (setNumber: number) => {
            if (!currentExercise) return;

            setCompletedSets((prev) => ({
                ...prev,
                [currentExercise.id]: setNumber,
            }));
        },
        [currentExercise]
    );

    /** Handle set completion - navigates to next exercise if needed */
    const handleSetComplete = useCallback(
        (setNumber: number) => {
            if (!currentExercise) return;

            trackSetComplete(setNumber);

            // Check if this is the LAST set of the current exercise
            const isLastSet = setNumber >= currentExercise.targetSets;

            // CRITICAL: Only transition if this is NOT the last set!
            // If it's the last set, let ExerciseLogger handle completion normally
            if (!isLastSet) {
                // Check if CURRENTLY linked to next (don't use captured closure value!)
                const next = exercises[currentIndex + 1];
                const linkedToNext = currentExercise.supersetId &&
                    next?.supersetId === currentExercise.supersetId;

                if (linkedToNext) {
                    // A→B: Move to next exercise in superset (without rest)
                    onNavigate(currentIndex + 1);
                }
            }
            // For isLastOfSuperset, the ExerciseLogger handles rest timer
            // and calls handleAfterRest when done
        },
        [currentExercise, exercises, currentIndex, trackSetComplete, onNavigate]
    );

    /** Navigate after rest timer - smart skip to next incomplete exercise */
    const handleAfterRest = useCallback(() => {
        const nextIdx = findNextIncompleteInSuperset(currentIndex);
        onNavigate(nextIdx);
    }, [findNextIncompleteInSuperset, currentIndex, onNavigate]);

    // ─────────────────────────────────────────────────────────────────────────────
    // Build Context Object
    // ─────────────────────────────────────────────────────────────────────────────

    const supersetContext: SupersetContext | undefined = isInSuperset
        ? {
            isInSuperset,
            isSupersetTransition,
            isLastOfSuperset,
            nextExerciseName,
            onSetComplete: handleSetComplete,
            onAfterRest: handleAfterRest,
        }
        : undefined;

    return {
        supersetContext,
        completedSets,
        allSupersetDone,
        trackSetComplete,
    };
}
