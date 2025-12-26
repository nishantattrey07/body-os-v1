import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";

export interface InventoryItem {
    id: string;
    name: string;
    brand?: string | null;
    barcode?: string | null;
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
    costPerUnit: number;
    isActive: boolean;
    maxDailyQty?: number | null;
}

/**
 * Query hook for fetching active inventory items
 */
export function useInventory() {
    return useQuery({
        queryKey: queryKeys.inventory(),
        queryFn: async () => {
            const response = await fetch("/api/inventory");

            if (!response.ok) {
                throw new Error("Failed to fetch inventory");
            }

            return response.json() as Promise<InventoryItem[]>;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
