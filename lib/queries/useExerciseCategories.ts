"use client";

import { useQuery } from "@tanstack/react-query";

/**
 * useExerciseCategories - Fetches all unique exercise categories
 */
export function useExerciseCategories() {
    return useQuery({
        queryKey: ["exerciseCategories"],
        queryFn: async () => {
            const res = await fetch("/api/exercises/categories");
            if (!res.ok) throw new Error("Failed to fetch categories");
            const data = await res.json();
            return data.categories as string[];
        },
    });
}
