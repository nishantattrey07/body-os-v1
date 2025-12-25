import { useQuery } from "@tanstack/react-query";

/**
 * Hook to fetch a single routine with exercises
 */
export function useRoutine(id: string, initialData?: any) {
    return useQuery({
        queryKey: ["routine", id],
        queryFn: async () => {
            const response = await fetch(`/api/routines/${id}`);
            if (!response.ok) throw new Error("Failed to fetch routine");
            return response.json();
        },
        initialData,
        staleTime: 0,
    });
}

/**
 * Hook to fetch all exercises for the  exercise picker
 */
export function useExercises(initialData?: any) {
    return useQuery({
        queryKey: ["exercises"],
        queryFn: async () => {
            const response = await fetch("/api/exercises");
            if (!response.ok) throw new Error("Failed to fetch exercises");
            return response.json();
        },
        initialData,
        staleTime: 300000, // 5 minutes - exercises don't change often
    });
}
