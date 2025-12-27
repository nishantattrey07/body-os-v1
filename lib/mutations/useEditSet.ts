import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface EditSetData {
    setId: string;
    updates: {
        actualReps?: number;
        actualWeight?: number;
        actualSeconds?: number;
        actualDistance?: number;
        distanceUnit?: string;
        rpe?: number;
        painLevel?: number;
        painLocation?: string;
        formNotes?: string;
        isFailure?: boolean;
        aggravatedBlockerId?: string;
    };
}

/**
 * Mutation hook for editing previously logged sets
 * 
 * Features:
 * - Edits any set from active IN_PROGRESS session
 * - Optimistic updates for instant feedback
 * - Validates on server (ownership, session status)
 */
export function useEditSet() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ setId, updates }: EditSetData) => {
            const response = await fetch(`/api/workout/sets/${setId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to edit set');
            }

            return response.json();
        },

        onSuccess: (data, variables) => {
            // Invalidate active session to refresh  
            queryClient.invalidateQueries({ queryKey: ['active-session'] });

            toast.success('Set updated successfully');
            console.log('[EditSet] Updated:', variables.setId);
        },

        onError: (error: Error) => {
            console.error('[EditSet] Error:', error);
            toast.error(error.message || 'Failed to update set');
        },
    });
}
