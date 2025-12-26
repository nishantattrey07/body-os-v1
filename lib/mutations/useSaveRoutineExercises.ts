import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ExerciseConfig {
    exerciseId: string;
    sets: number;
    reps?: number | null;
    duration?: number | null;
    restSeconds: number;
}

/**
 * Mutation for saving routine exercises (draft mode)
 * 
 * All changes saved in one atomic transaction
 */
export function useSaveRoutineExercises() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ routineId, exercises }: { routineId: string; exercises: ExerciseConfig[] }) => {
            const response = await fetch(`/api/routines/${routineId}/exercises`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ exercises }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to save exercises");
            }

            return response.json();
        },
        onSuccess: (data, variables) => {
            // Update routine cache with new data
            queryClient.setQueryData(["routine", variables.routineId], data);

            // Invalidate routines list to show updated exercise count
            queryClient.invalidateQueries({ queryKey: ["routines"] });

            // Silent success - navigation provides feedback
        },
        onError: (error) => {
            toast.error(error.message || "Failed to save routine");
        },
    });
}
