/**
 * Sync Queue Manager - localStorage-based
 * 
 * Handles offline-first mutations with background sync.
 * All operations are queued in localStorage and synced when online.
 */

export interface PendingOperation {
    id: string;
    type: 'CREATE_SESSION' | 'LOG_SET' | 'TOGGLE_WARMUP' | 'COMPLETE_EXERCISE' | 'COMPLETE_SESSION' | 'ABANDON_SESSION';
    payload: any;
    createdAt: number;
    attempts: number;
    synced: boolean;
    error?: string;
}

const STORAGE_KEY = 'workout-pending-ops';
const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 3000, 5000, 10000, 30000]; // Exponential backoff

export class SyncQueue {
    private isProcessing = false;
    private listeners: Set<() => void> = new Set();

    constructor() {
        // Listen for online event
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.processQueue());
        }
    }

    /**
     * Get all pending operations from localStorage
     */
    private getPendingOps(): PendingOperation[] {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Save pending operations to localStorage
     */
    private setPendingOps(ops: PendingOperation[]): void {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
        this.notifyListeners();
    }

    /**
     * Add operation to queue (instant, never fails)
     */
    enqueue(operation: Omit<PendingOperation, 'id' | 'createdAt' | 'attempts' | 'synced'>): string {
        const id = crypto.randomUUID();
        const ops = this.getPendingOps();

        ops.push({
            ...operation,
            id,
            createdAt: Date.now(),
            attempts: 0,
            synced: false,
        });

        this.setPendingOps(ops);

        // Trigger background sync (non-blocking)
        setTimeout(() => this.processQueue(), 100);

        return id;
    }

    /**
     * Process all pending operations
     */
    async processQueue(): Promise<void> {
        if (this.isProcessing) return;
        if (typeof window === 'undefined') return;
        if (!navigator.onLine) {
            return;
        }

        this.isProcessing = true;
        const ops = this.getPendingOps().filter(op => !op.synced);

        for (const op of ops) {
            if (op.attempts >= MAX_RETRIES) {
                // Enhanced logging with full operation details
                console.error('[SyncQueue] ❌ MAX RETRIES EXCEEDED:', {
                    id: op.id,
                    type: op.type,
                    attempts: op.attempts,
                    createdAt: new Date(op.createdAt).toISOString(),
                    lastError: op.error,
                    payload: JSON.stringify(op.payload, null, 2),
                });
                this.markFailed(op.id, 'Max retries exceeded');
                continue;
            }

            try {
                await this.executeOperation(op);
                this.markSynced(op.id);
            } catch (error: any) {
                // Enhanced error logging with full context
                console.error('[SyncQueue] ❌ Operation failed:', {
                    id: op.id,
                    type: op.type,
                    attempts: op.attempts + 1,
                    errorMessage: error.message,
                    errorStack: error.stack,
                    payload: JSON.stringify(op.payload, null, 2),
                    nextRetryIn: RETRY_DELAYS[Math.min(op.attempts, RETRY_DELAYS.length - 1)] + 'ms',
                });
                this.incrementAttempts(op.id, error.message);

                // Schedule retry with exponential backoff
                const delay = RETRY_DELAYS[Math.min(op.attempts, RETRY_DELAYS.length - 1)];
                setTimeout(() => this.processQueue(), delay);
            }
        }

        // Cleanup old synced operations (older than 24h)
        this.cleanupOldOps();

        this.isProcessing = false;
    }

    /**
     * Execute a single operation (API call)
     */
    private async executeOperation(op: PendingOperation): Promise<void> {
        let url: string;
        let method = 'POST';
        let body = op.payload;

        switch (op.type) {
            case 'CREATE_SESSION':
                url = '/api/workout-session';
                break;
            case 'LOG_SET':
                url = '/api/workout/sets';
                break;
            case 'TOGGLE_WARMUP':
                url = '/api/workout/warmup/toggle';
                break;
            case 'COMPLETE_EXERCISE':
                url = '/api/workout/exercise/complete';
                break;
            case 'COMPLETE_SESSION':
                url = '/api/workout/complete';
                break;
            case 'ABANDON_SESSION':
                url = '/api/workout/abandon';
                break;
            default:
                throw new Error(`Unknown operation type: ${op.type}`);
        }


        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            let errorMessage: string;

            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || response.statusText;
            } catch {
                errorMessage = await response.text() || response.statusText;
            }

            // Add status code context
            const statusContext = {
                400: 'Bad Request - Invalid payload',
                401: 'Unauthorized - Authentication required',
                403: 'Forbidden - Access denied',
                404: 'Not Found - API endpoint does not exist',
                409: 'Conflict - Resource already exists or state mismatch',
                500: 'Internal Server Error',
                502: 'Bad Gateway - Server is down',
                503: 'Service Unavailable - Server overloaded',
            }[response.status] || 'Unknown error';

            throw new Error(`${response.status} ${statusContext}: ${errorMessage}`);
        }

        return response.json();
    }

    /**
     * Mark operation as synced
     */
    private markSynced(opId: string): void {
        const ops = this.getPendingOps();
        const op = ops.find(o => o.id === opId);
        if (op) {
            op.synced = true;
            this.setPendingOps(ops);
        }
    }

    /**
     * Increment attempt count
     */
    private incrementAttempts(opId: string, error: string): void {
        const ops = this.getPendingOps();
        const op = ops.find(o => o.id === opId);
        if (op) {
            op.attempts++;
            op.error = error;
            this.setPendingOps(ops);
        }
    }

    /**
     * Mark operation as permanently failed
     */
    private markFailed(opId: string, reason: string): void {
        const ops = this.getPendingOps();
        const idx = ops.findIndex(o => o.id === opId);

        if (idx !== -1) {
            const op = ops[idx];

            // Log the failure with ORIGINAL error (not overwriting it)
            console.error('[SyncQueue] 🗑️ Removing permanently failed operation:', {
                id: op.id,
                type: op.type,
                originalError: op.error, // This is the REAL error from the API
                reason,
            });

            // REMOVE the operation from the queue entirely
            ops.splice(idx, 1);
            this.setPendingOps(ops);
        }
    }

    /**
     * Cleanup operations older than 24 hours
     */
    private cleanupOldOps(): void {
        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;

        const ops = this.getPendingOps();
        const filtered = ops.filter(op => !op.synced || op.createdAt > oneDayAgo);

        if (filtered.length < ops.length) {
            this.setPendingOps(filtered);
        }
    }

    /**
     * Get pending operation count (for UI display)
     */
    getPendingCount(): number {
        return this.getPendingOps().filter(op => !op.synced).length;
    }

    /**
     * Subscribe to queue changes
     */
    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Notify all listeners
     */
    private notifyListeners(): void {
        this.listeners.forEach(listener => listener());
    }

    /**
     * Force sync now (for manual trigger)
     */
    async forceSyncNow(): Promise<void> {
        await this.processQueue();
    }

    /**
     * Debug: Get all operations (for inspection in console)
     */
    getAllOperations(): PendingOperation[] {
        return this.getPendingOps();
    }

    /**
     * Debug: Clear all failed operations
     */
    clearFailedOperations(): void {
        const ops = this.getPendingOps();
        const filtered = ops.filter(op => !op.error || op.error === '');
        this.setPendingOps(filtered);
    }

    /**
     * Debug: Clear ALL operations (nuclear option)
     */
    clearAllOperations(): void {
        console.warn('[SyncQueue] ⚠️ Clearing ALL pending operations');
        this.setPendingOps([]);
    }
}

// Singleton instance
export const syncQueue = new SyncQueue();

// Debug interface (accessible in browser console as window.debugSyncQueue)
if (typeof window !== 'undefined') {
    (window as any).debugSyncQueue = {
        inspectQueue: () => {
            const ops = syncQueue.getAllOperations();
            console.table(ops.map(op => ({
                id: op.id.slice(0, 8),
                type: op.type,
                attempts: op.attempts,
                synced: op.synced,
                error: op.error || 'none',
                age: Math.round((Date.now() - op.createdAt) / 1000) + 's',
            })));
            return ops;
        },
        clearFailed: () => syncQueue.clearFailedOperations(),
        clearAll: () => syncQueue.clearAllOperations(),
        forceSync: () => syncQueue.forceSyncNow(),
        help: () => {
            console.info(`
🔍 SyncQueue Debug Commands:
  debugSyncQueue.inspectQueue() - View all pending operations
  debugSyncQueue.clearFailed()  - Remove failed operations
  debugSyncQueue.clearAll()     - Clear ALL operations (⚠️ use with caution)
  debugSyncQueue.forceSync()    - Force sync now
  debugSyncQueue.help()         - Show this help
            `);
        }
    };
}
