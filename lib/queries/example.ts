import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Example: Fetching data with TanStack Query
export function useExample() {
    return useQuery({
        queryKey: ["example"],
        queryFn: async () => {
            // Example API call
            const response = await fetch("/api/example");
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        },
    });
}

// Example: Mutation with optimistic updates
export function useCreateExample() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { name: string }) => {
            const response = await fetch("/api/example", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error("Failed to create example");
            }

            return response.json();
        },
        onSuccess: () => {
            // Invalidate and refetch
            queryClient.invalidateQueries({ queryKey: ["example"] });
        },
    });
}
