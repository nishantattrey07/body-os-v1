"use client";

import { useQuery } from "@tanstack/react-query";

interface Exercise {
    id: string;
    name: string;
    category: string;
    trackingType: string;
    defaultSets: number;
    defaultReps: number | null;
    defaultDuration: number | null;
    description: string | null;
    isSystem: boolean;
}

interface UseExercisesParams {
    search?: string;
    category?: string;
    filter?: "all" | "system" | "user";
    limit?: number;
}

interface ExercisesResponse {
    exercises: Exercise[];
    nextCursor: string | null;
    hasMore: boolean;
}

/**
 * useExercises - React Query hook for fetching exercises
 * 
 * Supports search, category filter, owner filter, and pagination.
 * Uses initialData for instant page load, with background refetch.
 */
export function useExercises(
    params: UseExercisesParams = {},
    initialData?: ExercisesResponse
) {
    const { search, category, filter = "all", limit = 20 } = params;

    return useQuery({
        queryKey: ["exercises", { search, category, filter, limit }],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (search) searchParams.set("search", search);
            if (category) searchParams.set("category", category);
            if (filter) searchParams.set("filter", filter);
            searchParams.set("limit", limit.toString());

            const res = await fetch(`/api/exercises?${searchParams.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch exercises");
            return res.json() as Promise<ExercisesResponse>;
        },
        initialData: !search && !category && filter === "all" ? initialData : undefined,
        staleTime: 0, // Always refetch when params change
        gcTime: 0, // Don't cache old query results
    });
}
