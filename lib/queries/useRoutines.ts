import { useQuery } from "@tanstack/react-query";

interface RoutinesParams {
    search?: string;
    filter?: "all" | "system" | "user";
}

/**
 * React Query hook for fetching routines
 * 
 * Fixed to properly refetch when search/filter changes
 */
export function useRoutines(params: RoutinesParams = {}, initialData?: any) {
    const { search, filter = "all" } = params;

    // Only use initialData for default state (no search, "all" filter)
    const shouldUseInitialData = !search && filter === "all";

    return useQuery({
        queryKey: ["routines", { search, filter }],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (search) searchParams.set("search", search);
            searchParams.set("includeSystem", String(filter !== "user"));
            searchParams.set("includeUser", String(filter !== "system"));
            searchParams.set("limit", "20");

            const response = await fetch(`/api/routines?${searchParams}`);
            if (!response.ok) {
                throw new Error("Failed to fetch routines");
            }
            return response.json();
        },
        initialData: shouldUseInitialData ? initialData : undefined,
        staleTime: 0, // Always refetch when params change
        gcTime: 0, // Don't keep old data in cache
    });
}
