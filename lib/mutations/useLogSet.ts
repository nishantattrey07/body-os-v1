/**
 * useLogSet - Offline-first set logging
 * 
 * Instantly saves set to localStorage, then syncs to server in background.
 * Critical for reliability - no data loss even if app crashes mid-workout.
 */

import { useOfflineMutation } from '@/lib/offline';
import { useQueryClient } from '@tanstack/react-query';

export interface LogSetData {
    sessionExerciseId: string;
    setNumber: number;
    actualReps?: number;
    actualSeconds?: number;
    weight?: number;
    weightUnit?: string;
    rpe?: number;
    painLevel?: number;
    painLocation?: string;
    restTaken?: number;
    isWarmupSet?: boolean;
    isDropSet?: boolean;
    isFailure?: boolean;
    formNotes?: string;
    aggravatedBlockerId?: string;
}

export function useLogSet() {
    const queryClient = useQueryClient();

    return useOfflineMutation<any, LogSetData>({
        operationType: 'LOG_SET',

        // Optimistic update handled by component (localStorage)

        onSyncSuccess: (data) => {
            // Invalidate session queries to refetch updated set logs
            queryClient.invalidateQueries({ queryKey: ['active-session'] });
        },

        invalidateQueries: [['active-session']],
    });
}
