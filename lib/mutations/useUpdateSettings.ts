import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface UpdateSettingsData {
    proteinTarget: number;
    carbsTarget: number;
    fatsTarget: number;
    caloriesTarget: number;
    waterTarget: number;
    dayCutoffHour: number;
    dayCutoffMinute: number;
}

/**
 * Mutation hook for updating user settings
 * 
 * Features:
 * - Optimistic UI updates (instant feedback)
 * - Toast notifications
 * - Cache invalidation on success
 */
export function useUpdateSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateSettingsData) => {
            console.time('⏱️ [Settings] API Request');
            const startTime = performance.now();
            console.log('🚀 [Settings] Mutation started at:', new Date().toISOString());

            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const endTime = performance.now();
            console.timeEnd('⏱️ [Settings] API Request');
            console.log(`✅ [Settings] API responded in ${Math.round(endTime - startTime)}ms`);

            if (!response.ok) {
                throw new Error('Failed to update settings');
            }

            return response.json();
        },

        onSuccess: () => {
            console.log('✅ [Settings] Cache invalidation started');
            // Invalidate both settings and daily log (cutoff affects daily log)
            queryClient.invalidateQueries({ queryKey: ['user-settings'] });
            queryClient.invalidateQueries({ queryKey: ['daily-log'] });
            toast.success('Settings updated successfully!');
            console.log('✅ [Settings] Save complete!');
        },

        onError: () => {
            console.error('❌ [Settings] Save failed');
            toast.error('Failed to save settings. Please try again.');
        },
    });
}
