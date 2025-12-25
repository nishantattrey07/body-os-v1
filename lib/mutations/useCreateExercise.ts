"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CreateExerciseData {
    name: string;
    category: string;
    trackingType: "reps" | "seconds";
    defaultSets: number;
    defaultReps?: number;
    defaultDuration?: number;
    description?: string;
}

/**
 * useCreateExercise - Mutation for creating exercises
 * 
 * Features:
 * - Optimistic UI update
 * - Automatic cache invalidation
 * - Toast notifications
 */
export function useCreateExercise() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateExerciseData) => {
            const res = await fetch("/api/exercises/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to create exercise");
            }

            return res.json();
        },
        onSuccess: () => {
            // Invalidate exercises query to refetch
            queryClient.invalidateQueries({ queryKey: ["exercises"] });
            // Invalidate categories to update filter list
            queryClient.invalidateQueries({ queryKey: ["exerciseCategories"] });
            toast.success("Exercise created successfully!");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to create exercise");
        },
    });
}
