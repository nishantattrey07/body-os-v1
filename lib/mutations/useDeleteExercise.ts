"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * useDeleteExercise - Mutation for deleting exercises
 */
export function useDeleteExercise() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/exercises/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to delete exercise");
            }

            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exercises"] });
            toast.success("Exercise deleted successfully!");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete exercise");
        },
    });
}
