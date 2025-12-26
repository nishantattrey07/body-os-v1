import { useQuery } from '@tanstack/react-query';

export interface UserSettings {
    id: string;
    userId: string;
    proteinTarget: number;
    carbsTarget: number;
    fatsTarget: number;
    fiberTarget: number;
    caloriesTarget: number;
    waterTarget: number;
    dayCutoffHour: number;
    dayCutoffMinute: number;
}

/**
 * Query hook for user settings
 * 
 * Settings change rarely, so we cache aggressively
 */
export function useUserSettings(initialData?: UserSettings | null) {
    return useQuery({
        queryKey: ['user-settings'],
        queryFn: async () => {
            const response = await fetch('/api/settings');

            if (!response.ok) {
                throw new Error('Failed to fetch settings');
            }

            return response.json() as Promise<UserSettings>;
        },
        initialData: initialData || undefined,
        staleTime: 10 * 60 * 1000, // 10 minutes - settings rarely change
    });
}
