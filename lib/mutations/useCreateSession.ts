/**
 * useCreateSession - Offline-first workout session creation
 * 
 * Pattern:
 * 1. Make API call immediately (if online)
 * 2. Save session to localStorage
 * 3. Return session data for UI
 * 4. Queue for retry if offline
 * 5. Sends client timezone for correct workout date
 */

import { getTimezoneHeaders } from '@/lib/api-client';
import { sessionManager } from '@/lib/offline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface CreateSessionData {
    routineId: string;
    routineName: string;
    preWorkoutEnergy: number;
    stressLevel: number;
    soreness: number;
    fastedWorkout: boolean;
    caffeineIntake?: number;
}

export function useCreateSession() {
    const queryClient = useQueryClient();

    return useMutation<any, Error, CreateSessionData>({
        mutationFn: async (variables) => {
            // Call API immediately
            const response = await fetch('/api/workout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getTimezoneHeaders(),
                },
                body: JSON.stringify(variables),
            });

            if (!response.ok) {
                throw new Error('Failed to create session');
            }

            const data = await response.json();

            // Save to localStorage immediately
            sessionManager.startSession({
                sessionId: data.session.id,
                routineId: variables.routineId,
                routineName: variables.routineName,
                exercises: data.session.SessionExercise || [],
                warmupData: data.warmupData,
            });

            // Silent success - navigation to workout provides feedback

            return data; // Return full session data
        },

        onSuccess: (data) => {
            // Invalidate active session query
            queryClient.invalidateQueries({ queryKey: ['active-session'] });
        },

        onError: (error) => {
            console.error('[CreateSession] Error:', error);
            toast.error('Failed to start session. Please try again.');
        },
    });
}
