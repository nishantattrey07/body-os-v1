"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UpdateExerciseData {
    name: string;
    category: string;
    trackingType: "reps" | "seconds";
    defaultSets: number;
    defaultReps?: number;
    defaultDuration?: number;
    description?: string;
}

/**
 * useUpdateExercise - Mutation for updating exercises
 */
export function useUpdateExercise() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateExerciseData }) => {
            const res = await fetch(`/api/exercises/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to update exercise");
            }

            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exercises"] });
            toast.success("Exercise updated successfully!");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update exercise");
        },
    });
}
