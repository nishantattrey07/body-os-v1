/**
 * Offline detection hook
 * 
 * Tracks online/offline status and provides sync visibility
 */

import { useEffect, useState } from 'react';
import { syncQueue } from './sync-queue';

export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(
        typeof window !== 'undefined' ? navigator.onLine : true
    );

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}

export function useSyncQueue() {
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        // Initial count
        setPendingCount(syncQueue.getPendingCount());

        // Subscribe to changes
        const unsubscribe = syncQueue.subscribe(() => {
            setPendingCount(syncQueue.getPendingCount());
        });

        return unsubscribe;
    }, []);

    return {
        pendingCount,
        forceSyncNow: () => syncQueue.forceSyncNow(),
    };
}
