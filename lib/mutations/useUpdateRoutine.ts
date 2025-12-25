import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UpdateRoutineData {
    name: string;
    description?: string;
}

/**
 * React Query mutation for updating routines
 */
export function useUpdateRoutine() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateRoutineData }) => {
            const response = await fetch(`/api/routines/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update routine");
            }

            return response.json();
        },
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: ["routines"] });
            const previousQueries = queryClient.getQueriesData({ queryKey: ["routines"] });

            queryClient.setQueriesData(
                { queryKey: ["routines"] },
                (old: any) => {
                    if (!old?.items) return old;

                    return {
                        ...old,
                        items: old.items.map((routine: any) =>
                            routine.id === id ? { ...routine, ...data } : routine
                        ),
                    };
                }
            );

            return { previousQueries };
        },
        onError: (error, variables, context) => {
            if (context?.previousQueries) {
                context.previousQueries.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            toast.error(error.message || "Failed to update routine");
        },
        onSuccess: () => {
            toast.success("Routine updated successfully");
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["routines"],
                refetchType: "all",
            });
        },
    });
}
