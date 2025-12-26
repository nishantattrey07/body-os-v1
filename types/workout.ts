/**
 * Workout Type Definitions
 * Provides proper typing for workout session exercises and superset logic.
 */

/**
 * Exercise details from the Exercise table
 */
export interface ExerciseDetails {
    id: string;
    name: string;
    trackingType: "reps" | "seconds";
    tracksDistance?: boolean;
    defaultSets?: number;
    defaultReps?: number | null;
    defaultDuration?: number | null;
    defaultDistance?: number | null;
}

/**
 * SessionExercise - A single exercise within a workout session
 * This is the shape of data from SessionExercise table with joined Exercise
 */
export interface SessionExercise {
    id: string;
    sessionId: string;
    exerciseId: string;
    order: number;
    supersetId: string | null;
    targetSets: number;
    targetReps: number | null;
    targetDuration: number | null;
    targetWeight: number | null;
    targetDistance: number | null;
    targetDistanceUnit: string | null;
    restSeconds: number;
    completedAt: Date | null;
    Exercise: ExerciseDetails;
}

/**
 * SupersetContext - Passed to ExerciseLogger to control superset behavior
 * Replaces 6 individual props with a single context object
 */
export interface SupersetContext {
    /** Is this exercise part of a superset group? */
    isInSuperset: boolean;

    /** Should we skip rest and transition to next exercise? (A→B) */
    isSupersetTransition: boolean;

    /** Is this the last exercise in the superset chain? (C in A-B-C) */
    isLastOfSuperset: boolean;

    /** Name of the next exercise (for "Up Next" indicator) */
    nextExerciseName?: string;

    /** Called after logging a set to track completion */
    onSetComplete: (setNumber: number) => void;

    /** Called after rest timer for last superset exercise - loops back */
    onAfterRest: () => void;
}

/**
 * SupersetTracking - Internal state for tracking set completions
 * Maps exercise ID to number of completed sets
 */
export type SupersetCompletedSets = Record<string, number>;
