/**
 * Offline-first mutation hook factory
 * 
 * Creates React Query mutations that work offline with automatic sync
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PendingOperation, syncQueue } from './sync-queue';

type OperationType = PendingOperation['type'];

interface OfflineMutationOptions<TData, TVariables> {
    operationType: OperationType;
    optimisticUpdate?: (variables: TVariables, queryClient: any) => void;
    onSyncSuccess?: (data: TData) => void;
    invalidateQueries?: string[][];
}

/**
 * Creates an offline-first mutation
 * 
 * Pattern:
 * 1. Enqueue operation (instant, never fails)
 * 2. Apply optimistic update (instant UI)
 * 3. Background sync (when online)
 * 4. Invalidate queries on success
 */
export function useOfflineMutation<TData = any, TVariables = any>(
    options: OfflineMutationOptions<TData, TVariables>
) {
    const queryClient = useQueryClient();

    return useMutation<string, Error, TVariables>({
        mutationFn: async (variables: TVariables) => {
            // Enqueue for background sync
            const opId = syncQueue.enqueue({
                type: options.operationType,
                payload: variables,
            });

            // Apply optimistic update if provided
            if (options.optimisticUpdate) {
                options.optimisticUpdate(variables, queryClient);
            }

            return opId;
        },

        onSuccess: (opId, variables) => {
            // Invalidate queries after optimistic update
            if (options.invalidateQueries) {
                options.invalidateQueries.forEach(queryKey => {
                    queryClient.invalidateQueries({ queryKey });
                });
            }

            if (options.onSyncSuccess) {
                options.onSyncSuccess(variables as any);
            }
        },

        // Never errors (operation is queued)
        onError: () => {
            // This should never happen since enqueue never fails
            console.error('[OfflineMutation] Unexpected error');
        },
    });
}
