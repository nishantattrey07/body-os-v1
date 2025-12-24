/**
 * Session Manager - localStorage-based
 * 
 * Manages active workout session state.
 * Reads/writes to localStorage for offline persistence.
 */

export interface ActiveSessionState {
    sessionId: string;
    routineId: string;
    routineName: string;
    stage: 'warmup' | 'exercise' | 'paused' | 'complete';
    currentExerciseIndex: number;
    setsLoggedCount: number;
    exercises: any[];
    startTime: string; // ISO string
    pausedAt?: string;
    warmupData?: any;
}

const STORAGE_KEY = 'workout-active-session';

export class SessionManager {
    /**
     * Get active session from localStorage
     */
    getActiveSession(): ActiveSessionState | null {
        if (typeof window === 'undefined') return null;
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    }

    /**
     * Save active session to localStorage
     */
    saveActiveSession(session: ActiveSessionState): void {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }

    /**
     * Update specific fields in active session
     */
    updateActiveSession(updates: Partial<ActiveSessionState>): void {
        const current = this.getActiveSession();
        if (!current) return;

        this.saveActiveSession({
            ...current,
            ...updates,
        });
    }

    /**
     * Clear active session (on complete/abandon)
     */
    clearActiveSession(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(STORAGE_KEY);
    }

    /**
     * Check if session exists
     */
    hasActiveSession(): boolean {
        return this.getActiveSession() !== null;
    }

    /**
     * Start new session
     */
    startSession(data: {
        sessionId: string;
        routineId: string;
        routineName: string;
        exercises: any[];
        warmupData?: any;
    }): void {
        this.saveActiveSession({
            sessionId: data.sessionId,
            routineId: data.routineId,
            routineName: data.routineName,
            stage: 'warmup',
            currentExerciseIndex: 0,
            setsLoggedCount: 0,
            exercises: data.exercises,
            startTime: new Date().toISOString(),
            warmupData: data.warmupData,
        });
    }

    /**
     * Advance to next exercise
     */
    advanceExercise(): void {
        const session = this.getActiveSession();
        if (!session) return;

        this.updateActiveSession({
            currentExerciseIndex: session.currentExerciseIndex + 1,
        });
    }

    /**
     * Go to specific exercise
     */
    goToExercise(index: number): void {
        this.updateActiveSession({
            currentExerciseIndex: index,
        });
    }

    /**
     * Increment sets logged count
     */
    incrementSetsLogged(): void {
        const session = this.getActiveSession();
        if (!session) return;

        this.updateActiveSession({
            setsLoggedCount: session.setsLoggedCount + 1,
        });
    }

    /**
     * Move to exercise stage (after warmup)
     */
    startExercises(): void {
        this.updateActiveSession({
            stage: 'exercise',
        });
    }

    /**
     * Pause session
     */
    pauseSession(): void {
        this.updateActiveSession({
            stage: 'paused',
            pausedAt: new Date().toISOString(),
        });
    }

    /**
     * Resume session
     */
    resumeSession(): void {
        this.updateActiveSession({
            stage: 'exercise',
            pausedAt: undefined,
        });
    }

    /**
     * Get current exercise
     */
    getCurrentExercise(): any | null {
        const session = this.getActiveSession();
        if (!session) return null;
        return session.exercises[session.currentExerciseIndex] || null;
    }
}

// Singleton instance
export const sessionManager = new SessionManager();
