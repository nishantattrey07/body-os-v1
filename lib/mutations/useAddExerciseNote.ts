import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AddExerciseNoteData {
    sessionExerciseId: string;
    note: string;
}

/**
 * Mutation hook for adding exercise notes
 * 
 * Features:
 * - Optional note after completing exercise
 * - Auto-saves on blur
 * - Can update existing note
 */
export function useAddExerciseNote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ sessionExerciseId, note }: AddExerciseNoteData) => {
            const response = await fetch('/api/workout/exercise/note', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionExerciseId, note }),
            });

            if (!response.ok) {
                throw new Error('Failed to save exercise note');
            }

            return response.json();
        },

        onSuccess: (data, variables) => {
            // Invalidate active session to refresh exercise list
            queryClient.invalidateQueries({ queryKey: ['active-session'] });

            // Silent success - user already sees their note
            console.log('[ExerciseNote] Saved:', variables.note.substring(0, 20) + '...');
        },

        onError: (error) => {
            console.error('[ExerciseNote] Error:', error);
            toast.error('Failed to save note');
        },
    });
}
