/**
 * useToggleWarmup - Offline-first warmup toggle
 * 
 * Pattern:
 * 1. Enqueue operation (instant)
 * 2. Apply optimistic update (instant UI)
 * 3. Background sync to server
 */

import { useOfflineMutation } from '@/lib/offline';

export interface ToggleWarmupData {
    sessionId: string;
    warmupChecklistId: string;
    completed: boolean;
}

export function useToggleWarmup() {
    return useOfflineMutation<any, ToggleWarmupData>({
        operationType: 'TOGGLE_WARMUP',

        // No optimistic update needed - component handles it locally

        invalidateQueries: [],
    });
}
