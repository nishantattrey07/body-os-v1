import { getTimezoneHeaders } from "@/lib/api-client";
import type { DailyLog } from "@/lib/queries/useDailyLog";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface QuickAddInput {
    name: string;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    calories: number;
    sodium?: number | null;
    cholesterol?: number | null;
    quantity?: number;
    mealType?: string;
}

/**
 * Mutation hook for quick-add nutrition (no inventory item needed)
 * 
 * Use this for one-off foods (random cookie at party, etc.)
 * Sends client timezone for correct day boundary calculation
 */
export function useQuickAddNutrition() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: QuickAddInput) => {
            const response = await fetch("/api/nutrition/quick-add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getTimezoneHeaders(),
                },
                body: JSON.stringify(input),
            });

            if (!response.ok) {
                throw new Error("Failed to quick-add nutrition");
            }

            return response.json();
        },

        // Optimistic Update
        onMutate: async (input) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.dailyLog() });

            const previousLog = queryClient.getQueryData<DailyLog>(queryKeys.dailyLog());

            const qty = input.quantity || 1;

            if (previousLog) {
                queryClient.setQueryData<DailyLog>(queryKeys.dailyLog(), {
                    ...previousLog,
                    proteinTotal: previousLog.proteinTotal + input.protein * qty,
                    carbsTotal: previousLog.carbsTotal + input.carbs * qty,
                    fatsTotal: previousLog.fatsTotal + input.fat * qty,
                    fiberTotal: (previousLog.fiberTotal || 0) + (input.fiber || 0) * qty,
                    caloriesTotal: previousLog.caloriesTotal + input.calories * qty,
                    sodiumTotal: previousLog.sodiumTotal
                        ? previousLog.sodiumTotal + (input.sodium || 0) * qty
                        : (input.sodium || 0) * qty || null,
                    cholesterolTotal: previousLog.cholesterolTotal
                        ? previousLog.cholesterolTotal + (input.cholesterol || 0) * qty
                        : (input.cholesterol || 0) * qty || null,
                });
            }

            return { previousLog };
        },

        // Rollback on error
        onError: (_error, _variables, context) => {
            if (context?.previousLog) {
                queryClient.setQueryData(queryKeys.dailyLog(), context.previousLog);
            }
        },
    });
}
