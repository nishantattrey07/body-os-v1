import { getTimezoneHeaders } from "@/lib/api-client";
import type { DailyLog } from "@/lib/queries/useDailyLog";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface InventoryItem {
    id: string;
    name: string;
    brand?: string | null;
    icon: string;
    proteinPerUnit: number;
    carbsPerUnit: number;
    fatPerUnit: number;
    fiberPerUnit: number;
    sugarPerUnit: number;
    caloriesPerUnit: number;
    sodiumPerUnit?: number | null;
    cholesterolPerUnit?: number | null;
    volumePerUnit: number;
    defaultUnit: string;
    isActive: boolean;
}

interface LogNutritionInput {
    item: InventoryItem;
    quantity?: number;
    mealType?: string;
}

/**
 * Mutation hook for logging nutrition with optimistic updates
 * 
 * Features:
 * - Sends client timezone for correct day boundary calculation
 * - Instant UI feedback (optimistic update)
 * - Automatic rollback on error
 * - Server snapshots macros (history safe!)
 * - Aggregates fiber, sodium, cholesterol
 */
export function useLogNutrition() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ item, quantity = 1, mealType }: LogNutritionInput) => {
            const response = await fetch("/api/nutrition/log", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getTimezoneHeaders(),
                },
                body: JSON.stringify({
                    inventoryItemId: item.id,
                    qty: quantity,
                    mealType,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to log nutrition");
            }

            return response.json();
        },

        // Optimistic Update - runs immediately before server call
        onMutate: async ({ item, quantity = 1 }) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.dailyLog() });

            // Snapshot current value for rollback
            const previousLog = queryClient.getQueryData<DailyLog>(queryKeys.dailyLog());

            // Optimistically update the cache
            if (previousLog) {
                queryClient.setQueryData<DailyLog>(queryKeys.dailyLog(), {
                    ...previousLog,
                    proteinTotal: previousLog.proteinTotal + (item.proteinPerUnit || 0) * quantity,
                    carbsTotal: previousLog.carbsTotal + (item.carbsPerUnit || 0) * quantity,
                    fatsTotal: previousLog.fatsTotal + (item.fatPerUnit || 0) * quantity,
                    fiberTotal: (previousLog.fiberTotal || 0) + (item.fiberPerUnit || 0) * quantity,
                    caloriesTotal: previousLog.caloriesTotal + (item.caloriesPerUnit || 0) * quantity,
                    sodiumTotal: previousLog.sodiumTotal
                        ? previousLog.sodiumTotal + (item.sodiumPerUnit || 0) * quantity
                        : (item.sodiumPerUnit || 0) * quantity || null,
                    cholesterolTotal: previousLog.cholesterolTotal
                        ? previousLog.cholesterolTotal + (item.cholesterolPerUnit || 0) * quantity
                        : (item.cholesterolPerUnit || 0) * quantity || null,
                });
            }

            // Return context for rollback
            return { previousLog };
        },

        // On Error - rollback to previous value
        onError: (_error, _variables, context) => {
            if (context?.previousLog) {
                queryClient.setQueryData(queryKeys.dailyLog(), context.previousLog);
            }
        },

        // NOTE: We deliberately DO NOT have onSuccess or onSettled here.
        // Trust optimistic updates - cache refetches on window focus for eventual consistency.
    });
}
