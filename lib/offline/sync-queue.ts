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
            console.log('[SyncQueue] Offline, waiting for connection...');
            return;
        }

        this.isProcessing = true;
        const ops = this.getPendingOps().filter(op => !op.synced);

        console.log(`[SyncQueue] Processing ${ops.length} pending operations`);

        for (const op of ops) {
            if (op.attempts >= MAX_RETRIES) {
                console.error('[SyncQueue] Max retries exceeded for operation:', op);
                this.markFailed(op.id, 'Max retries exceeded');
                continue;
            }

            try {
                await this.executeOperation(op);
                this.markSynced(op.id);
                console.log('[SyncQueue] ✅ Operation synced:', op.type);
            } catch (error: any) {
                console.error('[SyncQueue] ❌ Operation failed:', op.type, error);
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
                url = `/api/workout/exercises/${op.payload.exerciseId}/complete`;
                break;
            case 'COMPLETE_SESSION':
                url = `/api/workout-session/${op.payload.sessionId}/complete`;
                break;
            case 'ABANDON_SESSION':
                url = `/api/workout-session/${op.payload.sessionId}/abandon`;
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
            const error = await response.text();
            throw new Error(error || response.statusText);
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
    private markFailed(opId: string, error: string): void {
        const ops = this.getPendingOps();
        const op = ops.find(o => o.id === opId);
        if (op) {
            op.error = error;
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
            console.log(`[SyncQueue] Cleaned up ${ops.length - filtered.length} old operations`);
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
}

// Singleton instance
export const syncQueue = new SyncQueue();
