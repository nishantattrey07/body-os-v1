import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CreateRoutineData {
    name: string;
    description?: string;
}

/**
 * React Query mutation for creating routines
 * 
 * Properly integrates with React Query cache.
 * Optimistic updates handled by React Query.
 */
export function useCreateRoutine() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateRoutineData) => {
            const response = await fetch("/api/routines/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create routine");
            }

            return response.json();
        },
        onMutate: async (newRoutine) => {
            // Cancel all outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["routines"] });

            // Snapshot all previous queries
            const previousQueries = queryClient.getQueriesData({ queryKey: ["routines"] });

            // Optimistically update ALL matching queries
            queryClient.setQueriesData(
                { queryKey: ["routines"] },
                (old: any) => {
                    if (!old?.items) return old;

                    const optimisticRoutine = {
                        id: `temp-${Date.now()}`,
                        name: newRoutine.name,
                        description: newRoutine.description || null,
                        isSystem: false,
                        RoutineExercise: [],
                    };

                    return {
                        ...old,
                        items: [optimisticRoutine, ...old.items],
                    };
                }
            );

            return { previousQueries };
        },
        onError: (error, newRoutine, context) => {
            // Rollback ALL queries
            if (context?.previousQueries) {
                context.previousQueries.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            toast.error(error.message || "Failed to create routine");
        },
        onSuccess: () => {
            toast.success("Routine created successfully");
        },
        onSettled: () => {
            // Refetch to sync with server
            queryClient.invalidateQueries({
                queryKey: ["routines"],
                refetchType: "all",
            });
        },
    });
}
