/**
 * Production-grade date utilities with timezone handling and day boundary customization
 * 
 * Key principles:
 * 1. Store daily summaries as UTC midnight (e.g., 2025-12-16T00:00:00.000Z)
 * 2. Respect user's day cutoff time (default 5:30 AM)
 * 3. Activities before cutoff belong to previous day
 * 4. DB timezone settings are irrelevant - we control everything
 */

// Configuration - can be overridden by user settings
export const DEFAULT_CUTOFF_HOUR = 5;
export const DEFAULT_CUTOFF_MINUTE = 30;

/**
 * Get normalized date key for DailyLog (UTC midnight, respecting cutoff)
 * 
 * Example with 5:30 AM cutoff:
 * - Dec 17, 12:30 AM → Returns Dec 16 00:00 UTC (still "yesterday")
 * - Dec 17,  5:45 AM → Returns Dec 17 00:00 UTC (new "today")
 * 
 * @param localDate - Optional date in user's timezone (defaults to now)
 * @param cutoffHour - Hour for day boundary (0-23, default 5)
 * @param cutoffMinute - Minute for day boundary (0-59, default 30)
 */
export function getDailyLogKey(
    localDate?: Date,
    cutoffHour: number = DEFAULT_CUTOFF_HOUR,
    cutoffMinute: number = DEFAULT_CUTOFF_MINUTE
): Date {
    const date = localDate || new Date();

    const hour = date.getHours();
    const minute = date.getMinutes();

    // Check if current time is before the cutoff
    const isBeforeCutoff =
        (hour < cutoffHour) ||
        (hour === cutoffHour && minute < cutoffMinute);

    let year = date.getFullYear();
    let month = date.getMonth();
    let day = date.getDate();

    if (isBeforeCutoff) {
        // Activities before cutoff belong to previous calendar day
        const adjustedDate = new Date(year, month, day);
        adjustedDate.setDate(adjustedDate.getDate() - 1);

        year = adjustedDate.getFullYear();
        month = adjustedDate.getMonth();
        day = adjustedDate.getDate();
    }

    // Return UTC midnight for that adjusted date
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
}

/**
 * Check if current time is past the day cutoff
 * Used to determine if Morning Check-In should appear
 * 
 * @param date - Date to check (defaults to now)
 * @param cutoffHour - Hour for day boundary
 * @param cutoffMinute - Minute for day boundary
 */
export function isPastDayCutoff(
    date?: Date,
    cutoffHour: number = DEFAULT_CUTOFF_HOUR,
    cutoffMinute: number = DEFAULT_CUTOFF_MINUTE
): boolean {
    const now = date || new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    return (hour > cutoffHour) ||
        (hour === cutoffHour && minute >= cutoffMinute);
}

/**
 * Get start/end of day in UTC for querying event logs
 * Respects the user's day cutoff
 * 
 * @param localDate - Optional date in user's timezone (defaults to now)
 * @param cutoffHour - Hour for day boundary
 * @param cutoffMinute - Minute for day boundary
 */
export function getUTCDayBounds(
    localDate?: Date,
    cutoffHour: number = DEFAULT_CUTOFF_HOUR,
    cutoffMinute: number = DEFAULT_CUTOFF_MINUTE
): { start: Date; end: Date } {
    const date = localDate || new Date();

    // Get the adjusted date based on cutoff
    const dayKey = getDailyLogKey(date, cutoffHour, cutoffMinute);
    const year = dayKey.getUTCFullYear();
    const month = dayKey.getUTCMonth();
    const day = dayKey.getUTCDate();

    return {
        start: new Date(Date.UTC(year, month, day, 0, 0, 0, 0)),
        end: new Date(Date.UTC(year, month, day, 23, 59, 59, 999))
    };
}

/**
 * Get date N days ago (UTC normalized, respecting cutoff)
 * 
 * @param days - Number of days to go back
 * @param cutoffHour - Hour for day boundary
 * @param cutoffMinute - Minute for day boundary
 */
export function daysAgo(
    days: number,
    cutoffHour: number = DEFAULT_CUTOFF_HOUR,
    cutoffMinute: number = DEFAULT_CUTOFF_MINUTE
): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return getDailyLogKey(date, cutoffHour, cutoffMinute);
}

/**
 * Check if a date is today (in user's timezone, respecting cutoff)
 * 
 * @param date - Date to check
 * @param cutoffHour - Hour for day boundary
 * @param cutoffMinute - Minute for day boundary
 */
export function isToday(
    date: Date,
    cutoffHour: number = DEFAULT_CUTOFF_HOUR,
    cutoffMinute: number = DEFAULT_CUTOFF_MINUTE
): boolean {
    const todayKey = getDailyLogKey(new Date(), cutoffHour, cutoffMinute);
    const checkKey = getDailyLogKey(date, cutoffHour, cutoffMinute);
    return todayKey.getTime() === checkKey.getTime();
}

/**
 * Check if two dates are the same day (respecting cutoff)
 * 
 * @param date1 - First date
 * @param date2 - Second date
 * @param cutoffHour - Hour for day boundary
 * @param cutoffMinute - Minute for day boundary
 */
export function isSameDay(
    date1: Date,
    date2: Date,
    cutoffHour: number = DEFAULT_CUTOFF_HOUR,
    cutoffMinute: number = DEFAULT_CUTOFF_MINUTE
): boolean {
    const key1 = getDailyLogKey(date1, cutoffHour, cutoffMinute);
    const key2 = getDailyLogKey(date2, cutoffHour, cutoffMinute);
    return key1.getTime() === key2.getTime();
}

/**
 * Format date for display
 * 
 * @param date - Date to format
 */
export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
    }).format(date);
}
