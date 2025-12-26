import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * React Query mutation for deleting routines
 */
export function useDeleteRoutine() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/routines/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete routine");
            }

            return response.json();
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["routines"] });
            const previousQueries = queryClient.getQueriesData({ queryKey: ["routines"] });

            queryClient.setQueriesData(
                { queryKey: ["routines"] },
                (old: any) => {
                    if (!old?.items) return old;

                    return {
                        ...old,
                        items: old.items.filter((routine: any) => routine.id !== id),
                    };
                }
            );

            return { previousQueries };
        },
        onError: (error, id, context) => {
            if (context?.previousQueries) {
                context.previousQueries.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            toast.error(error.message || "Failed to delete routine");
        },
        onSuccess: () => {
            // Silent success - UI update provides feedback
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["routines"],
                refetchType: "all",
            });
        },
    });
}
