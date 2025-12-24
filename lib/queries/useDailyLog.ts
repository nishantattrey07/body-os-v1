import { useQuery } from '@tanstack/react-query';

export interface DailyLog {
    id: string;
    date: Date | string;
    weight: number | null;
    sleepHours: number | null;
    sleepQuality: number | null;
    mood: string | null;
    bloated: boolean;
    proteinTotal: number;
    carbsTotal: number;
    fatsTotal: number;
    caloriesTotal: number;
    waterTotal: number;
    serverTimestamp?: string;
    updatedAt?: Date | string;
}

/**
 * Query hook for today's daily log
 * 
 * Features:
 * - Uses custom day cutoff from user settings
 * - Cached with localStorage persistence
 * - Supports timestamp-based 304 optimization
 * - Multi-device sync on window focus
 */
export function useDailyLog(initialData?: DailyLog | null) {
    return useQuery({
        queryKey: ['daily-log', 'today'],
        queryFn: async ({ queryKey }) => {
            // Get cached data for timestamp optimization
            const cached = initialData;

            const headers: HeadersInit = {
                'Cache-Control': 'no-cache',
            };

            // Add If-Modified-Since if we have cached timestamp
            if (cached?.serverTimestamp) {
                headers['If-Modified-Since'] = cached.serverTimestamp;
            }

            const response = await fetch('/api/daily-log', { headers });

            // 304 Not Modified - use cache
            if (response.status === 304 && cached) {
                console.log('[Query] Daily log: using cache (304)');
                return cached;
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch daily log: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('[Query] Daily log: fresh from server');
            return data as DailyLog | null;
        },
        initialData,
        staleTime: 2 * 60 * 1000, // 2 minutes
        // Automatically persisted to localStorage via provider
    });
}
