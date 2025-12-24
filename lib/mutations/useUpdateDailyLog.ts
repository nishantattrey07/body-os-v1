import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface UpdateDailyLogData {
    weight?: number;
    sleepHours?: number;
    sleepQuality?: number;
    mood?: string;
}

/**
 * Mutation hook for updating daily log (weight, sleep, mood)
 * 
 * Features:
 * - Optimistic UI updates (instant feedback)
 * - Error rollback (restores previous state on failure)
 * - Toast notifications
 */
export function useUpdateDailyLog() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateDailyLogData) => {
            const response = await fetch('/api/daily-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Failed to update daily log');
            }

            return response.json();
        },

        // ✨ OPTIMISTIC UPDATE - Instant UI feedback
        onMutate: async (data) => {
            // Cancel outgoing queries
            await queryClient.cancelQueries({ queryKey: ['daily-log', 'today'] });

            // Snapshot current state
            const previous = queryClient.getQueryData(['daily-log', 'today']);

            // Optimistically update cache
            queryClient.setQueryData(['daily-log', 'today'], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    ...data,
                };
            });

            return { previous };
        },

        // ❌ ERROR ROLLBACK
        onError: (error, data, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['daily-log', 'today'], context.previous);
            }
            toast.error('Failed to save check-in');
        },

        // ✅ SUCCESS - Background sync
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-log', 'today'] });
        },
    });
}
