import { useQuery } from '@tanstack/react-query';

export interface MuscleGroup {
    id: string;
    name: string;
    majorRegion: string;
}

/**
 * Query hook for muscle groups
 * 
 * Used for exercise creation muscle targeting
 */
export function useMuscleGroups() {
    return useQuery({
        queryKey: ['muscle-groups'],
        queryFn: async () => {
            const response = await fetch('/api/muscles');

            if (!response.ok) {
                throw new Error('Failed to fetch muscle groups');
            }

            const data = await response.json();
            return data.muscles as MuscleGroup[];
        },
        staleTime: Infinity, // Muscles rarely change
    });
}
