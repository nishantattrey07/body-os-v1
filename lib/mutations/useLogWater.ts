import { getTimezoneHeaders } from '@/lib/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Mutation hook for logging water intake
 * 
 * Features:
 * - Sends client timezone for correct day boundary calculation
 * - Optimistic UI updates (instant feedback)
 * - Error rollback (restores previous state on failure)
 * - Toast notifications
 */
export function useLogWater() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (amount: number) => {
            const response = await fetch('/api/water-log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getTimezoneHeaders(),
                },
                body: JSON.stringify({ amount }),
            });

            if (!response.ok) {
                throw new Error('Failed to log water');
            }

            return response.json();
        },

        // ✅ OPTIMISTIC UPDATE - Instant UI feedback
        onMutate: async (amount) => {
            // Cancel outgoing queries
            await queryClient.cancelQueries({ queryKey: ['daily-log', 'today'] });

            // Snapshot current state
            const previous = queryClient.getQueryData(['daily-log', 'today']);

            // Optimistically update cache
            queryClient.setQueryData(['daily-log', 'today'], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    waterTotal: (old.waterTotal || 0) + amount,
                };
            });

            return { previous };
        },

        // ✅ ERROR ROLLBACK
        onError: (error, amount, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['daily-log', 'today'], context.previous);
            }
            toast.error('Failed to log water - will retry');
        },

        // ✅ SUCCESS - Background sync
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-log', 'today'] });
        },
    });
}
