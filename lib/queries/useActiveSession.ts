/**
 * useActiveSession - Query active workout session
 */

import { sessionManager } from '@/lib/offline';
import { useQuery } from '@tanstack/react-query';

export function useActiveSession() {
    return useQuery({
        queryKey: ['active-session'],
        queryFn: async () => {
            // First check localStorage (instant)
            const localSession = sessionManager.getActiveSession();

            // Then fetch from server (background)
            try {
                const response = await fetch('/api/workout-session');
                const data = await response.json();

                // Server wins if exists
                if (data.session) {
                    // Update localStorage with server state
                    sessionManager.saveActiveSession({
                        sessionId: data.session.id,
                        routineId: data.session.routineId,
                        routineName: data.session.WorkoutRoutine?.name || '',
                        stage: data.session.warmupCompleted ? 'exercise' : 'warmup',
                        currentExerciseIndex: 0, // TODO: Calculate from completed exercises
                        setsLoggedCount: 0, // TODO: Calculate from set logs
                        exercises: data.session.SessionExercise || [],
                        startTime: data.session.startedAt,
                    });
                    return data.session;
                }

                return localSession;
            } catch (error) {
                // Offline - use local data
                return localSession;
            }
        },
        staleTime: 30000, // 30 seconds
    });
}
