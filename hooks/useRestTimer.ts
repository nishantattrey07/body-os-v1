"use client";

import { useCallback, useRef, useState } from "react";

/**
 * useRestTimer - Reusable hook for rest timer functionality
 * 
 * Extracts the duplicated timer logic from ExerciseLogger into a single hook.
 * Handles countdown, progress calculation, and cleanup.
 */
export function useRestTimer() {
    const [timer, setTimer] = useState<number | null>(null);
    const [timerMax, setTimerMax] = useState(0);
    const [startTime, setStartTime] = useState<Date | null>(null);

    // Use ref to store interval ID for cleanup
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * Start the rest timer with a callback when complete
     * @param duration - Duration in seconds
     * @param onComplete - Callback when timer reaches 0
     */
    const startTimer = useCallback((duration: number, onComplete?: () => void) => {
        // Clear any existing timer
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        if (duration <= 0) {
            // No rest needed, immediately complete
            if (onComplete) {
                setTimeout(() => onComplete(), 0);
            }
            return;
        }

        setTimerMax(duration);
        setTimer(duration);
        setStartTime(new Date());

        intervalRef.current = setInterval(() => {
            setTimer((prev) => {
                if (prev === null || prev <= 1) {
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                    // Defer completion to next tick to avoid setState-in-render
                    if (onComplete) {
                        setTimeout(() => onComplete(), 0);
                    }
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    /**
     * Skip the rest timer immediately
     */
    const skipTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setTimer(null);
        setStartTime(null);
    }, []);

    /**
     * Get the actual rest time taken (for logging)
     */
    const getActualRestTaken = useCallback((): number | undefined => {
        if (!startTime) return undefined;
        const restTaken = Math.floor((Date.now() - startTime.getTime()) / 1000);
        setStartTime(null);
        return restTaken;
    }, [startTime]);

    // Calculate progress percentage (0-100)
    const progress = timerMax > 0 ? ((timerMax - (timer || 0)) / timerMax) * 100 : 0;

    // Is timer currently active?
    const isActive = timer !== null && timer > 0;

    return {
        timer,
        timerMax,
        progress,
        isActive,
        startTimer,
        skipTimer,
        getActualRestTaken,
    };
}
